"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
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
import { useCreateExam } from "@/hooks/use-exams";

// Available study methods
const STUDY_METHODS = [
  "Active Recall",
  "Spaced Repetition",
  "Feynman Technique",
  "Mind Mapping",
  "Practice Problems",
  "Flashcards",
  "Summarization",
  "Teaching Others",
];

// Form validation schema
const examSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  subject: z.string().max(100, "Subject is too long").optional(),
  description: z.string().max(500, "Description is too long").optional(),
  date: z.date(),
  hoursPerWeek: z.coerce
    .number()
    .min(0.5, "Minimum 0.5 hours per week")
    .max(168, "Maximum 168 hours per week")
    .optional(),
  preferredSessionLengthMinutes: z.coerce
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
}

export function AddExamDialog({ trigger }: AddExamDialogProps) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const createExam = useCreateExam();

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
      description: "",
      hoursPerWeek: undefined,
      preferredSessionLengthMinutes: 60,
      studyMethods: [],
    },
  });

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
      await createExam.mutateAsync({
        title: data.title,
        subject: data.subject || undefined,
        description: data.description || undefined,
        date: data.date,
        hoursPerWeek: data.hoursPerWeek || undefined,
        preferredSessionLengthMinutes: data.preferredSessionLengthMinutes,
        studyMethods: data.studyMethods,
      });

      toast.success("Exam created successfully", {
        description: "Your study schedule is being generated...",
      });

      reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to create exam:", error);
      toast.error("Failed to create exam", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="sm:max-w-125 bg-background/95 backdrop-blur-xl border-border/50">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Exam</DialogTitle>
            <DialogDescription>
              Create a new exam to track and plan your study sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-6">
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
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Mathematics"
                {...register("subject")}
              />
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
                        setValue("date", date);
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

            {/* Hours per Week */}
            <div className="grid gap-2">
              <Label htmlFor="hoursPerWeek">Target Hours / Week</Label>
              <Input
                id="hoursPerWeek"
                type="number"
                step="0.5"
                min="0.5"
                max="168"
                placeholder="e.g., 8 or 8.5"
                {...register("hoursPerWeek")}
              />
              {errors.hoursPerWeek && (
                <p className="text-xs text-destructive">
                  {errors.hoursPerWeek.message}
                </p>
              )}
            </div>

            {/* Preferred Session Length */}
            <div className="grid gap-2">
              <Label htmlFor="sessionLength">Preferred Session Length</Label>
              <Select
                value={watch("preferredSessionLengthMinutes")?.toString() || "60"}
                onValueChange={(val) =>
                  setValue("preferredSessionLengthMinutes", parseInt(val), {
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
              {errors.preferredSessionLengthMinutes && (
                <p className="text-xs text-destructive">
                  {errors.preferredSessionLengthMinutes.message}
                </p>
              )}
            </div>

            {/* Study Methods */}
            <div className="grid gap-2">
              <Label>
                Study Methods <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {STUDY_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => toggleMethod(method)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                      selectedMethods.includes(method)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
              {errors.studyMethods && (
                <p className="text-xs text-destructive">
                  {errors.studyMethods.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what the exam covers..."
                className="resize-none"
                rows={3}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
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
            <Button type="submit" disabled={createExam.isPending}>
              {createExam.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Exam"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
