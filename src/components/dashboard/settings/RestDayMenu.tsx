"use client";

import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DAY_OPTIONS } from "@/lib/schemas/settings";
import { DAY_LABELS } from "@/lib/settings/constants";

interface RestDayMenuProps {
  restDays: string[];
  onToggle: (day: (typeof DAY_OPTIONS)[number]) => void;
  error?: string;
}

export function RestDayMenu({ restDays, onToggle, error }: RestDayMenuProps) {
  return (
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
                onClick={() => onToggle(day)}
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
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
