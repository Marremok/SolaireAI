"use client"

import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Coffee, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import {
  getToday,
  getMonthName,
  getCalendarGrid,
  isToday,
  getPreviousMonth,
  getNextMonth,
  isSameDay,
  getDayNameFull,
  isPastDay,
} from "@/lib/date";
import { useExams } from "@/hooks/use-exams";
import { useUserSettings } from "@/hooks/use-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { getSubjectColor, type SubjectConfig } from "@/lib/colors";
import type { ExamWithStatus, StudySessionData } from "@/lib/actions/exam";

interface DayData {
  date: Date | null;
  isRestDay: boolean;
  exams: ExamWithStatus[];
  sessions: StudySessionData[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarView() {
  const today = useMemo(() => getToday(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const { data: exams, isLoading } = useExams();
  const { data: settings } = useUserSettings();
  const userRestDays: string[] = settings?.restDays ?? [];
  const userSubjects: SubjectConfig[] = settings?.subjects ?? [];

  // Generate calendar data for the current month with exams and study sessions
  const calendarDays = useMemo<DayData[]>(() => {
    const grid = getCalendarGrid(currentYear, currentMonth);
    const allSessions = (exams || []).flatMap((e) => e.studySessions);

    return grid.map((date) => {
      if (!date) {
        return { date: null, isRestDay: false, exams: [], sessions: [] };
      }

      const dayExams = (exams || []).filter((exam) =>
        isSameDay(new Date(exam.date), date)
      );
      const daySessions = allSessions.filter((s) =>
        isSameDay(new Date(s.date), date)
      );
      const isRestDay = userRestDays.includes(getDayNameFull(date).toUpperCase());

      return { date, isRestDay, exams: dayExams, sessions: daySessions };
    });
  }, [currentYear, currentMonth, exams, userRestDays]);

  const goToPreviousMonth = () => {
    const { year, month } = getPreviousMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const goToNextMonth = () => {
    const { year, month } = getNextMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.02 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-9 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <Skeleton key={i} className="h-30 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-semibold tracking-tight">
            {getMonthName(new Date(currentYear, currentMonth))} {currentYear}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <motion.div
        key={`${currentYear}-${currentMonth}`}
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-7 gap-2"
      >
        {calendarDays.map((day, index) => {
          const isTodayDate = day.date && isToday(day.date);
          const isPast = day.date && isPastDay(day.date);
          const hasContent = day.exams.length > 0 || day.sessions.length > 0;

          return (
            <motion.div
              key={index}
              variants={item}
              className={`
                relative flex flex-col min-h-30 p-3 rounded-2xl border transition-all duration-200
                ${!day.date
                  ? "bg-transparent border-transparent"
                  : hasContent
                  ? "bg-card/40 border-primary/20 hover:bg-card/60 hover:shadow-lg"
                  : "bg-card/30 border-border/30 hover:bg-card/50 hover:border-primary/20"
                }
                ${isTodayDate ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                ${isPast && !isTodayDate ? "opacity-50" : ""}
              `}
            >
              {day.date && (
                <>
                  {/* Date Number */}
                  <div className={`
                    text-sm font-semibold mb-2
                    ${isTodayDate ? "text-primary" : "text-foreground"}
                  `}>
                    {day.date.getDate()}
                  </div>

                  {/* Exams & Sessions */}
                  <div className="flex-1 flex flex-col gap-1">
                    {day.exams.slice(0, 2).map((exam) => {
                      const colorSet = getSubjectColor(exam.subject, userSubjects);
                      return (
                        <div
                          key={exam.id}
                          className={`
                            flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-semibold
                            ${isPast && !isTodayDate
                              ? `bg-linear-to-r ${colorSet.gradient} text-white opacity-40`
                              : `bg-linear-to-r ${colorSet.gradient} text-white`
                            }
                          `}
                        >
                          <GraduationCap className="h-3 w-3 shrink-0" />
                          <span className="truncate">{exam.title}</span>
                        </div>
                      );
                    })}
                    {day.sessions.slice(0, 2).map((session) => {
                      const exam = (exams || []).find((e) => e.id === session.examId);
                      const colorSet = getSubjectColor(exam?.subject, userSubjects);
                      return (
                        <div
                          key={session.id}
                          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg text-[10px] font-medium ${
                            isPast && !isTodayDate
                              ? `${colorSet.pill} opacity-40`
                              : colorSet.pill
                          }`}
                        >
                          <BookOpen className="h-3 w-3 shrink-0" />
                          <span className="truncate">{session.topic || session.method}</span>
                        </div>
                      );
                    })}
                    {(day.exams.length > 2 || day.sessions.length > 2) && (
                      <span className="text-[9px] text-muted-foreground pl-2">
                        +{Math.max(0, day.exams.length - 2) + Math.max(0, day.sessions.length - 2)} more
                      </span>
                    )}

                    {/* Rest Day Badge */}
                    {day.isRestDay && hasContent && (
                      <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-muted/50 border border-muted-foreground/10 text-muted-foreground text-[10px] font-medium">
                        <Coffee className="h-3 w-3 shrink-0" />
                        <span>Rest</span>
                      </div>
                    )}

                    {/* Rest Day - Empty */}
                    {day.isRestDay && !hasContent && (
                      <div className="flex flex-col items-center justify-center gap-1 opacity-50">
                        <Coffee className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[9px] uppercase tracking-widest font-medium text-muted-foreground">
                          Rest day
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-border/20">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-linear-to-r from-blue-500 to-cyan-400" />
          <span className="text-xs text-muted-foreground">Exam</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-indigo-500/40 border border-indigo-500/50" />
          <span className="text-xs text-muted-foreground">Study Session</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full ring-2 ring-primary" />
          <span className="text-xs text-muted-foreground">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-muted/50 border border-muted-foreground/20" />
          <span className="text-xs text-muted-foreground">Rest Day</span>
        </div>
      </div>
    </div>
  );
}
