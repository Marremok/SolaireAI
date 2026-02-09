"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// REMOVED: Select components (no longer needed - session length moved to Exam)
import { useUserSettings, useUpdateSettings } from "@/hooks/use-settings";
import {
  userSettingsSchema,
  type UserSettingsInput,
  DAY_OPTIONS,
  // REMOVED: SESSION_LENGTH_OPTIONS (moved to Exam level)
  // REMOVED: INTENSITY_OPTIONS (no longer needed - pure math)
} from "@/lib/schemas/settings";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

// REMOVED: INTENSITY_LABELS (no longer needed - pure math instead)

export default function SettingsForm() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UserSettingsInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userSettingsSchema) as any,
    defaultValues: settings || {
      maxHoursPerWeek: 15,
      maxHoursPerDay: 3,
      restDays: [],
    },
    values: settings || undefined,
  });

  const restDays = watch("restDays") || [];
  const maxHours = watch("maxHoursPerWeek");
  // REMOVED: intensity watch (no longer needed)

  const toggleRestDay = (
    day: (typeof DAY_OPTIONS)[number]
  ) => {
    const current = restDays;
    if (current.includes(day)) {
      setValue(
        "restDays",
        current.filter((d) => d !== day),
        { shouldDirty: true }
      );
    } else {
      if (current.length >= 6) {
        // Don't allow selecting all 7 days
        return;
      }
      setValue("restDays", [...current, day], { shouldDirty: true });
    }
  };

  const getCapacityWarning = (
    maxHours: number,
    restDays: string[]
  ): string | null => {
    const availableDays = 7 - restDays.length;
    const hoursPerDay = maxHours / Math.max(availableDays, 1);

    if (hoursPerDay < 0.5) {
      return "⚠️ Very low daily capacity - you may not be able to schedule sessions";
    }
    if (hoursPerDay > 10) {
      return "⚠️ High daily capacity - ensure this is sustainable";
    }
    return null;
  };

  const onSubmit = async (data: UserSettingsInput) => {
    try {
      await updateSettings.mutateAsync(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Study Capacity Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Study Capacity</h2>
            <p className="text-sm text-muted-foreground">
              Set your time limits to prevent burnout and ensure a balanced schedule.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            
            {/* 1. Maximum Hours Per Week */}
            <div className="space-y-2">
              <Label htmlFor="maxHoursPerWeek">Maximum Hours per Week</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="maxHoursPerWeek"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="168"
                  className="w-32"
                  {...register("maxHoursPerWeek", { valueAsNumber: true })}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  hrs/week 
                  <span className="hidden sm:inline">
                    ({maxHours ? ((maxHours || 0) / 7).toFixed(1) : "0.0"} /day avg)
                  </span>
                </span>
              </div>
              
              {errors.maxHoursPerWeek && (
                <p className="text-xs text-destructive">
                  {errors.maxHoursPerWeek.message}
                </p>
              )}
              
              {/* Capacity Warning (kept specific to weekly volume) */}
              {getCapacityWarning(maxHours || 0, restDays) && (
                <div className="mt-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    {getCapacityWarning(maxHours || 0, restDays)}
                  </p>
                </div>
              )}
            </div>

            {/* 2. Maximum Hours Per Day (NEW) */}
            <div className="space-y-2">
              <Label htmlFor="maxHoursPerDay">Maximum Hours per Day</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="maxHoursPerDay"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  className="w-32"
                  {...register("maxHoursPerDay", { valueAsNumber: true })}
                />
                <span className="text-sm text-muted-foreground">
                  hours/day limit
                </span>
              </div>
              
              {errors.maxHoursPerDay && (
                <p className="text-xs text-destructive">
                  {errors.maxHoursPerDay.message}
                </p>
              )}
            </div>

          </div>
        </div>
      </Card>

      {/* Rest & Recovery Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Rest & Recovery</h2>
            <p className="text-sm text-muted-foreground">
              Choose which days you don't want to study
            </p>
          </div>

          <div className="space-y-2">
            <Label>Rest Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleRestDay(day)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    restDays.includes(day)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {restDays.length === 0
                ? "No rest days selected - study every day"
                : `${7 - restDays.length} study days per week`}
            </p>
            {errors.restDays && (
              <p className="text-xs text-destructive">
                {errors.restDays.message}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* REMOVED: Preferences Section (session length and intensity now handled per-exam) */}

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>Settings saved successfully</span>
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={!isDirty || updateSettings.isPending}
          size="lg"
        >
          {updateSettings.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
