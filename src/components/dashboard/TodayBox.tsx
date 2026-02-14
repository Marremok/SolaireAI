"use client"

import { motion } from "framer-motion";
import { CalendarDays, GraduationCap, BookOpen, ArrowRight, Inbox, Coffee } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";
import { formatDateFull, getToday, getRelativeDateString, isSameDay, getDayNameFull, getDaysBetween } from "@/lib/date";
import { useExams, filterUpcomingExams } from "@/hooks/use-exams";
import { useUserSettings } from "@/hooks/use-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { getSubjectColor, type SubjectConfig } from "@/lib/colors";

export default function TodayBox() {
  const today = useMemo(() => getToday(), []);
  const formattedDate = useMemo(() => formatDateFull(today), [today]);

  const { data: exams, isLoading } = useExams();
  const { data: settings } = useUserSettings();
  const userSubjects: SubjectConfig[] = settings?.subjects ?? [];

  // Get today's study sessions
  const todaySessions = useMemo(() => {
    if (!exams) return [];
    return exams
      .flatMap((exam) =>
        exam.studySessions
          .filter((s) => isSameDay(new Date(s.date), today))
          .map((s) => ({ ...s, examTitle: exam.title }))
      );
  }, [exams, today]);

  // Check if today is a rest day
  const isRestDay = useMemo(() => {
    const restDays: string[] = settings?.restDays ?? [];
    const todayName = getDayNameFull(today).toUpperCase();
    return restDays.includes(todayName);
  }, [settings, today]);

  // Get upcoming exams sorted by date, limited to 3
  const upcomingExams = useMemo(() => {
    const upcoming = filterUpcomingExams(exams);
    return upcoming
      .sort((a, b) => getDaysBetween(a.date, b.date))
      .slice(0, 3)
      .map((exam) => ({
        ...exam,
        relativeDate: getRelativeDateString(exam.date),
        color: getSubjectColor(exam.subject, userSubjects).solid,
      }));
  }, [exams, userSubjects]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-4xl border border-border/40 bg-background/40 backdrop-blur-xl shadow-sm">
        <div className="md:col-span-5 p-8 border-b md:border-b-0 md:border-r border-border/40">
          <Skeleton className="h-4 w-32 mb-6" />
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-24 mb-8" />
          <Skeleton className="h-4 w-28 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        </div>
        <div className="md:col-span-7 p-8">
          <Skeleton className="h-6 w-32 mb-8" />
          <div className="space-y-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-4xl border border-border/40 bg-background/40 backdrop-blur-xl shadow-sm"
    >

      {/* --- LEFT: CONTEXT & FOCUS --- */}
      <div className="md:col-span-5 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/40 bg-linear-to-b from-primary/5 to-transparent relative">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-6 opacity-60">
            <CalendarDays className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">{formattedDate}</span>
          </div>

          <h2 className="text-3xl font-medium tracking-tight text-foreground mb-2">
            Today's <br />
            <span className="text-muted-foreground">{isRestDay ? "Rest Day" : "Focus"}</span>
          </h2>
          {isRestDay && (
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              You've earned this break. Recharge today.
            </p>
          )}
        </div>

        {/* Upcoming Exams */}
        <div className="space-y-4 mt-8">
          <p className="text-xs font-medium text-muted-foreground pl-1">UPCOMING EXAMS</p>

          {upcomingExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-white/5 border border-white/10">
              <GraduationCap className="h-6 w-6 text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground text-center">
                No upcoming exams
              </p>
              <Link
                href="/dashboard/exams"
                className="text-xs text-primary mt-2 hover:underline"
              >
                Add your first exam
              </Link>
            </div>
          ) : (
            upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${exam.color} ring-4 ring-white/5`} />
                  <div>
                    <p className="text-sm font-semibold">{exam.title}</p>
                    <p className="text-xs text-muted-foreground">{exam.relativeDate}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Subtle Background Blob */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 blur-[80px] rounded-full opacity-50" />
        </div>
      </div>

      {/* --- RIGHT: STUDY TASKS / REST DAY --- */}
      <div className="md:col-span-7 p-8 bg-background/20 flex flex-col">
        {isRestDay && todaySessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
            <div className="p-4 rounded-full bg-muted/20 mb-4">
              <Coffee className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Rest Day
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
              No study sessions today. Step away from your desk, get some
              fresh air, and let your mind process what you've learned.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold tracking-tight">Today's Tasks</h3>
            </div>

            {todaySessions.length > 0 ? (
              <div className="space-y-3">
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/25">
                      <BookOpen className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{session.topic || session.method}</p>
                      <p className="text-xs text-muted-foreground">{session.examTitle}</p>
                    </div>
                    <span className="text-xs font-medium text-indigo-400/80 bg-indigo-500/10 px-2 py-0.5 rounded-full shrink-0">
                      {session.duration} min
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="p-3 rounded-full bg-muted/20 mb-3">
                  <Inbox className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">No tasks for today</h4>
                <p className="text-xs text-muted-foreground/60 text-center max-w-50">
                  Tasks will appear here once you set up study sessions for your exams.
                </p>
              </div>
            )}
          </>
        )}

        {/* Footer Link */}
        <div className="mt-8 pt-4 border-t border-border/20 flex justify-end">
          <Link
            href="/dashboard/exams"
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            View all exams <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

    </motion.div>
  );
}
