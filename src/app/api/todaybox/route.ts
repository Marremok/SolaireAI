import { NextResponse } from "next/server";
import { getProUserOrNull } from "@/lib/auth";
import { getExamsByUserId } from "@/lib/actions/exam";
import { getUserSettings } from "@/lib/actions/settings";
import {
  getToday,
  isSameDay,
  getRelativeDateString,
  getDayNameFull,
  getDaysBetween,
} from "@/lib/date";
import { filterUpcomingExams } from "@/hooks/use-exams";

/**
 * GET /api/todaybox
 *
 * Returns today's study sessions and upcoming exams for Pro users
 * Used by Chrome extension for quick access to TodayBox data
 *
 * Auth: Clerk session cookie (credentials: 'include')
 * Returns: 200 (success), 401 (not auth), 403 (not Pro), 500 (error)
 */
export async function GET() {
  try {
    // Check Pro subscription status
    const dbUser = await getProUserOrNull();

    // Not authenticated or not Pro
    if (!dbUser) {
      return NextResponse.json(
        { error: "PRO subscription required" },
        { status: 403 }
      );
    }

    // Fetch exams and settings (these are already Pro-protected)
    const [exams, settings] = await Promise.all([
      getExamsByUserId(),
      getUserSettings(),
    ]);

    const today = getToday();

    // Filter today's study sessions
    const todaySessions = exams
      .flatMap((exam) =>
        exam.studySessions
          .filter((s) => isSameDay(new Date(s.date), today))
          .map((s) => ({
            id: s.id,
            examTitle: exam.title,
            examSubject: exam.subject,
            topic: s.topic,
            method: s.method,
            duration: s.duration,
            status: s.status,
          }))
      );

    // Get upcoming exams (top 3, sorted by date)
    const upcomingExams = filterUpcomingExams(exams)
      .sort((a, b) => getDaysBetween(a.date, b.date))
      .slice(0, 3)
      .map((exam) => ({
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        date: exam.date.toISOString(),
        relativeDate: getRelativeDateString(exam.date),
      }));

    // Check if today is a rest day
    const restDays: string[] = settings?.restDays ?? [];
    const todayName = getDayNameFull(today).toUpperCase();
    const isRestDay = restDays.includes(todayName);

    // Return optimized payload
    return NextResponse.json({
      sessions: todaySessions,
      upcomingExams,
      isRestDay,
      restDays,
      subjects: settings?.subjects ?? [],
    });
  } catch (error) {
    console.error("TodayBox API error:", error);

    // Return generic error (don't expose internal details)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
