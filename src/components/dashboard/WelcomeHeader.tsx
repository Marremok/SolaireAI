"use client"

import { motion } from "framer-motion";
import { Sparkles, Calendar, BookOpen, Clock } from "lucide-react";
import { useMemo } from "react";
import { useExams, filterUpcomingExams } from "@/hooks/use-exams";
import { getToday, getDaysBetween } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";

interface WelcomeHeaderProps {
  firstName: string | null;
}

export default function WelcomeHeader({ firstName }: WelcomeHeaderProps) {
  const { data: exams, isLoading } = useExams();
  const today = useMemo(() => getToday(), []);

  // Calculate real stats from exams data
  const stats = useMemo(() => {
    const upcomingExams = filterUpcomingExams(exams);

    // Calculate days to nearest exam
    let daysToNearest = "-";
    if (upcomingExams.length > 0) {
      const sortedByDate = [...upcomingExams].sort(
        (a, b) => getDaysBetween(a.date, b.date)
      );
      const nearestExam = sortedByDate[0];
      const diffDays = getDaysBetween(today, nearestExam.date);
      daysToNearest = diffDays > 0 ? String(diffDays) : "Today";
    }

    // Calculate total sessions per week from all upcoming exams
    const totalSessionsPerWeek = upcomingExams.reduce(
      (sum, exam) => sum + (exam.targetSessionsPerWeek || 0),
      0
    );

    return [
      {
        label: "Active Exams",
        value: String(upcomingExams.length),
        icon: BookOpen,
        color: "text-blue-500"
      },
      {
        label: "Days to Exam",
        value: daysToNearest,
        icon: Calendar,
        color: "text-primary"
      },
      {
        label: "Sessions/Week",
        value: totalSessionsPerWeek > 0 ? `${totalSessionsPerWeek}` : "-",
        icon: Clock,
        color: "text-emerald-500"
      },
    ];
  }, [exams, today]);

  const upcomingCount = filterUpcomingExams(exams).length;

  if (isLoading) {
    return (
      <div className="relative mb-10 overflow-hidden rounded-[2.5rem] border border-primary/10 bg-card/30 p-8 md:p-12 shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-12 w-80" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center lg:items-start">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-10 overflow-hidden rounded-[2.5rem] border border-primary/10 bg-card/30 p-8 md:p-12 shadow-sm">
      {/* Background Orbs */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-violet-500/5 blur-[80px]" />

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary"
          >
            <Sparkles className="h-3 w-3" />
            Dashboard
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Welcome back, <span className="bg-linear-to-r from-primary to-violet-400 bg-clip-text text-transparent">{firstName ?? "Student"}</span>.
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {upcomingCount > 0 ? (
                <>
                  You have <span className="text-foreground font-medium underline decoration-primary/30">{upcomingCount} upcoming exam{upcomingCount !== 1 ? 's' : ''}</span> to prepare for.
                </>
              ) : (
                <>
                  No upcoming exams. <span className="text-foreground font-medium">Time to add some!</span>
                </>
              )}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex flex-col items-center lg:items-start"
            >
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 md:text-xs">
                  {stat.label}
                </span>
              </div>
              <span className="text-xl font-bold md:text-2xl">{stat.value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
