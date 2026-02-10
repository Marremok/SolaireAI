"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUserSettings, useUpdateSettings } from "@/hooks/use-settings";
import {
  userSettingsSchema,
  type UserSettingsInput,
  DAY_OPTIONS,
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

export default function SettingsForm() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UserSettingsInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userSettingsSchema) as any,
    defaultValues: settings || {
      restDays: [],
    },
    values: settings || undefined,
  });

  const restDays = watch("restDays") || [];

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
        return;
      }
      setValue("restDays", [...current, day], { shouldDirty: true });
    }
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
      {/* Rest & Recovery Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Rest & Recovery</h2>
            <p className="text-sm text-muted-foreground">
              Choose which days you don&apos;t want to study
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
