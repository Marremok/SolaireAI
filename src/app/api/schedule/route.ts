import { NextResponse } from "next/server";
import { getProUserOrNull } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/claude";
import { z } from "zod";

// ── TYPES ────────────────────────────────────────────────────────

interface WeekBucket {
  dates: string[];
  isFullWeek: boolean;
  sessionsNeeded: number;
}

interface ScheduleInputs {
  availableDates: string[];
  totalSessionsNeeded: number;
  targetSessionsPerWeek: number;
  sessionLengthMinutes: number;
  existingMinutesByDate: Record<string, number>;
  restDays: string[];
  weeks: WeekBucket[];
}

type SessionOutput = { date: string; durationMinutes: number; method: string };

// ── SCHEMAS ──────────────────────────────────────────────────────

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
  description:
    "Create a study schedule by placing sessions on specific dates",
  input_schema: {
    type: "object" as const,
    properties: {
      sessions: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            date: {
              type: "string" as const,
              description: "ISO date string (YYYY-MM-DD)",
            },
            durationMinutes: {
              type: "number" as const,
              description: "Session duration in minutes",
            },
            method: {
              type: "string" as const,
              description: "Study method from exam's allowed methods",
            },
          },
          required: ["date", "durationMinutes", "method"],
        },
      },
    },
    required: ["sessions"],
  },
};

// ── HELPERS ──────────────────────────────────────────────────────

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

function getDayName(date: Date): string {
  return DAY_NAMES[date.getUTCDay()];
}

/**
 * Get the ISO week number's Monday for a date.
 * Used to group dates into calendar weeks (Mon-Sun).
 */
function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(d);
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

// ── DERIVE SCHEDULE INPUTS ──────────────────────────────────────

function deriveScheduleInputs(
  exam: {
    date: Date;
    targetSessionsPerWeek: number;
    sessionLengthMinutes: number;
  },
  restDays: string[],
  otherSessions: { date: Date; duration: number }[]
): ScheduleInputs {
  const availableDaysPerWeek = 7 - restDays.length;

  if (availableDaysPerWeek <= 0) {
    throw new Error("All 7 days are rest days — no study days available");
  }

  if (exam.targetSessionsPerWeek < 1) {
    throw new Error("targetSessionsPerWeek must be at least 1");
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const examDate = new Date(exam.date);
  examDate.setUTCHours(0, 0, 0, 0);

  // Generate available dates: from tomorrow to day before exam, excluding rest days
  const availableDates: string[] = [];
  const current = new Date(today);
  current.setUTCDate(current.getUTCDate() + 1); // start from tomorrow
  while (current < examDate) {
    if (!restDays.includes(getDayName(current))) {
      availableDates.push(current.toISOString().slice(0, 10));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  if (availableDates.length === 0) {
    throw new Error(
      "No available dates between today and exam. Check rest days or move exam date further out."
    );
  }

  // Group available dates into calendar weeks (Mon-Sun)
  const weekMap = new Map<string, string[]>();
  for (const dateStr of availableDates) {
    const monday = getWeekMonday(dateStr);
    if (!weekMap.has(monday)) weekMap.set(monday, []);
    weekMap.get(monday)!.push(dateStr);
  }

  // Build week buckets with session counts
  const sortedMondays = [...weekMap.keys()].sort();
  const weeks: WeekBucket[] = [];

  for (const monday of sortedMondays) {
    const dates = weekMap.get(monday)!;
    const isFullWeek = dates.length === availableDaysPerWeek;

    let sessionsNeeded: number;
    if (isFullWeek) {
      // Full week: exact targetSessionsPerWeek
      sessionsNeeded = exam.targetSessionsPerWeek;
    } else {
      // Partial week: proportional, minimum 1
      sessionsNeeded = Math.max(
        1,
        Math.round(
          (exam.targetSessionsPerWeek * dates.length) / availableDaysPerWeek
        )
      );
    }

    weeks.push({ dates, isFullWeek, sessionsNeeded });
  }

  const totalSessionsNeeded = weeks.reduce(
    (sum, w) => sum + w.sessionsNeeded,
    0
  );

  if (totalSessionsNeeded <= 0) {
    throw new Error(
      "Cannot compute sessions — check exam settings and available dates"
    );
  }

  // Build existing-minutes-by-date map (informational for AI, not for capping)
  const existingMinutesByDate: Record<string, number> = {};
  for (const session of otherSessions) {
    const dateKey = new Date(session.date).toISOString().slice(0, 10);
    existingMinutesByDate[dateKey] =
      (existingMinutesByDate[dateKey] ?? 0) + session.duration;
  }

  return {
    availableDates,
    totalSessionsNeeded,
    targetSessionsPerWeek: exam.targetSessionsPerWeek,
    sessionLengthMinutes: exam.sessionLengthMinutes,
    existingMinutesByDate,
    restDays,
    weeks,
  };
}

// ── DETERMINISTIC SCHEDULE GENERATOR (FALLBACK) ─────────────────

/**
 * Deterministic schedule generator — places sessions across weeks
 * using even distribution. Supports multiple sessions per day (stacking)
 * when sessions exceed available days in a week.
 *
 * This is the FALLBACK when AI output fails validation.
 */
function generateDeterministicSchedule(
  inputs: ScheduleInputs,
  studyMethods: string[]
): SessionOutput[] {
  const sessions: SessionOutput[] = [];
  let methodIndex = 0;

  for (const week of inputs.weeks) {
    const { dates, sessionsNeeded } = week;
    if (dates.length === 0 || sessionsNeeded <= 0) continue;

    if (sessionsNeeded <= dates.length) {
      // Fewer or equal sessions than days: pick evenly-spaced days
      const interval = dates.length / sessionsNeeded;
      for (let i = 0; i < sessionsNeeded; i++) {
        const idx = Math.floor(i * interval);
        sessions.push({
          date: dates[idx],
          durationMinutes: inputs.sessionLengthMinutes,
          method: studyMethods[methodIndex % studyMethods.length],
        });
        methodIndex++;
      }
    } else {
      // More sessions than days: distribute with stacking
      // e.g., 7 sessions / 5 days → [2, 1, 2, 1, 1]
      const base = Math.floor(sessionsNeeded / dates.length);
      const extra = sessionsNeeded % dates.length;

      for (let dayIdx = 0; dayIdx < dates.length; dayIdx++) {
        const sessionsOnDay = base + (dayIdx < extra ? 1 : 0);
        for (let s = 0; s < sessionsOnDay; s++) {
          sessions.push({
            date: dates[dayIdx],
            durationMinutes: inputs.sessionLengthMinutes,
            method: studyMethods[methodIndex % studyMethods.length],
          });
          methodIndex++;
        }
      }
    }
  }

  return sessions;
}

// ── STRICT AI OUTPUT VALIDATION ─────────────────────────────────

/**
 * Validate AI output against locked constraints.
 * Returns sessions if valid, or null if any hard rule is violated.
 * No daily capacity check — multiple sessions per day are allowed.
 */
function strictValidateAIOutput(
  aiSessions: SessionOutput[],
  inputs: ScheduleInputs,
  studyMethods: string[]
): SessionOutput[] | null {
  const availableDatesSet = new Set(inputs.availableDates);

  // Rule 1: Exact session count
  if (aiSessions.length !== inputs.totalSessionsNeeded) return null;

  // Rule 2: Every duration must match exactly
  if (
    aiSessions.some((s) => s.durationMinutes !== inputs.sessionLengthMinutes)
  )
    return null;

  // Rule 3: All dates must be from availableDates
  if (aiSessions.some((s) => !availableDatesSet.has(s.date))) return null;

  // Rule 4: All methods must be valid
  if (aiSessions.some((s) => !studyMethods.includes(s.method))) return null;

  return aiSessions;
}

// ── AI SYSTEM PROMPT ────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a study schedule placer. Session count and duration are PRE-COMPUTED and LOCKED. Your ONLY job is to pick WHICH dates from availableDates to place sessions on, and assign study methods.

LOCKED VALUES (non-negotiable — do NOT change under ANY circumstance):
- sessionCount: output EXACTLY this many sessions
- sessionDuration: every session MUST have exactly this duration in minutes
- sessionsPerWeek: target sessions per 7-day window

HARD RULES (never violate, in priority order):
1. Output EXACTLY locked.sessionCount sessions. Not more, not less.
2. Every session durationMinutes MUST equal locked.sessionDuration exactly.
3. ONLY use dates from constraints.availableDates.
4. Distribute sessions evenly across weeks. Each 7-day window should have ~locked.sessionsPerWeek sessions.
5. MULTIPLE SESSIONS PER DAY ARE ALLOWED AND EXPECTED when sessionsPerWeek exceeds available days in a week. Do NOT reduce session count to avoid stacking.
6. Cycle through exam.studyMethods in order, repeating from start. Do not repeat the same method consecutively if there are multiple methods.
7. Space sessions as evenly as possible within each week.

SOFT RULES (follow when possible, NEVER break hard rules 1-7 to satisfy these):
8. If exam.preferences is non-null, use it to influence WHICH dates you pick within each week.
9. Consider existingMinutesByDate to prefer lighter days when possible.
10. Preferences may NEVER reduce session count, change duration, or skip entire weeks.

OUTPUT FORMAT: sessions array with objects { date: "YYYY-MM-DD", durationMinutes: <integer>, method: <string from studyMethods> }.`;
}

// ── POST HANDLER ────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Auth: require PRO subscription
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

      // ── DERIVE INPUTS (session-count-driven, no hours) ──────────
      const inputs = deriveScheduleInputs(
        fullExam,
        fullExam.user.restDays,
        otherSessions
      );

      const studyMethods = fullExam.studyMethods as string[];
      const examDateStr = new Date(fullExam.date)
        .toISOString()
        .slice(0, 10);

      // ── LOCKED VALUES (pre-computed, non-negotiable) ────────────
      const locked = {
        sessionCount: inputs.totalSessionsNeeded,
        sessionDuration: inputs.sessionLengthMinutes,
        sessionsPerWeek: inputs.targetSessionsPerWeek,
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
          availableDates: inputs.availableDates,
          existingMinutesByDate: inputs.existingMinutesByDate,
          restDays: inputs.restDays,
        },
      };

      // ── AI CALL ─────────────────────────────────────────────────
      let finalSessions: SessionOutput[];

      try {
        const message = await anthropic.messages.create(
          {
            model: "claude-haiku-4-5-20251001",
            max_tokens: 4096,
            system: buildSystemPrompt(),
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

        // ── STRICT POST-VALIDATION ────────────────────────────────
        const validated = strictValidateAIOutput(
          sorted,
          inputs,
          studyMethods
        );

        if (validated) {
          finalSessions = validated;
        } else {
          console.warn(
            `AI output failed strict validation for exam ${examId} — using deterministic fallback`
          );
          finalSessions = generateDeterministicSchedule(inputs, studyMethods);
        }
      } catch (aiError) {
        // AI call failed entirely — use deterministic fallback
        console.warn(
          `AI call failed for exam ${examId} — using deterministic fallback:`,
          aiError
        );
        finalSessions = generateDeterministicSchedule(inputs, studyMethods);
      }

      // ── FAIL-FAST: sessions must not be empty ───────────────────
      if (finalSessions.length === 0) {
        console.error(
          `CRITICAL: Schedule generation produced 0 sessions for exam ${examId}. ` +
            `Inputs: targetSessionsPerWeek=${inputs.targetSessionsPerWeek}, ` +
            `availableDates=${inputs.availableDates.length}, ` +
            `totalSessionsNeeded=${inputs.totalSessionsNeeded}`
        );
        throw new Error(
          "Failed to place any sessions — this should not happen. Please report this error."
        );
      }

      // ── PERSIST ─────────────────────────────────────────────────
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

      const errorMessage =
        innerError instanceof Error
          ? innerError.message
          : "Unknown error during schedule generation";

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
