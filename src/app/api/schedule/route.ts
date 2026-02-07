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
    return "Cannot create schedule: Your weekly study capacity is too low. Go to Settings to increase max hours.";
  }
  if (msg.includes("all sessions filtered")) {
    return "Cannot create schedule: Unable to fit sessions within daily capacity limits. Try increasing study hours or reducing exam targets.";
  }
  if (msg.includes("no available study days")) {
    return "Cannot create schedule: All days are marked as rest days. Go to Settings and reduce rest days.";
  }
  return error.message;
}

function deriveConstraints(
  exam: {
    date: Date;
    hoursPerWeek: number | null;
    preferredSessionLengthMinutes: number; // FROM EXAM now
  },
  user: {
    maxHoursPerWeek: number;
    restDays: string[];
    // REMOVED: preferredSessionLengthMinutes
    // REMOVED: studyIntensity
  },
  otherSessions: { date: Date; duration: number }[]
) {
  const maxHoursPerWeek = user.maxHoursPerWeek;

  // Calculate available days per week (exclude rest days)
  const availableDaysPerWeek = 7 - user.restDays.length;

  // Edge case: No available study days
  if (availableDaysPerWeek === 0) {
    throw new Error("No available study days - all days marked as rest days");
  }

  // Calculate max minutes per day based on available days
  const maxMinutesPerDay = Math.floor(
    (maxHoursPerWeek * 60) / Math.max(availableDaysPerWeek, 1)
  );

  // Edge case: Capacity too low
  if (maxHoursPerWeek < 0.5) {
    throw new Error("Study capacity too low - increase maxHoursPerWeek in Settings");
  }

  const minRequiredMinutes = 30;
  if (maxMinutesPerDay < minRequiredMinutes) {
    throw new Error(
      `Daily capacity too low (${maxMinutesPerDay} min/day). Need at least ${minRequiredMinutes} minutes.`
    );
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const examDate = new Date(exam.date);
  examDate.setUTCHours(0, 0, 0, 0);

  // Helper to get day name from date
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
    if (!user.restDays.includes(dayName)) {
      availableDates.push(current.toISOString().slice(0, 10));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Edge case: No dates available after filtering
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

  // NEW: Mathematical distribution calculation
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
    sessionsPerWeek, // NEW
    totalSessionsNeeded, // NEW
    restDays: user.restDays,
    // REMOVED: studyIntensity
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
        fullExam.user,
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

      const studyMethods = fullExam.studyMethods as string[];
      const claudeInput = {
        exam: {
          title: fullExam.title,
          subject: fullExam.subject,
          description: fullExam.description,
          examDate: new Date(fullExam.date).toISOString().slice(0, 10),
          studyMethods,
          targetHoursPerWeek: fullExam.hoursPerWeek ?? 5,
        },
        constraints,
        // REMOVED: userPreferences section (no longer needed with mathematical distribution)
      };

      const systemPrompt = `You are an AI study schedule optimizer that creates mathematically-distributed study sessions.

## Your Task
Create a study schedule that EVENLY DISTRIBUTES sessions across available dates until the exam.

## Input Context
- **Exam details**: title, target hours/week, allowed study methods, preferred session length
- **Constraints**: availableDates (rest days excluded), max daily capacity, existing commitments
- **Calculated targets**: sessionsPerWeek, totalSessionsNeeded

## Strict Rules

### 1. Mathematical Distribution (CRITICAL)
- Create exactly totalSessionsNeeded sessions (or as close as capacity allows)
- Sessions MUST be evenly spaced across availableDates
- Calculate interval: intervalDays = Math.floor(availableDates.length / totalSessionsNeeded)
- Place sessions at regular intervals: dates[0], dates[intervalDays], dates[2×intervalDays], etc.
- NO subjective pacing - use pure mathematical distribution

### 2. Session Duration
- Target: preferredSessionLength minutes per session
- Allowed range: ±15 minutes flexibility
- Respect daily capacity limits

### 3. Study Method Rotation
- Cycle through exam's allowed study methods
- Do NOT repeat the same method consecutively
- Distribute methods evenly

### 4. Capacity Constraints
- NEVER exceed maxMinutesPerDay for any date
- Account for existingMinutesByDate (other exam sessions)
- Skip dates if remaining capacity < 30 minutes

### 5. Date Validation
- ONLY use dates from availableDates array (rest days already filtered)

## Output Format
Return sessions array with:
- **date**: ISO date string (YYYY-MM-DD) from availableDates
- **durationMinutes**: integer 30-120, close to preferredSessionLength
- **method**: one of exam's allowed study methods

## Validation
- Session count matches totalSessionsNeeded (±10% tolerance)
- Sessions evenly spaced (not clustered)
- No daily capacity exceeded
- Methods rotated

Generate the schedule now.`;


      const message = await anthropic.messages.create(
        {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          tools: [studyScheduleToolSchema],
          tool_choice: { type: "tool", name: "create_study_schedule" },
          messages: [
            {
              role: "user",
              content: `${systemPrompt}\n\nExam, constraints, and user preferences:\n${JSON.stringify(claudeInput, null, 2)}`,
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
