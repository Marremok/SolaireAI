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

  // Mathematical distribution calculation
  const targetHoursPerWeek = exam.hoursPerWeek ?? 5;
  const sessionsPerWeek =
    targetHoursPerWeek / (exam.preferredSessionLengthMinutes / 60);
  const weeksUntilExam = availableDates.length / availableDaysPerWeek;
  const totalSessionsNeeded = Math.floor(weeksUntilExam * sessionsPerWeek);

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
      const claudeInput = {
        exam: {
          title: fullExam.title,
          subject: fullExam.subject,
          preferences: fullExam.preferences,
          examDate: new Date(fullExam.date).toISOString().slice(0, 10),
          studyMethods,
          targetHoursPerWeek: fullExam.hoursPerWeek ?? 5,
        },
        constraints,
      };

      const systemPrompt = `You are a study schedule optimizer. Create evenly-distributed study sessions.

RULES:
1. Create exactly totalSessionsNeeded sessions (or as close as capacity allows). If totalSessionsNeeded exceeds available dates, create one session per available date.
2. Space sessions EVENLY across availableDates using interval: floor(availableDates.length / totalSessionsNeeded).
3. Each session duration: preferredSessionLength minutes (±15 min flexibility). Integer between 30-120.
4. NEVER exceed maxMinutesPerDay on any date. Account for existingMinutesByDate. Skip dates with < 30 min remaining capacity.
5. ONLY use dates from the availableDates array.
6. Cycle through the exam's studyMethods evenly. Never repeat the same method consecutively.
7. If the exam has non-null "preferences", treat them as SOFT constraints:
   - Try to honor them (e.g. "avoid Sundays" means skip Sundays for THIS exam if possible)
   - NEVER break hard constraints (maxMinutesPerDay, restDays, availableDates) to satisfy preferences
   - If a preference conflicts with a hard constraint, silently ignore the conflicting preference

OUTPUT: sessions array with { date (YYYY-MM-DD), durationMinutes (integer), method (from studyMethods) }.`;


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
        (block) => block.type === "tool_use" && block.name === "create_study_schedule"
      );

      if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
        throw new Error("Claude returned no tool use content");
      }

      const parsed = StudyScheduleSchema.parse(toolUseBlock.input);

      // Validate sessions — sort by date ASC (capacity tracking is order-dependent)
      const availableDatesSet = new Set(constraints.availableDates);
      const dailyUsed = { ...constraints.existingMinutesByDate };
      const sortedSessions = [...parsed.sessions].sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      const validatedSessions: {
        date: string;
        durationMinutes: number;
        method: string;
      }[] = [];

      for (const session of sortedSessions) {
        if (!availableDatesSet.has(session.date)) continue;
        if (!studyMethods.includes(session.method)) continue;
        if (session.durationMinutes <= 0 || session.durationMinutes > 120)
          continue;

        const currentUsed = dailyUsed[session.date] ?? 0;
        if (currentUsed + session.durationMinutes > constraints.maxMinutesPerDay)
          continue;

        validatedSessions.push(session);
        dailyUsed[session.date] = currentUsed + session.durationMinutes;
      }

      if (validatedSessions.length === 0) {
        await prisma.exam.update({
          where: { id: examId },
          data: { scheduleStatus: "FAILED" },
        });
        return NextResponse.json({
          success: false,
          error: "All sessions filtered out during validation",
        });
      }

      // Clear old sessions for this exam, then insert new ones
      await prisma.studySession.deleteMany({ where: { examId } });

      await prisma.studySession.createMany({
        data: validatedSessions.map((s) => ({
          examId,
          userId: dbUser.id,
          date: new Date(s.date + "T00:00:00Z"),
          duration: s.durationMinutes,
          method: s.method,
          topic: `Prep for ${fullExam.title} — ${s.method}`, // NEW: Include method in topic
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
