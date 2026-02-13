"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserSettings, useUpdateSettings } from "@/hooks/use-settings";
import {
  userSettingsSchema,
  type UserSettingsInput,
  DAY_OPTIONS,
} from "@/lib/schemas/settings";
import { SUBJECT_COLORS, type SubjectConfig } from "@/lib/colors";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const colorKeys = Object.keys(SUBJECT_COLORS);

export default function SettingsForm() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(colorKeys[0]);

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

  const addSubject = () => {
    const trimmed = newSubjectName.trim();
    if (!trimmed) return;
    if (subjects.length >= 20) return;
    if (subjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;

    setValue("subjects", [...subjects, { name: trimmed, color: newSubjectColor }], {
      shouldDirty: true,
    });
    setNewSubjectName("");
  };

  const removeSubject = (index: number) => {
    setValue(
      "subjects",
      subjects.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
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

      {/* Subjects & Colors Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Subjects & Colors</h2>
            <p className="text-sm text-muted-foreground">
              Manage your subjects and their colors
            </p>
          </div>

          {/* Subject list */}
          <div className="space-y-2">
            {subjects.map((subject, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-background/40"
              >
                <Select
                  value={subject.color}
                  onValueChange={(color) => changeSubjectColor(i, color)}
                >
                  <SelectTrigger className="w-25 h-8">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${SUBJECT_COLORS[subject.color]?.swatch ?? "bg-gray-500"}`} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {colorKeys.map((key) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${SUBJECT_COLORS[key].swatch}`} />
                          {SUBJECT_COLORS[key].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="flex-1 text-sm font-medium truncate">{subject.name}</span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSubject(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add new subject */}
          {subjects.length < 20 && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Subject name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubject();
                  }
                }}
                className="flex-1 h-9"
              />
              <Select value={newSubjectColor} onValueChange={setNewSubjectColor}>
                <SelectTrigger className="w-25 h-9">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${SUBJECT_COLORS[newSubjectColor]?.swatch}`} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {colorKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${SUBJECT_COLORS[key].swatch}`} />
                        {SUBJECT_COLORS[key].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={addSubject}
                disabled={!newSubjectName.trim() || subjects.length >= 20}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {subjects.length}/20 subjects
          </p>
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
