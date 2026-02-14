"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarIcon,
  Plus,
  Loader2,
  PenLine,
  BookOpenText,
  FolderKanban,
  FileText,
  Repeat,
  SearchCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCreateExam, useUpdateExam } from "@/hooks/use-exams";
import { useUserSettings } from "@/hooks/use-settings";
import type { ExamWithStatus } from "@/lib/actions/exam";
import { WHEN_TO_START_OPTIONS } from "@/lib/constants";
import { SUBJECT_COLORS, type SubjectConfig } from "@/lib/colors";

// Available study methods
const STUDY_METHODS: { label: string; icon: LucideIcon }[] = [
  { label: "Practice Problems", icon: PenLine },
  { label: "Read & Take Notes", icon: BookOpenText },
  { label: "Continue Project", icon: FolderKanban },
  { label: "Summarize Concepts", icon: FileText },
  { label: "Repetition", icon: Repeat },
  { label: "Review Mistakes", icon: SearchCheck },
];

// Human-readable labels for whenToStartStudying options
const WHEN_TO_START_LABELS: Record<string, string> = {
  tomorrow: "Tomorrow",
  in_2_days: "In 2 days",
  in_3_days: "In 3 days",
  next_week: "Next week",
  the_week_before: "1 week before exam",
  "2_weeks_before": "2 weeks before exam",
  "3_weeks_before": "3 weeks before exam",
  "4_weeks_before": "4 weeks before exam",
};

// Form validation schema
const examSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  subject: z.string().min(1, "Subject is required"),
  preferences: z.string().max(500, "Description is too long").optional(),
  date: z.date(),
  whenToStartStudying: z.string().refine(
    (val) => (WHEN_TO_START_OPTIONS as readonly string[]).includes(val),
    { message: "Invalid start time" }
  ),
  targetSessionsPerWeek: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "At least 1 session per week")
    .max(21, "Maximum 21 sessions per week"),
  sessionLengthMinutes: z.coerce
    .number()
    .refine((val) => [30, 45, 60, 90, 120].includes(val), {
      message: "Must be 30, 45, 60, 90, or 120 minutes",
    })
    .default(60),
  studyMethods: z.array(z.string()).min(1, "Select at least one study method"),
});

type ExamFormData = z.infer<typeof examSchema>;

interface AddExamDialogProps {
  trigger?: React.ReactNode;
  exam?: ExamWithStatus;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddExamDialog({ trigger, exam, open: controlledOpen, onOpenChange }: AddExamDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const createExam = useCreateExam();
  const updateExamMutation = useUpdateExam();
  const { data: userSettings } = useUserSettings();
  const userSubjects: SubjectConfig[] = userSettings?.subjects ?? [];

  const isEditMode = !!exam;
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isPending = isEditMode ? updateExamMutation.isPending : createExam.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExamFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(examSchema) as any,
    defaultValues: {
      title: "",
      subject: "",
      preferences: "",
      whenToStartStudying: "tomorrow",
      targetSessionsPerWeek: 3,
      sessionLengthMinutes: 60,
      studyMethods: [],
    },
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (exam && open) {
      reset({
        title: exam.title,
        subject: exam.subject ?? "",
        preferences: exam.preferences ?? "",
        date: new Date(exam.date),
        whenToStartStudying: exam.whenToStartStudying,
        targetSessionsPerWeek: exam.targetSessionsPerWeek,
        sessionLengthMinutes: exam.sessionLengthMinutes,
        studyMethods: exam.studyMethods,
      });
    }
  }, [exam, open, reset]);

  const selectedDate = watch("date");
  const selectedMethods = watch("studyMethods") || [];

  const toggleMethod = (method: string) => {
    const current = selectedMethods;
    if (current.includes(method)) {
      setValue(
        "studyMethods",
        current.filter((m) => m !== method)
      );
    } else {
      setValue("studyMethods", [...current, method]);
    }
  };

  const onSubmit = async (data: ExamFormData) => {
    try {
      if (isEditMode) {
        await updateExamMutation.mutateAsync({
          examId: exam.id,
          input: {
            title: data.title,
            subject: data.subject,
            preferences: data.preferences || undefined,
            date: data.date,
            whenToStartStudying: data.whenToStartStudying,
            targetSessionsPerWeek: data.targetSessionsPerWeek,
            sessionLengthMinutes: data.sessionLengthMinutes,
            studyMethods: data.studyMethods,
          },
        });

        toast.success("Exam updated", {
          description: "Your study schedule is being regenerated...",
        });
      } else {
        await createExam.mutateAsync({
          title: data.title,
          subject: data.subject,
          preferences: data.preferences || undefined,
          date: data.date,
          whenToStartStudying: data.whenToStartStudying,
          targetSessionsPerWeek: data.targetSessionsPerWeek,
          sessionLengthMinutes: data.sessionLengthMinutes,
          studyMethods: data.studyMethods,
        });

        toast.success("Exam created successfully", {
          description: "Your study schedule is being generated...",
        });
      }

      reset();
      setOpen(false);
    } catch (error) {
      console.error(`Failed to ${isEditMode ? "update" : "create"} exam:`, error);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} exam`, {
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
      {!isEditMode && (
        <DialogTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5 px-4 h-9"
            >
              <Plus className="h-4 w-4" /> Add Exam
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-125 bg-background/95 backdrop-blur-xl border-border/50 max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-0">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditMode ? "Edit Exam" : "Add New Exam"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update your exam details. Your schedule will be regenerated."
                : "Create a new exam to track and plan your study sessions."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-6 overflow-y-auto min-h-0 flex-1 pr-1">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Math 4 Finals"
                {...register("title")}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Subject */}
            <div className="grid gap-2">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("subject") || ""}
                onValueChange={(val) => setValue("subject", val, { shouldDirty: true })}
              >
                <SelectTrigger id="subject">
                  {watch("subject") ? (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const match = userSubjects.find((s) => s.name === watch("subject"));
                        const swatch = match ? SUBJECT_COLORS[match.color]?.swatch : null;
                        return swatch ? <div className={`h-3 w-3 rounded-full ${swatch}`} /> : null;
                      })()}
                      <span className="truncate">{watch("subject")}</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select subject" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {userSubjects.map((s) => (
                    <SelectItem key={s.name} value={s.name}>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${SUBJECT_COLORS[s.color]?.swatch ?? "bg-gray-500"}`} />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && (
                <p className="text-xs text-destructive">{errors.subject.message}</p>
              )}
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label>
                Exam Date <span className="text-destructive">*</span>
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        // Use UTC noon to prevent timezone shifts
                        const utcDate = new Date(
                          Date.UTC(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate(),
                            12, 0, 0, 0
                          )
                        );
                        setValue("date", utcDate);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>

            {/* When to Start Studying */}
            <div className="grid gap-2">
              <Label htmlFor="whenToStartStudying">
                Start studying <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("whenToStartStudying") || "tomorrow"}
                onValueChange={(val) =>
                  setValue("whenToStartStudying", val, { shouldDirty: true })
                }
              >
                <SelectTrigger id="whenToStartStudying">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WHEN_TO_START_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {WHEN_TO_START_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.whenToStartStudying && (
                <p className="text-xs text-destructive">
                  {errors.whenToStartStudying.message}
                </p>
              )}
            </div>

            {/* Sessions per Week */}
            <div className="grid gap-2">
              <Label htmlFor="targetSessionsPerWeek">
                Sessions per Week <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetSessionsPerWeek"
                type="number"
                step="1"
                min="1"
                max="21"
                placeholder="e.g., 5"
                {...register("targetSessionsPerWeek")}
              />
              <p className="text-xs text-muted-foreground">
                Exactly this many study sessions will be scheduled each week
              </p>
              {errors.targetSessionsPerWeek && (
                <p className="text-xs text-destructive">
                  {errors.targetSessionsPerWeek.message}
                </p>
              )}
            </div>

            {/* Session Length */}
            <div className="grid gap-2">
              <Label htmlFor="sessionLength">Session Length</Label>
              <Select
                value={watch("sessionLengthMinutes")?.toString() || "60"}
                onValueChange={(val) =>
                  setValue("sessionLengthMinutes", parseInt(val), {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="sessionLength">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[30, 45, 60, 90, 120].map((minutes) => (
                    <SelectItem key={minutes} value={minutes.toString()}>
                      {minutes} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How long you want each study session to be
              </p>
              {errors.sessionLengthMinutes && (
                <p className="text-xs text-destructive">
                  {errors.sessionLengthMinutes.message}
                </p>
              )}
            </div>

            {/* Study Methods */}
            <div className="grid gap-2">
              <Label>
                Study Methods <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {STUDY_METHODS.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleMethod(label)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                      selectedMethods.includes(label)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              {errors.studyMethods && (
                <p className="text-xs text-destructive">
                  {errors.studyMethods.message}
                </p>
              )}
            </div>

            {/* Preferences */}
            <div className="grid gap-2">
              <Label htmlFor="preferences">Preferences</Label>
              <Textarea
                id="preferences"
                placeholder="Optional preferences for this exam. For example: avoid Sundays, keep sessions separate, lower priority, etc."
                className="resize-none"
                rows={3}
                {...register("preferences")}
              />
              {errors.preferences && (
                <p className="text-xs text-destructive">
                  {errors.preferences.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Save Changes" : "Create Exam"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
