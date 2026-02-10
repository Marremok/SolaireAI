import { NextResponse } from "next/server";
import { getProUserOrNull } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/claude";
import { z } from "zod";

const StudyScheduleSchema = z.object({
  sessions: z.array(
    z.object({
      date: z.string(),
      durationMinutes: z.number(),
      method: z.string(),
    })
  ),
});

const studyScheduleToolSchema = {
  name: "create_study_schedule",
  description: "Create an optimized study schedule for an exam based on constraints",
  input_schema: {
    type: "object" as const,
    properties: {
      sessions: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            date: { type: "string" as const, description: "ISO date string (YYYY-MM-DD)" },
            durationMinutes: { type: "number" as const, description: "Session duration in minutes" },
            method: { type: "string" as const, description: "Study method from exam's allowed methods" },
          },
          required: ["date", "durationMinutes", "method"],
        },
      },
    },
    required: ["sessions"],
  },
};

function getFriendlyErrorMessage(error: Error): string {
  const msg = error.message.toLowerCase();

  if (msg.includes("no available dates")) {
    return "Cannot create schedule: No study days available. Try reducing rest days or moving exam date further out.";
  }
  if (msg.includes("capacity too low")) {
    return "Cannot create schedule: Daily capacity is too low for the preferred session length.";
  }
  if (msg.includes("all sessions filtered")) {
    return "Cannot create schedule: Unable to fit sessions within daily capacity limits. Try increasing study hours or reducing exam targets.";
  }
  if (msg.includes("no available study days")) {
    return "Cannot create schedule: All days are marked as rest days. Go to Settings and reduce rest days.";
  }
  if (msg.includes("exam is too soon") || msg.includes("too low for even one session")) {
    return "Cannot create schedule: The exam is too soon or your target study hours are too low to fit even one session.";
  }
  if (msg.includes("exam date is today or in the past")) {
    return "Cannot create schedule: The exam date has already passed or is today.";
  }
  return error.message;
}

function deriveConstraints(
  exam: {
    date: Date;
    hoursPerWeek: number | null;
    preferredSessionLengthMinutes: number;
  },
  restDays: string[],
  otherSessions: { date: Date; duration: number }[]
) {
  // Calculate available days per week (exclude rest days)
  const availableDaysPerWeek = 7 - restDays.length;

  if (availableDaysPerWeek === 0) {
    throw new Error("No available study days - all days marked as rest days");
  }

  // Exam-driven daily cap: 2x preferred session length, max 4 hours
  const maxMinutesPerDay = Math.min(exam.preferredSessionLengthMinutes * 2, 240);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const examDate = new Date(exam.date);
  examDate.setUTCHours(0, 0, 0, 0);

  const getDayName = (date: Date): string => {
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    return days[date.getUTCDay()];
  };

  // Generate available dates (excluding rest days)
  const availableDates: string[] = [];
  const current = new Date(today);
  while (current < examDate) {
    const dayName = getDayName(current);
    if (!restDays.includes(dayName)) {
      availableDates.push(current.toISOString().slice(0, 10));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  if (availableDates.length === 0) {
    throw new Error("No available dates between today and exam (check rest days)");
  }

  // Calculate existing minutes by date
  const existingMinutesByDate: Record<string, number> = {};
  for (const session of otherSessions) {
    const dateKey = new Date(session.date).toISOString().slice(0, 10);
    existingMinutesByDate[dateKey] =
      (existingMinutesByDate[dateKey] ?? 0) + session.duration;
  }

  // Deterministic distribution calculation
  const targetHoursPerWeek = exam.hoursPerWeek ?? 5;
  const sessionsPerWeek = Math.ceil(
    targetHoursPerWeek / (exam.preferredSessionLengthMinutes / 60)
  );
  const weeksUntilExam = availableDates.length / availableDaysPerWeek;
  const totalSessionsNeeded = Math.min(
    Math.max(1, Math.round(weeksUntilExam * sessionsPerWeek)),
    availableDates.length // cap: max 1 session per available day
  );

  return {
    maxMinutesPerDay,
    availableDates,
    existingMinutesByDate,
    preferredSessionLength: exam.preferredSessionLengthMinutes,
    sessionsPerWeek,
    totalSessionsNeeded,
    restDays,
  };
}

/**
 * Deterministic schedule generator — used as fallback when AI output
 * fails validation, or could be used as primary generator.
 * Groups available dates into 7-day weeks, picks evenly-spaced dates
 * per week, assigns methods in round-robin order.
 */
function generateDeterministicSchedule(
  constraints: {
    availableDates: string[];
    totalSessionsNeeded: number;
    preferredSessionLength: number;
    sessionsPerWeek: number;
    maxMinutesPerDay: number;
    existingMinutesByDate: Record<string, number>;
  },
  studyMethods: string[]
): { date: string; durationMinutes: number; method: string }[] {
  const {
    availableDates,
    totalSessionsNeeded,
    preferredSessionLength,
    sessionsPerWeek,
    maxMinutesPerDay,
    existingMinutesByDate,
  } = constraints;

  if (availableDates.length === 0 || totalSessionsNeeded <= 0) return [];

  const sessions: { date: string; durationMinutes: number; method: string }[] =
    [];
  let methodIndex = 0;
  const dailyUsed = { ...existingMinutesByDate };

  // Group dates into 7-day windows (weeks)
  const weeks: string[][] = [];
  let weekStart = new Date(availableDates[0] + "T00:00:00Z");
  let currentWeek: string[] = [];

  for (const dateStr of availableDates) {
    const d = new Date(dateStr + "T00:00:00Z");
    const daysDiff =
      (d.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff >= 7) {
      if (currentWeek.length > 0) weeks.push(currentWeek);
      currentWeek = [];
      weekStart = d;
    }
    currentWeek.push(dateStr);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // For each week, pick evenly-spaced dates with enough capacity
  for (const week of weeks) {
    if (sessions.length >= totalSessionsNeeded) break;

    const sessionsThisWeek = Math.min(
      sessionsPerWeek,
      totalSessionsNeeded - sessions.length
    );

    // Filter to dates with enough remaining capacity
    const viable = week.filter((d) => {
      const used = dailyUsed[d] ?? 0;
      return used + preferredSessionLength <= maxMinutesPerDay;
    });

    if (viable.length === 0) continue;

    const pick = Math.min(sessionsThisWeek, viable.length);
    const interval = viable.length / pick;

    for (let i = 0; i < pick; i++) {
      const idx = Math.floor(i * interval);
      const date = viable[idx];
      sessions.push({
        date,
        durationMinutes: preferredSessionLength,
        method: studyMethods[methodIndex % studyMethods.length],
      });
      dailyUsed[date] = (dailyUsed[date] ?? 0) + preferredSessionLength;
      methodIndex++;
    }
  }

  return sessions;
}

/**
 * Strictly validate AI output against locked constraints.
 * Returns the sessions if valid, or null if any hard rule is violated.
 */
function strictValidateAIOutput(
  aiSessions: { date: string; durationMinutes: number; method: string }[],
  constraints: {
    totalSessionsNeeded: number;
    preferredSessionLength: number;
    maxMinutesPerDay: number;
    availableDates: string[];
    existingMinutesByDate: Record<string, number>;
  },
  studyMethods: string[]
): { date: string; durationMinutes: number; method: string }[] | null {
  const availableDatesSet = new Set(constraints.availableDates);

  // Rule 1: Exact session count
  if (aiSessions.length !== constraints.totalSessionsNeeded) return null;

  // Rule 2: Every duration must match exactly
  if (
    aiSessions.some(
      (s) => s.durationMinutes !== constraints.preferredSessionLength
    )
  )
    return null;

  // Rule 3-5: All dates valid, methods valid, capacity respected
  const dailyUsed = { ...constraints.existingMinutesByDate };
  for (const session of aiSessions) {
    if (!availableDatesSet.has(session.date)) return null;
    if (!studyMethods.includes(session.method)) return null;

    const currentUsed = dailyUsed[session.date] ?? 0;
    if (currentUsed + session.durationMinutes > constraints.maxMinutesPerDay)
      return null;

    dailyUsed[session.date] = currentUsed + session.durationMinutes;
  }

  return aiSessions;
}

export async function POST(req: Request) {
  try {
    // CRITICAL: Require PRO subscription for AI schedule generation
    const dbUser = await getProUserOrNull();
    if (!dbUser) {
      return NextResponse.json(
        { error: "PRO subscription required to generate schedules" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const examId: number = body.examId;
    if (!examId || typeof examId !== "number") {
      return NextResponse.json(
        { error: "examId is required" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.userId !== dbUser.id) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Guard: exam date must be in the future
    const examDate = new Date(exam.date);
    examDate.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (examDate <= today) {
      return NextResponse.json({
        success: false,
        error: "Cannot create schedule: exam date is today or in the past.",
      });
    }

    // Atomic guard: only proceed if scheduleStatus is NONE
    const guardResult = await prisma.exam.updateMany({
      where: { id: examId, scheduleStatus: "NONE" },
      data: { scheduleStatus: "GENERATING" },
    });
    if (guardResult.count === 0) {
      return NextResponse.json(
        { status: "already_scheduled" },
        { status: 409 }
      );
    }

    // From here, any error must set scheduleStatus to FAILED
    try {
      const fullExam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { user: true },
      });
      if (!fullExam) throw new Error("Exam not found after guard");

      const otherSessions = await prisma.studySession.findMany({
        where: { userId: dbUser.id, examId: { not: examId } },
      });

      const constraints = deriveConstraints(
        fullExam,
        fullExam.user.restDays,
        otherSessions
      );

      if (constraints.availableDates.length === 0) {
        await prisma.exam.update({
          where: { id: examId },
          data: { scheduleStatus: "FAILED" },
        });
        return NextResponse.json({
          success: false,
          error: "No available dates between today and exam date. Check rest day settings - you may have too many rest days or exam is too soon.",
        });
      }

      // Guard: need at least 1 session to create a schedule
      if (constraints.totalSessionsNeeded <= 0) {
        await prisma.exam.update({
          where: { id: examId },
          data: { scheduleStatus: "FAILED" },
        });
        return NextResponse.json({
          success: false,
          error: "Cannot create schedule: exam is too soon or target study hours are too low for even one session.",
        });
      }

      const studyMethods = fullExam.studyMethods as string[];
      const examDateStr = new Date(fullExam.date)
        .toISOString()
        .slice(0, 10);

      // ── LOCKED VALUES (pre-computed, non-negotiable) ──────────
      const locked = {
        sessionCount: constraints.totalSessionsNeeded,
        sessionDuration: constraints.preferredSessionLength,
        sessionsPerWeek: constraints.sessionsPerWeek,
      };

      const claudeInput = {
        locked,
        exam: {
          title: fullExam.title,
          subject: fullExam.subject,
          preferences: fullExam.preferences,
          examDate: examDateStr,
          studyMethods,
        },
        constraints: {
          maxMinutesPerDay: constraints.maxMinutesPerDay,
          availableDates: constraints.availableDates,
          existingMinutesByDate: constraints.existingMinutesByDate,
          restDays: constraints.restDays,
        },
      };

      const systemPrompt = `You are a deterministic study schedule placer. You do NOT decide how many sessions or how long they are — those are pre-computed and LOCKED. Your ONLY job is to pick WHICH dates from availableDates to place sessions on, and assign study methods.

LOCKED VALUES (non-negotiable — do NOT change these under any circumstance):
- sessionCount: output EXACTLY this many sessions
- sessionDuration: every session MUST have exactly this duration in minutes
- sessionsPerWeek: target sessions per 7-day window

HARD RULES (priority order — never violate):
1. Output EXACTLY locked.sessionCount sessions. Not more, not less.
2. Every session durationMinutes MUST equal locked.sessionDuration exactly.
3. ONLY use dates from constraints.availableDates.
4. NEVER place a session on a date where existingMinutesByDate[date] + sessionDuration > maxMinutesPerDay.
5. Distribute sessions EVENLY across weeks. Each 7-day window should have ~sessionsPerWeek sessions.
6. Cycle through exam.studyMethods in order, repeating from the start. Do not repeat the same method consecutively if there are multiple methods.

SOFT RULES (follow if possible, NEVER break hard rules 1-6 to satisfy these):
7. If exam.preferences is non-null, use it to influence WHICH dates you pick within each week.
8. Preferences may NEVER reduce session count, change duration, or skip entire weeks.

DATE SELECTION ALGORITHM:
- Group availableDates into 7-day windows starting from the first date.
- For each week, select sessionsPerWeek dates, spaced as evenly as possible within the week.
- If a week has fewer viable dates than sessionsPerWeek, use all viable dates in that week.
- A date is "viable" if existingMinutesByDate[date] + sessionDuration <= maxMinutesPerDay.

EXAMPLE:
locked: { sessionCount: 8, sessionDuration: 90, sessionsPerWeek: 2 }
→ Output exactly 8 sessions, each exactly 90 minutes, ~2 per week across 4 weeks.

OUTPUT FORMAT: sessions array with objects { date: "YYYY-MM-DD", durationMinutes: <integer>, method: <string from studyMethods> }.`;

      // ── AI CALL ───────────────────────────────────────────────
      let finalSessions: {
        date: string;
        durationMinutes: number;
        method: string;
      }[];

      try {
        const message = await anthropic.messages.create(
          {
            model: "claude-haiku-4-5-20251001",
            max_tokens: 4096,
            system: systemPrompt,
            tools: [studyScheduleToolSchema],
            tool_choice: { type: "tool", name: "create_study_schedule" },
            messages: [
              {
                role: "user",
                content: JSON.stringify(claudeInput, null, 2),
              },
            ],
          },
          { signal: AbortSignal.timeout(30000) }
        );

        const toolUseBlock = message.content.find(
          (block) =>
            block.type === "tool_use" &&
            block.name === "create_study_schedule"
        );

        if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
          throw new Error("AI returned no tool use content");
        }

        const parsed = StudyScheduleSchema.parse(toolUseBlock.input);
        const sorted = [...parsed.sessions].sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        // ── STRICT POST-VALIDATION ──────────────────────────────
        const validated = strictValidateAIOutput(
          sorted,
          constraints,
          studyMethods
        );

        if (validated) {
          finalSessions = validated;
        } else {
          console.warn(
            `AI output failed strict validation for exam ${examId} — using deterministic fallback`
          );
          finalSessions = generateDeterministicSchedule(
            constraints,
            studyMethods
          );
        }
      } catch (aiError) {
        // AI call failed entirely — use deterministic fallback
        console.warn(
          `AI call failed for exam ${examId} — using deterministic fallback:`,
          aiError
        );
        finalSessions = generateDeterministicSchedule(
          constraints,
          studyMethods
        );
      }

      if (finalSessions.length === 0) {
        await prisma.exam.update({
          where: { id: examId },
          data: { scheduleStatus: "FAILED" },
        });
        return NextResponse.json({
          success: false,
          error:
            "Cannot create schedule: no viable dates with enough capacity.",
        });
      }

      // ── PERSIST ─────────────────────────────────────────────
      await prisma.studySession.deleteMany({ where: { examId } });

      await prisma.studySession.createMany({
        data: finalSessions.map((s) => ({
          examId,
          userId: dbUser.id,
          date: new Date(s.date + "T00:00:00Z"),
          duration: s.durationMinutes,
          method: s.method,
          topic: `Prep for ${fullExam.title} — ${s.method}`,
        })),
      });

      await prisma.exam.update({
        where: { id: examId },
        data: { scheduleStatus: "GENERATED" },
      });

      return NextResponse.json({ success: true });
    } catch (innerError) {
      await prisma.exam.update({
        where: { id: examId },
        data: { scheduleStatus: "FAILED" },
      });
      console.error("Schedule generation failed:", innerError);

      // Get user-friendly error message
      const errorMessage =
        innerError instanceof Error
          ? getFriendlyErrorMessage(innerError)
          : "Unknown error";

      return NextResponse.json({
        success: false,
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error("Schedule endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
