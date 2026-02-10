"use client"

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  SlidersHorizontal,
  GraduationCap,
  Clock,
  Pencil,
} from "lucide-react";
import Link from "next/link";

import { useExams, filterUpcomingExams } from "@/hooks/use-exams";
import { AddExamDialog } from "./AddExamDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExamWithStatus } from "@/lib/actions/exam";

// Color palette for exam cards
const EXAM_COLORS = [
  "border-blue-500/20",
  "border-violet-500/20",
  "border-emerald-500/20",
  "border-orange-500/20",
];

function getExamColor(index: number): string {
  return EXAM_COLORS[index % EXAM_COLORS.length];
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  }
};

function ExamCard({ exam, colorClass, onEdit }: { exam: ExamWithStatus; colorClass: string; onEdit: () => void }) {
  const studyMethods = Array.isArray(exam.studyMethods)
    ? exam.studyMethods.slice(0, 2).join(", ")
    : "";

  const effortText = `${exam.targetSessionsPerWeek}x/week · ${exam.sessionLengthMinutes}min`;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.04)" }}
      className={`group relative flex flex-col p-5 rounded-4xl border ${colorClass} bg-background/40 transition-all duration-300 min-h-80`}
    >
      {/* Exam Title & Icon */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="inline-flex p-2 rounded-xl bg-primary/10 text-primary mb-3">
            <GraduationCap className="h-5 w-5" />
          </div>
        <h4 className="text-lg font-bold tracking-tight line-clamp-1">{exam.title}</h4>
        {exam.subject && (
          <p className="text-xs text-muted-foreground mt-1">{exam.subject}</p>
        )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Data Rows */}
      <div className="flex-1 space-y-5">
        {/* Row 1: Methods */}
        {studyMethods && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <BookOpen className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Methods</span>
            </div>
            <p className="text-xs font-semibold text-foreground/90">{studyMethods}</p>
          </div>
        )}

        {/* Row 2: Effort */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Target Effort</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-foreground/90">{effortText}</p>
            <div className="h-1 flex-1 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary/40 w-2/3 rounded-full" />
            </div>
          </div>
        </div>

        {/* Row 3: Preferences */}
        {exam.preferences && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <SlidersHorizontal className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Preferences</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
              {exam.preferences}
            </p>
          </div>
        )}
      </div>

      {/* Subtle accent border on hover */}
      <div className="absolute inset-x-6 bottom-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col p-5 rounded-4xl border border-border/20 bg-background/40 min-h-80"
        >
          <Skeleton className="h-10 w-10 rounded-xl mb-3" />
          <Skeleton className="h-6 w-3/4 mb-6" />
          <div className="space-y-5 flex-1">
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="p-3 rounded-full bg-primary/10 mb-3">
        <GraduationCap className="h-6 w-6 text-primary" />
      </div>
      <h4 className="text-sm font-semibold mb-1">No exams yet</h4>
      <p className="text-muted-foreground text-xs text-center mb-4">
        Add your first exam to start tracking
      </p>
      <AddExamDialog />
    </div>
  );
}

export default function ExamManagement() {
  const { data: exams, isLoading } = useExams();
  const upcomingExams = filterUpcomingExams(exams);
  const [editingExam, setEditingExam] = useState<ExamWithStatus | null>(null);

  // Show max 4 exams on dashboard
  const displayExams = upcomingExams.slice(0, 4);

  return (
    <div className="w-full mt-12">
      {/* Edit Dialog */}
      {editingExam && (
        <AddExamDialog
          exam={editingExam}
          open={!!editingExam}
          onOpenChange={(v) => { if (!v) setEditingExam(null); }}
        />
      )}
      {/* --- HEADER SECTION --- */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-semibold tracking-tight">Exam Management</h3>
          <AddExamDialog />
        </div>

        <Link
          href="/dashboard/exams"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all group"
        >
          View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* --- MAIN HORIZONTAL CONTAINER --- */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-card/20 backdrop-blur-xl p-6 shadow-sm">

        {/* Subtle background glow */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 blur-[100px] -z-10 rounded-full" />

        {isLoading ? (
          <LoadingSkeleton />
        ) : displayExams.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {displayExams.map((exam, index) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                colorClass={getExamColor(index)}
                onEdit={() => setEditingExam(exam)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
