"use client";

import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamWithStatus } from "@/lib/actions/exam";

interface ScheduleStatusBadgeProps {
  scheduleStatus: ExamWithStatus["scheduleStatus"];
  compact?: boolean;
}

export function ScheduleStatusBadge({
  scheduleStatus,
  compact = false
}: ScheduleStatusBadgeProps) {
  const config = {
    NONE: {
      icon: Clock,
      label: "No schedule yet",
      className: "bg-muted/50 text-muted-foreground",
      animate: false,
    },
    GENERATING: {
      icon: Loader2,
      label: "Generating schedule...",
      className: "bg-blue-500/10 text-blue-500",
      animate: true,
    },
    GENERATED: {
      icon: CheckCircle,
      label: "Schedule ready",
      className: "bg-green-500/10 text-green-500",
      animate: false,
    },
    FAILED: {
      icon: XCircle,
      label: "Generation failed",
      className: "bg-red-500/10 text-red-500",
      animate: false,
    },
  };

  const status = config[scheduleStatus];
  const Icon = status.icon;

  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
        status.className
      )}>
        <Icon className={cn("h-3 w-3", status.animate && "animate-spin")} />
      </div>
    );
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
      status.className
    )}>
      <Icon className={cn("h-3.5 w-3.5", status.animate && "animate-spin")} />
      <span>{status.label}</span>
    </div>
  );
}
