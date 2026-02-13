"use client"

import { motion } from "framer-motion";
import { Coffee, GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { getToday, addDays, getDayNameShort, getDayNameFull, formatDateShort, isSameDay } from "@/lib/date";
import { useExams } from "@/hooks/use-exams";
import { useUserSettings } from "@/hooks/use-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { getSubjectColor, type SubjectConfig } from "@/lib/colors";
import type { ExamWithStatus, StudySessionData } from "@/lib/actions/exam";

interface DayData {
  day: string;
  date: string;
  dateObj: Date;
  isRestDay: boolean;
  exams: ExamWithStatus[];
  sessions: StudySessionData[];
}

export default function ComingDays() {
  const { data: exams, isLoading } = useExams();
  const { data: settings } = useUserSettings();
  const userRestDays: string[] = settings?.restDays ?? [];
  const userSubjects: SubjectConfig[] = settings?.subjects ?? [];

  // Generate dynamic days based on today's date with exams and sessions
  const days = useMemo<DayData[]>(() => {
    const today = getToday();
    const allSessions = (exams || []).flatMap((e) => e.studySessions);

    return Array.from({ length: 5 }, (_, i) => {
      const dateObj = addDays(today, i + 1); // Start from tomorrow
      const dayName = getDayNameShort(dateObj);
      const dateStr = formatDateShort(dateObj);

      const dayExams = (exams || []).filter((exam) =>
        isSameDay(new Date(exam.date), dateObj)
      );
      const daySessions = allSessions.filter((s) =>
        isSameDay(new Date(s.date), dateObj)
      );

      return {
        day: dayName,
        date: dateStr,
        dateObj,
        isRestDay: userRestDays.includes(getDayNameFull(dateObj).toUpperCase()),
        exams: dayExams,
        sessions: daySessions,
      };
    });
  }, [exams, userRestDays]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 50
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full mt-12">
        <div className="flex items-center justify-between mb-8 px-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-4xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-medium tracking-tight text-foreground">Upcoming Days</h3>
        </div>
        <Link
          href="/dashboard/calendar"
          className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          View Calendar <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Grid Container */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        {days.map((day, index) => {
          const hasExams = day.exams.length > 0;
          const hasSessions = day.sessions.length > 0;
          const hasContent = hasExams || hasSessions;

          return (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -8 }}
              className={`
                relative flex flex-col justify-between h-64 p-5 rounded-4xl border border-white/5 backdrop-blur-xl overflow-hidden group
                ${day.isRestDay && !hasContent
                  ? 'bg-background/30 opacity-60 hover:opacity-100'
                  : hasContent
                  ? 'bg-card/30 hover:bg-card/50 hover:border-primary/20 hover:shadow-2xl hover:shadow-black/5'
                  : 'bg-card/20 hover:bg-card/40 hover:border-primary/10 hover:shadow-2xl hover:shadow-black/5'
                }
              `}
            >
              {/* Top: Date */}
              <div className="z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  {day.day}
                </p>
                <p className="text-lg font-semibold text-foreground tracking-tight">
                  {day.date}
                </p>
              </div>

              {/* Middle: Content */}
              <div className="flex-1 flex flex-col justify-center z-10 relative">

                {/* === EXAM PILLS === */}
                {hasExams && (
                  <div className="space-y-2">
                    {day.exams.slice(0, 2).map((exam) => {
                      const colorSet = getSubjectColor(exam.subject, userSubjects);
                      return (
                        <div key={exam.id} className="relative group/pill">
                          <div className={`absolute inset-0 blur-xl opacity-40 bg-linear-to-r ${colorSet.gradient} ${colorSet.shadow}`} />
                          <div className={`
                            relative flex flex-col items-center justify-center text-center py-3 px-2 rounded-2xl
                            bg-linear-to-b ${colorSet.gradient} text-white shadow-lg ${colorSet.shadow}
                          `}>
                            <GraduationCap className="h-4 w-4 mb-1 drop-shadow-md" />
                            <span className="text-[10px] font-bold leading-tight drop-shadow-sm truncate max-w-full px-1">
                              {exam.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* === SESSION PILLS === */}
                {hasSessions && (
                  <div className={`space-y-1.5 ${hasExams ? "mt-2" : ""}`}>
                    {day.sessions.slice(0, 2).map((session) => {
                      const exam = (exams || []).find((e) => e.id === session.examId);
                      const colorSet = getSubjectColor(exam?.subject, userSubjects);
                      return (
                        <div
                          key={session.id}
                          className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl ${colorSet.pill}`}
                        >
                          <BookOpen className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-[10px] font-medium truncate">
                            {session.topic || session.method}
                          </span>
                          <span className="text-[9px] opacity-60 ml-auto shrink-0">
                            {session.duration}m
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* === "+X more" overflow indicator === */}
                {(day.exams.length > 2 || day.sessions.length > 2) && (
                  <p className="text-[10px] text-center text-muted-foreground mt-1">
                    +{Math.max(0, day.exams.length - 2) + Math.max(0, day.sessions.length - 2)} more
                  </p>
                )}

                {/* === EMPTY - WEEKEND === */}
                {!hasContent && day.isRestDay && (
                  <div className="flex flex-col items-center justify-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 rounded-full bg-white/5 border border-white/5">
                      <Coffee className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">
                      Rest day
                    </span>
                    <span className="text-[9px] text-muted-foreground/60 text-center">
                      Recharge and come back stronger
                    </span>
                  </div>
                )}

                {/* === EMPTY - WEEKDAY === */}
                {!hasContent && !day.isRestDay && (
                  <div className="flex flex-col items-center justify-center gap-2 opacity-50 group-hover:opacity-80 transition-opacity">
                    <span className="text-[10px] text-muted-foreground text-center">
                      No study scheduled
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom decoration */}
              {hasContent && (
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-linear-to-t from-background/40 to-transparent pointer-events-none" />
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
