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

interface WeekBucket {
  weekIndex: number;
  type: "first" | "full" | "exam" | "only";
  mondayDate: string;
  studyDays: string[];
  sessionCount: number;
}

interface ScheduleInputs {
  startDate: string;
  examDate: string;
  availableDates: string[];
  totalSessionsNeeded: number;
  targetSessionsPerWeek: number;
  sessionLengthMinutes: number;
  studySessionsPerDay: number;
  existingMinutesByDate: Record<string, number>;
  restDays: string[];
  daysToExam: number;
  weekBreakdown: WeekBucket[];
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

/**
 * Get the Monday of the ISO week (Mon-Sun) containing the given date.
 */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat
  if (day === 0) return addDaysUTC(d, -6); // Sunday → previous Monday
  if (day === 1) return d; // already Monday
  return addDaysUTC(d, 1 - day);
}

/**
 * Get the Sunday of the ISO week (Mon-Sun) containing the given date.
 */
function getSundayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat
  if (day === 0) return d; // already Sunday
  return addDaysUTC(d, 7 - day);
}

/**
 * Get all non-rest-day dates in [from, to] inclusive.
 */
function getStudyDaysInRange(
  from: Date,
  to: Date,
  restDays: string[]
): string[] {
  const result: string[] = [];
  const current = new Date(from);
  const end = toMidnightUTC(to);
  while (current <= end) {
    if (!restDays.includes(getDayName(current))) {
      result.push(dateToStr(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return result;
}

/**
 * Distribute sessionCount sessions across studyDays using largest-remainder.
 * pinnedDays are guaranteed >= 1 session each.
 * Remainder sessions go to the LAST days (exam-ward bias).
 */
function distributeSessionsInWeek(
  studyDays: string[],
  sessionCount: number,
  pinnedDays: string[]
): Map<string, number> {
  const result = new Map<string, number>();
  const N = studyDays.length;

  if (N === 0 || sessionCount <= 0) return result;

  // Initialize all days to 0
  for (const day of studyDays) {
    result.set(day, 0);
  }

  // Step 1: Reserve 1 session for each pinned day
  let remaining = sessionCount;
  for (const pin of pinnedDays) {
    if (result.has(pin)) {
      result.set(pin, 1);
      remaining--;
    }
  }

  // Step 2: Distribute remaining sessions evenly via largest-remainder
  if (remaining > 0) {
    const base = Math.floor(remaining / N);
    const remainder = remaining - base * N;

    for (const day of studyDays) {
      result.set(day, result.get(day)! + base);
    }

    // Give extras to the LAST `remainder` days (toward exam)
    for (let i = N - remainder; i < N; i++) {
      result.set(studyDays[i], result.get(studyDays[i])! + 1);
    }
  }

  return result;
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

// ── STEP 2-4: DERIVE SCHEDULE INPUTS (WEEK-ENFORCED) ────────────

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
  if (
    !VALID_WHEN_TO_START.includes(
      exam.whenToStartStudying as (typeof VALID_WHEN_TO_START)[number]
    )
  ) {
    throw new Error(
      `Invalid whenToStartStudying value: ${exam.whenToStartStudying}`
    );
  }

  const examDate = toMidnightUTC(exam.date);
  const startDate = computeStartDate(exam.whenToStartStudying, examDate);

  const daysToExam = Math.floor(
    (examDate.getTime() - startDate.getTime()) / MS_PER_DAY
  );
  if (daysToExam <= 0) {
    throw new Error("Start date is on or after exam date — no time to study");
  }

  // lastStudyDay = day before exam (inclusive end of study period)
  const lastStudyDay = addDaysUTC(examDate, -1);

  // studySessionsPerDay = decimal ratio for partial weeks
  const availableDaysPerWeek = 7 - restDays.length;
  const studySessionsPerDay =
    exam.targetSessionsPerWeek / availableDaysPerWeek;

  // ── Build week buckets ──
  const weekBuckets: WeekBucket[] = [];
  const allStudyDays: string[] = [];

  const startMonday = getMondayOfWeek(startDate);
  const lastMonday = getMondayOfWeek(lastStudyDay);

  // Same-week edge case: start and lastStudyDay in the same ISO week
  if (startMonday.getTime() === lastMonday.getTime()) {
    const studyDays = getStudyDaysInRange(startDate, lastStudyDay, restDays);
    const raw = Math.ceil(studyDays.length * studySessionsPerDay);
    const sessionCount = Math.max(1, raw);

    weekBuckets.push({
      weekIndex: 0,
      type: "only",
      mondayDate: dateToStr(startMonday),
      studyDays,
      sessionCount,
    });
    allStudyDays.push(...studyDays);
  } else {
    // ── First week (partial, floor) ──
    const firstSunday = getSundayOfWeek(startDate);
    const firstWeekStudyDays = getStudyDaysInRange(
      startDate,
      firstSunday,
      restDays
    );

    if (firstWeekStudyDays.length > 0) {
      const rawFirst = Math.floor(
        firstWeekStudyDays.length * studySessionsPerDay
      );
      const sessionsFirstWeek = Math.max(1, rawFirst);

      weekBuckets.push({
        weekIndex: 0,
        type: "first",
        mondayDate: dateToStr(getMondayOfWeek(startDate)),
        studyDays: firstWeekStudyDays,
        sessionCount: sessionsFirstWeek,
      });
      allStudyDays.push(...firstWeekStudyDays);
    }

    // ── Full middle weeks (exact targetSessionsPerWeek) ──
    let currentMonday = addDaysUTC(firstSunday, 1); // Monday after first week
    let weekIdx = weekBuckets.length;

    while (currentMonday.getTime() < lastMonday.getTime()) {
      const currentSunday = addDaysUTC(currentMonday, 6);
      const studyDays = getStudyDaysInRange(
        currentMonday,
        currentSunday,
        restDays
      );

      weekBuckets.push({
        weekIndex: weekIdx,
        type: "full",
        mondayDate: dateToStr(currentMonday),
        studyDays,
        sessionCount: exam.targetSessionsPerWeek,
      });
      allStudyDays.push(...studyDays);

      currentMonday = addDaysUTC(currentMonday, 7);
      weekIdx++;
    }

    // ── Exam week (partial, ceil) ──
    const examWeekStudyDays = getStudyDaysInRange(
      lastMonday,
      lastStudyDay,
      restDays
    );

    if (examWeekStudyDays.length > 0) {
      const rawExam = Math.ceil(
        examWeekStudyDays.length * studySessionsPerDay
      );
      const sessionsExamWeek = Math.max(1, rawExam);

      weekBuckets.push({
        weekIndex: weekIdx,
        type: "exam",
        mondayDate: dateToStr(lastMonday),
        studyDays: examWeekStudyDays,
        sessionCount: sessionsExamWeek,
      });
      allStudyDays.push(...examWeekStudyDays);
    }
  }

  if (allStudyDays.length === 0) {
    throw new Error(
      "No available study days between start and exam. All days in range are rest days."
    );
  }

  const totalSessionsNeeded = Math.max(
    1,
    weekBuckets.reduce((sum, w) => sum + w.sessionCount, 0)
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
    examDate: dateToStr(examDate),
    availableDates: allStudyDays,
    totalSessionsNeeded,
    targetSessionsPerWeek: exam.targetSessionsPerWeek,
    sessionLengthMinutes: exam.sessionLengthMinutes,
    studySessionsPerDay,
    existingMinutesByDate,
    restDays,
    daysToExam,
    weekBreakdown: weekBuckets,
  };
}

// ── STEP 5: DETERMINISTIC SCHEDULE GENERATOR (WEEK-BY-WEEK) ─────

/**
 * Week-enforced deterministic schedule generator.
 *
 * Iterates each WeekBucket and distributes that week's exact
 * sessionCount across its studyDays. Pinned days (startDate,
 * last study day) are guaranteed >= 1 session.
 */
function generateDeterministicSchedule(
  inputs: ScheduleInputs,
  studyMethods: string[]
): SessionOutput[] {
  const { weekBreakdown, sessionLengthMinutes, startDate, availableDates } =
    inputs;

  if (availableDates.length === 0) return [];

  const lastStudyDay = availableDates[availableDates.length - 1];
  const allSessions: SessionOutput[] = [];
  let methodIndex = 0;

  for (const bucket of weekBreakdown) {
    if (bucket.sessionCount === 0 || bucket.studyDays.length === 0) continue;

    // Determine pinned days for this bucket
    const pinnedDays: string[] = [];
    if (bucket.type === "first" || bucket.type === "only") {
      if (bucket.studyDays.includes(startDate)) {
        pinnedDays.push(startDate);
      }
    }
    if (bucket.type === "exam" || bucket.type === "only") {
      if (
        bucket.studyDays.includes(lastStudyDay) &&
        !pinnedDays.includes(lastStudyDay)
      ) {
        pinnedDays.push(lastStudyDay);
      }
    }

    // Distribute sessions within this week
    const distribution = distributeSessionsInWeek(
      bucket.studyDays,
      bucket.sessionCount,
      pinnedDays
    );

    // Build sessions for this week (chronological order)
    for (const day of bucket.studyDays) {
      const count = distribution.get(day) ?? 0;
      for (let s = 0; s < count; s++) {
        allSessions.push({
          date: day,
          durationMinutes: sessionLengthMinutes,
          method: studyMethods[methodIndex % studyMethods.length],
        });
        methodIndex++;
      }
    }
  }

  allSessions.sort((a, b) => a.date.localeCompare(b.date));
  return allSessions;
}

// ── STRICT AI OUTPUT VALIDATION (WEEK-AWARE) ────────────────────

/**
 * Validate AI output against locked constraints including per-week counts.
 * Returns sessions if valid, or null if any hard rule is violated.
 */
function strictValidateAIOutput(
  aiSessions: SessionOutput[],
  inputs: ScheduleInputs,
  studyMethods: string[]
): SessionOutput[] | null {
  const availableDatesSet = new Set(inputs.availableDates);

  // Rule 1: Exact total session count
  if (aiSessions.length !== inputs.totalSessionsNeeded) return null;

  // Rule 2: Every duration must match exactly
  if (aiSessions.some((s) => s.durationMinutes !== inputs.sessionLengthMinutes))
    return null;

  // Rule 3: All dates must be from availableDates
  if (aiSessions.some((s) => !availableDatesSet.has(s.date))) return null;

  // Rule 4: All methods must be valid
  if (aiSessions.some((s) => !studyMethods.includes(s.method))) return null;

  // Rule 5: Per-week session count must match exactly
  for (const bucket of inputs.weekBreakdown) {
    const weekDatesSet = new Set(bucket.studyDays);
    const sessionsInWeek = aiSessions.filter((s) => weekDatesSet.has(s.date));
    if (sessionsInWeek.length !== bucket.sessionCount) return null;
  }

  // Rule 6: First study day must have >= 1 session
  const firstStudyDay = inputs.availableDates[0];
  if (!aiSessions.some((s) => s.date === firstStudyDay)) return null;

  // Rule 7: Last study day must have >= 1 session
  const lastStudyDay = inputs.availableDates[inputs.availableDates.length - 1];
  if (!aiSessions.some((s) => s.date === lastStudyDay)) return null;

  return aiSessions;
}

// ── AI SYSTEM PROMPT (WEEK-ENFORCED) ────────────────────────────

function buildSystemPrompt(): string {
  return `You are a deterministic study schedule placer.

Session counts PER WEEK are MATHEMATICALLY PRE-COMPUTED and LOCKED.
You MUST place EXACTLY the specified number of sessions in each week.
You are NOT allowed to recalculate, reinterpret, optimize, or adjust them.

Your ONLY job is:
- For each week in weekBreakdown, choose WHICH studyDays to place sessions on
- Assign study methods by cycling through the list
- Distribute sessions evenly WITHIN each week

WEEK BREAKDOWN STRUCTURE:
Each week object has:
- type: "first" | "full" | "exam" | "only" (the week category)
- studyDays: array of allowed ISO dates for that week
- sessionCount: EXACTLY how many sessions MUST be placed in that week

LOCKED VALUES (non-negotiable — do NOT change under ANY circumstance):
- Each week's sessionCount: place EXACTLY this many sessions per week
- locked.sessionDuration: every session MUST have this exact duration in minutes
- locked.totalSessionCount: the sum of all week sessionCounts

HARD RULES (never violate, in priority order):

1. Each week MUST have EXACTLY weekBreakdown[i].sessionCount sessions.
   Not more, not less. This is the primary constraint.
2. Total sessions MUST equal locked.totalSessionCount.
3. Every session durationMinutes MUST equal locked.sessionDuration exactly.
4. ONLY use dates from each week's studyDays array.
5. MULTIPLE SESSIONS PER DAY ARE ALLOWED AND EXPECTED when necessary.
   Never reduce session count to avoid stacking.
6. The FIRST study day of the entire period MUST have at least ONE session.
7. The LAST study day before the exam MUST have at least ONE session.
8. Within each week, distribute sessions as evenly as possible across studyDays.
   If uneven distribution is needed, give extra sessions to LATER days in the week.
9. Cycle through exam.studyMethods in order across all weeks.
   Repeat from the beginning when reaching the end.
   Do NOT repeat the same method consecutively if multiple methods exist.

SOFT RULES (follow when possible, NEVER break hard rules 1-9 to satisfy these):

10. If exam.preferences is non-null, use it ONLY to influence WHICH days
    within a week get sessions. Never change per-week counts.
11. Consider existingMinutesByDate to prefer lighter days when possible.
12. Preferences may NEVER:
    - reduce session count in any week
    - change duration
    - remove first-day or last-day placement
    - move sessions between weeks

CRITICAL CONSTRAINTS:

- You are NOT allowed to move sessions between weeks.
- You are NOT allowed to reduce any week's session count.
- You are NOT allowed to leave the first or last study day empty.
- You are NOT allowed to reinterpret the per-week formulas.
- If stacking is required, stack sessions. Count > aesthetics.

OUTPUT FORMAT:
Return a sessions array with objects:

{
  date: "YYYY-MM-DD",
  durationMinutes: <integer>,
  method: <string from studyMethods>
}

No explanations. No comments. Only the sessions array.`;
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

      // ── DERIVE INPUTS (week-enforced) ──────────────────────────
      const inputs = deriveScheduleInputs(
        fullExam,
        fullExam.user.restDays,
        otherSessions
      );

      const studyMethods = fullExam.studyMethods as string[];
      const examDateStr = dateToStr(new Date(fullExam.date));

      // ── LOCKED VALUES (pre-computed, non-negotiable) ────────────
      const locked = {
        totalSessionCount: inputs.totalSessionsNeeded,
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
        weekBreakdown: inputs.weekBreakdown,
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
