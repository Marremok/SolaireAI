"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserSettings, useUpdateSettings } from "@/hooks/use-settings";
import {
  userSettingsSchema,
  type UserSettingsInput,
  DAY_OPTIONS,
} from "@/lib/schemas/settings";
import type { SubjectConfig } from "@/lib/colors";
import { RestDayMenu } from "./RestDayMenu";
import { SubjectManagement } from "./SubjectManagement";

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
      subjects: [],
    },
    values: settings || undefined,
  });

  const restDays = watch("restDays") || [];
  const subjects: SubjectConfig[] = watch("subjects") || [];

  const toggleRestDay = (day: (typeof DAY_OPTIONS)[number]) => {
    const current = restDays;
    if (current.includes(day)) {
      setValue("restDays", current.filter((d) => d !== day), { shouldDirty: true });
    } else {
      if (current.length >= 6) return;
      setValue("restDays", [...current, day], { shouldDirty: true });
    }
  };

  const addSubject = (name: string, color: string) => {
    setValue("subjects", [...subjects, { name, color }], { shouldDirty: true });
  };

  const removeSubject = (index: number) => {
    setValue("subjects", subjects.filter((_, i) => i !== index), { shouldDirty: true });
  };

  const changeSubjectColor = (index: number, color: string) => {
    const updated = subjects.map((s, i) => (i === index ? { ...s, color } : s));
    setValue("subjects", updated, { shouldDirty: true });
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
      <RestDayMenu
        restDays={restDays}
        onToggle={toggleRestDay}
        error={errors.restDays?.message}
      />

      <SubjectManagement
        subjects={subjects}
        onAdd={addSubject}
        onRemove={removeSubject}
        onChangeColor={changeSubjectColor}
      />

      {/* Save Button Area */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2 min-h-6">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 animate-in fade-in slide-in-from-left-2">
              <Check className="h-3.5 w-3.5" />
              <span className="font-medium">Saved</span>
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={!isDirty || updateSettings.isPending}
          size="lg"
          className="min-w-35 shadow-sm"
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
