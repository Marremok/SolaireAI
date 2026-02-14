"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SUBJECT_COLORS, type SubjectConfig } from "@/lib/colors";

const colorKeys = Object.keys(SUBJECT_COLORS);

interface SubjectManagementProps {
  subjects: SubjectConfig[];
  onAdd: (name: string, color: string) => void;
  onRemove: (index: number) => void;
  onChangeColor: (index: number, color: string) => void;
}

export function SubjectManagement({
  subjects,
  onAdd,
  onRemove,
  onChangeColor,
}: SubjectManagementProps) {
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(colorKeys[0]);

  const handleAdd = () => {
    const trimmed = newSubjectName.trim();
    if (!trimmed) return;
    if (subjects.length >= 20) return;
    if (subjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    onAdd(trimmed, newSubjectColor);
    setNewSubjectName("");
  };

  return (
    <Card className="p-6 overflow-hidden">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Subjects & Colors</h2>
          <p className="text-sm text-muted-foreground">
            Manage your subjects and their colors
          </p>
        </div>

        {/* Subject list */}
        <div className="space-y-2">
          {subjects.map((subject, i) => (
            <div
              key={i}
              className="group flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-border/40 hover:bg-muted/40 transition-all duration-200"
            >
              <Select
                value={subject.color}
                onValueChange={(color) => onChangeColor(i, color)}
              >
                <SelectTrigger className="w-37.5 h-9 bg-background/50 shadow-sm">
                  <div className="flex items-center gap-2 w-full overflow-hidden">
                    <div
                      className={`h-3 w-3 shrink-0 rounded-full ring-1 ring-inset ring-black/10 ${
                        SUBJECT_COLORS[subject.color]?.swatch ?? "bg-gray-500"
                      }`}
                    />
                    <span className="truncate text-sm">
                      {SUBJECT_COLORS[subject.color]?.label || subject.color}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {colorKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${SUBJECT_COLORS[key].swatch}`}
                        />
                        {SUBJECT_COLORS[key].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="flex-1 text-sm font-medium truncate text-foreground/90">
                {subject.name}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground opacity-50 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                onClick={() => onRemove(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {subjects.length === 0 && (
            <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm">
              No subjects added yet.
            </div>
          )}
        </div>

        {/* Add new subject */}
        <div className="pt-2">
          {subjects.length < 20 ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Add a new subject..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  className="h-10 pr-4"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={newSubjectColor} onValueChange={setNewSubjectColor}>
                  <SelectTrigger className="w-full sm:w-37.5 h-10">
                    <div className="flex items-center gap-2 w-full overflow-hidden">
                      <div
                        className={`h-3 w-3 shrink-0 rounded-full ring-1 ring-inset ring-black/10 ${SUBJECT_COLORS[newSubjectColor]?.swatch}`}
                      />
                      <span className="truncate text-sm">
                        {SUBJECT_COLORS[newSubjectColor]?.label}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {colorKeys.map((key) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-3 w-3 rounded-full ${SUBJECT_COLORS[key].swatch}`}
                          />
                          {SUBJECT_COLORS[key].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={handleAdd}
                  disabled={!newSubjectName.trim() || subjects.length >= 20}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 text-center">
              Maximum limit of 20 subjects reached.
            </p>
          )}

          <div className="flex justify-between items-center mt-2 px-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Capacity
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {subjects.length} / 20
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
