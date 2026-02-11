import { NextResponse } from "next/server";
import { getProUserOrNull } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/claude";
import { z } from "zod";

// ── CONSTANTS ────────────────────────────────────────────────────

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const VALID_WHEN_TO_START = [
  "tomorrow",
  "in_2_days",
  "in_3_days",
  "next_week",
  "the_week_before",
  "2_weeks_before",
  "3_weeks_before",
  "4_weeks_before",
] as const;

// ── TYPES ────────────────────────────────────────────────────────

interface ScheduleInputs {
  startDate: string;
  availableDates: string[];
  totalSessionsNeeded: number;
  targetSessionsPerWeek: number;
  sessionLengthMinutes: number;
  existingMinutesByDate: Record<string, number>;
  restDays: string[];
  daysToExam: number;
}

type SessionOutput = {
  date: string;
  durationMinutes: number;
  method: string;
};

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

function getDayName(date: Date): string {
  return DAY_NAMES[date.getUTCDay()];
}

function addDaysUTC(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toMidnightUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function dateToStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Get the next Monday on or after the given date.
 * If the date IS a Monday, returns the FOLLOWING Monday.
 */
function getNextMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  return addDaysUTC(d, daysUntilMonday);
}

// ── STEP 1: COMPUTE START DATE ──────────────────────────────────

/**
 * Compute the schedule start date from the whenToStartStudying value.
 *
 * For relative-to-creation values ("tomorrow", "in_2_days", etc.):
 *   startDate is relative to today (schedule generation time).
 *
 * For relative-to-exam values ("the_week_before", "2_weeks_before", etc.):
 *   startDate is computed backwards from examDate.
 *   If the result is in the past, clamp to tomorrow.
 */
function computeStartDate(
  whenToStart: string,
  examDate: Date
): Date {
  const today = toMidnightUTC(new Date());
  const exam = toMidnightUTC(examDate);
  const tomorrow = addDaysUTC(today, 1);

  let start: Date;

  switch (whenToStart) {
    case "tomorrow":
      start = addDaysUTC(today, 1);
      break;
    case "in_2_days":
      start = addDaysUTC(today, 2);
      break;
    case "in_3_days":
      start = addDaysUTC(today, 3);
      break;
    case "next_week":
      start = getNextMonday(today);
      break;
    case "the_week_before":
      start = addDaysUTC(exam, -7);
      break;
    case "2_weeks_before":
      start = addDaysUTC(exam, -14);
      break;
    case "3_weeks_before":
      start = addDaysUTC(exam, -21);
      break;
    case "4_weeks_before":
      start = addDaysUTC(exam, -28);
      break;
    default:
      throw new Error(`Invalid whenToStartStudying: ${whenToStart}`);
  }

  // Clamp: if computed start is in the past, use tomorrow
  if (start < tomorrow) {
    start = tomorrow;
  }

  return start;
}

// ── STEP 2-4: DERIVE SCHEDULE INPUTS ────────────────────────────

function deriveScheduleInputs(
  exam: {
    date: Date;
    targetSessionsPerWeek: number;
    sessionLengthMinutes: number;
    whenToStartStudying: string;
  },
  restDays: string[],
  otherSessions: { date: Date; duration: number }[]
): ScheduleInputs {
  // Guards
  if (restDays.length >= 7) {
    throw new Error("All 7 days are rest days — no study days available");
  }
  if (exam.targetSessionsPerWeek < 1) {
    throw new Error("targetSessionsPerWeek must be at least 1");
  }
  if (!VALID_WHEN_TO_START.includes(exam.whenToStartStudying as typeof VALID_WHEN_TO_START[number])) {
    throw new Error(`Invalid whenToStartStudying value: ${exam.whenToStartStudying}`);
  }

  const examDate = toMidnightUTC(exam.date);

  // Step 1: compute startDate
  const startDate = computeStartDate(exam.whenToStartStudying, examDate);

  // Step 2: compute daysToExam (calendar days, start inclusive to exam exclusive)
  const daysToExam = Math.floor(
    (examDate.getTime() - startDate.getTime()) / MS_PER_DAY
  );

  if (daysToExam <= 0) {
    throw new Error(
      "Start date is on or after exam date — no time to study"
    );
  }

  // Step 3: compute availableStudyDays (excluding rest days)
  const availableDates: string[] = [];
  const current = new Date(startDate);
  while (current < examDate) {
    if (!restDays.includes(getDayName(current))) {
      availableDates.push(dateToStr(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  if (availableDates.length === 0) {
    throw new Error(
      "No available study days between start and exam. All days in range are rest days."
    );
  }

  // Step 4: THE FORMULA
  // totalSessions = Math.round((daysToExam / 7) * targetSessionsPerWeek)
  // Rest days do NOT affect total session count — only where sessions are placed.
  const totalSessionsNeeded = Math.max(
    1,
    Math.round((daysToExam / 7) * exam.targetSessionsPerWeek)
  );

  // Build existing-minutes-by-date map (informational for AI)
  const existingMinutesByDate: Record<string, number> = {};
  for (const session of otherSessions) {
    const dateKey = dateToStr(new Date(session.date));
    existingMinutesByDate[dateKey] =
      (existingMinutesByDate[dateKey] ?? 0) + session.duration;
  }

  return {
    startDate: dateToStr(startDate),
    availableDates,
    totalSessionsNeeded,
    targetSessionsPerWeek: exam.targetSessionsPerWeek,
    sessionLengthMinutes: exam.sessionLengthMinutes,
    existingMinutesByDate,
    restDays,
    daysToExam,
  };
}

// ── STEP 5: DETERMINISTIC SCHEDULE GENERATOR ────────────────────

/**
 * Deterministic schedule generator using weighted distribution.
 *
 * Places exactly totalSessionsNeeded sessions across availableDates
 * with a slight weighting toward the exam date (later days get more).
 *
 * Uses the largest-remainder method to guarantee exact total count.
 *
 * Supports stacking (multiple sessions per day) when totalSessions
 * exceeds the number of available days.
 */
function generateDeterministicSchedule(
  inputs: ScheduleInputs,
  studyMethods: string[]
): SessionOutput[] {
  const { availableDates, totalSessionsNeeded, sessionLengthMinutes } = inputs;

  if (availableDates.length === 0 || totalSessionsNeeded <= 0) return [];

  const N = availableDates.length;

  // Compute weights: w(i) = 1 + (i / (N-1)) * 0.5
  // Day 0 gets weight 1.0, last day gets weight 1.5
  const weights: number[] = [];
  for (let i = 0; i < N; i++) {
    weights.push(N === 1 ? 1 : 1 + (i / (N - 1)) * 0.5);
  }

  // Normalize weights to sum to totalSessionsNeeded
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const scaled = weights.map((w) => (w / weightSum) * totalSessionsNeeded);

  // Largest-remainder method for integer allocation
  const floors = scaled.map(Math.floor);
  let allocated = floors.reduce((a, b) => a + b, 0);
  const remainders = scaled.map((s, i) => ({ index: i, remainder: s - floors[i] }));
  remainders.sort((a, b) => b.remainder - a.remainder);

  // Distribute remaining sessions to days with largest fractional parts
  let idx = 0;
  while (allocated < totalSessionsNeeded) {
    floors[remainders[idx].index]++;
    allocated++;
    idx++;
  }

  // Build sessions array
  const sessions: SessionOutput[] = [];
  let methodIndex = 0;

  for (let i = 0; i < N; i++) {
    const sessionsOnDay = floors[i];
    for (let s = 0; s < sessionsOnDay; s++) {
      sessions.push({
        date: availableDates[i],
        durationMinutes: sessionLengthMinutes,
        method: studyMethods[methodIndex % studyMethods.length],
      });
      methodIndex++;
    }
  }

  return sessions;
}

// ── STRICT AI OUTPUT VALIDATION ─────────────────────────────────

/**
 * Validate AI output against locked constraints.
 * Returns sessions if valid, or null if any hard rule is violated.
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
  return `You are a study schedule placer. Session count and duration are MATHEMATICALLY PRE-COMPUTED and LOCKED. Your ONLY job is to pick WHICH dates from availableDates to place sessions on, and assign study methods.

The total session count was computed using the formula:
  totalSessions = round((daysToExam / 7) * targetSessionsPerWeek)
This is NON-NEGOTIABLE. You cannot change it.

LOCKED VALUES (non-negotiable — do NOT change under ANY circumstance):
- sessionCount: output EXACTLY this many sessions
- sessionDuration: every session MUST have exactly this duration in minutes
- targetSessionsPerWeek: the user's requested sessions per week

HARD RULES (never violate, in priority order):
1. Output EXACTLY locked.sessionCount sessions. Not more, not less.
2. Every session durationMinutes MUST equal locked.sessionDuration exactly.
3. ONLY use dates from constraints.availableDates.
4. MULTIPLE SESSIONS PER DAY ARE ALLOWED AND EXPECTED when needed. Do NOT reduce session count to avoid stacking.
5. Distribute sessions with slight weighting toward the exam date (more study closer to exam).
6. Cycle through exam.studyMethods in order, repeating from start. Do not repeat the same method consecutively if there are multiple methods.
7. Space sessions as evenly as possible across the available days.

SOFT RULES (follow when possible, NEVER break hard rules 1-7 to satisfy these):
8. If exam.preferences is non-null, use it to influence WHICH dates you pick.
9. Consider existingMinutesByDate to prefer lighter days when possible.
10. Preferences may NEVER reduce session count, change duration, or skip days.

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
    const examDate = toMidnightUTC(exam.date);
    const today = toMidnightUTC(new Date());
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

      // ── DERIVE INPUTS (mathematical formula, no week buckets) ───
      const inputs = deriveScheduleInputs(
        fullExam,
        fullExam.user.restDays,
        otherSessions
      );

      const studyMethods = fullExam.studyMethods as string[];
      const examDateStr = dateToStr(new Date(fullExam.date));

      // ── LOCKED VALUES (pre-computed, non-negotiable) ────────────
      const locked = {
        sessionCount: inputs.totalSessionsNeeded,
        sessionDuration: inputs.sessionLengthMinutes,
        targetSessionsPerWeek: inputs.targetSessionsPerWeek,
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
          daysToExam: inputs.daysToExam,
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
            `Inputs: totalSessionsNeeded=${inputs.totalSessionsNeeded}, ` +
            `availableDates=${inputs.availableDates.length}, ` +
            `daysToExam=${inputs.daysToExam}`
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
