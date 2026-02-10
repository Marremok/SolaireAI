"use client";

import { motion, Variants } from "framer-motion";
import { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Clock,
  SlidersHorizontal,
  CalendarDays,
  Trash2,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { useExams, useDeleteExam, filterUpcomingExams, filterCompletedExams } from "@/hooks/use-exams";
import { AddExamDialog } from "./AddExamDialog";
import { ScheduleStatusBadge } from "./ScheduleStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ExamWithStatus } from "@/lib/actions/exam";

// Color palette for exam cards
const EXAM_COLORS = [
  "border-blue-500/20",
  "border-violet-500/20",
  "border-emerald-500/20",
  "border-orange-500/20",
  "border-rose-500/20",
  "border-cyan-500/20",
];

function getExamColor(index: number): string {
  return EXAM_COLORS[index % EXAM_COLORS.length];
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

interface ExamCardProps {
  exam: ExamWithStatus;
  colorClass: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function ExamCard({ exam, colorClass, onEdit, onDelete, isDeleting }: ExamCardProps) {
  const studyMethods = Array.isArray(exam.studyMethods)
    ? exam.studyMethods.join(", ")
    : "";

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.04)" }}
      className={cn(
        "group relative flex flex-col p-5 rounded-4xl border bg-background/40 transition-all duration-300 min-h-80",
        colorClass,
        exam.status === "COMPLETED" && "opacity-60"
      )}
    >
      {/* Header with Menu */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="inline-flex p-2 rounded-xl bg-primary/10 text-primary mb-3">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold tracking-tight line-clamp-1">
            {exam.title}
          </h4>
          {exam.subject && (
            <p className="text-xs text-muted-foreground mt-1">{exam.subject}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Badge */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
            exam.status === "UPCOMING"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {exam.status}
        </span>
        {(exam.scheduleStatus === "GENERATING" || exam.scheduleStatus === "FAILED") && (
          <ScheduleStatusBadge scheduleStatus={exam.scheduleStatus} />
        )}
      </div>

      {/* Data Rows */}
      <div className="flex-1 space-y-4">
        {/* Date */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <CalendarDays className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Exam Date
            </span>
          </div>
          <p className="text-xs font-semibold text-foreground/90">
            {format(new Date(exam.date), "PPP")}
          </p>
        </div>

        {/* Study Methods */}
        {studyMethods && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <BookOpen className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Methods
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground/90 line-clamp-1">
              {studyMethods}
            </p>
          </div>
        )}

        {/* Hours per Week */}
        {exam.hoursPerWeek && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Clock className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Target Effort
              </span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-foreground/90">
                {exam.hoursPerWeek}h/week
              </p>
              <div className="h-1 flex-1 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-primary/40 w-2/3 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Preferences */}
        {exam.preferences && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <SlidersHorizontal className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Preferences
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
              {exam.preferences}
            </p>
          </div>
        )}
      </div>

      {/* Hover accent */}
      <div className="absolute inset-x-6 bottom-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

function ExamsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col p-5 rounded-4xl border border-border/20 bg-background/40 min-h-80"
        >
          <Skeleton className="h-10 w-10 rounded-xl mb-3" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <div className="space-y-4 flex-1">
            <div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-primary/10 mb-4">
        <GraduationCap className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No exams yet</h3>
      <p className="text-muted-foreground text-sm text-center mb-6 max-w-sm">
        Start by adding your first exam to track your study progress and stay
        organized.
      </p>
      <AddExamDialog />
    </div>
  );
}

export function ExamsList() {
  const { data: exams, isLoading, error } = useExams();
  const deleteExam = useDeleteExam();
  const [editingExam, setEditingExam] = useState<ExamWithStatus | null>(null);

  const upcomingExams = filterUpcomingExams(exams);
  const completedExams = filterCompletedExams(exams);

  if (isLoading) {
    return <ExamsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load exams. Please try again.</p>
      </div>
    );
  }

  if (!exams || exams.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-12">
      {/* Edit Dialog */}
      {editingExam && (
        <AddExamDialog
          exam={editingExam}
          open={!!editingExam}
          onOpenChange={(v) => { if (!v) setEditingExam(null); }}
        />
      )}

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Upcoming Exams
            <span className="text-muted-foreground font-normal">
              ({upcomingExams.length})
            </span>
          </h3>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.1 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {upcomingExams.map((exam, index) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                colorClass={getExamColor(index)}
                onEdit={() => setEditingExam(exam)}
                onDelete={() => deleteExam.mutate(exam.id)}
                isDeleting={deleteExam.isPending}
              />
            ))}
          </motion.div>
        </section>
      )}

      {/* Completed Exams */}
      {completedExams.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            Completed Exams
            <span className="text-muted-foreground font-normal">
              ({completedExams.length})
            </span>
          </h3>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.1 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {completedExams.map((exam, index) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                colorClass={getExamColor(index)}
                onEdit={() => setEditingExam(exam)}
                onDelete={() => {
                  toast.promise(
                    deleteExam.mutateAsync(exam.id),
                    {
                      loading: "Deleting exam...",
                      success: "Exam deleted successfully",
                      error: "Failed to delete exam",
                    }
                  );
                }}
                isDeleting={deleteExam.isPending}
              />
            ))}
          </motion.div>
        </section>
      )}
    </div>
  );
}
