// Centralized subject-color system
// Replaces all per-component EXAM_COLORS constants

export interface SubjectColorSet {
  gradient: string;   // CalendarView, ComingDays exam pills
  border: string;     // ExamsList, ExamManagement card borders
  solid: string;      // TodayBox dots
  pill: string;       // CalendarView session pills
  shadow: string;     // ComingDays pill shadows
  swatch: string;     // Settings color preview
  label: string;      // Human-readable name
}

export interface SubjectConfig {
  name: string;
  color: string;
}

export const SUBJECT_COLORS: Record<string, SubjectColorSet> = {
  blue: {
    gradient: "from-blue-500 to-cyan-400",
    border: "border-blue-500/20",
    solid: "bg-blue-500",
    pill: "bg-blue-500/20 border border-blue-500/30 text-blue-400",
    shadow: "shadow-blue-500/25",
    swatch: "bg-blue-500",
    label: "Blue",
  },
  violet: {
    gradient: "from-violet-500 to-purple-400",
    border: "border-violet-500/20",
    solid: "bg-violet-500",
    pill: "bg-violet-500/20 border border-violet-500/30 text-violet-400",
    shadow: "shadow-violet-500/25",
    swatch: "bg-violet-500",
    label: "Violet",
  },
  emerald: {
    gradient: "from-emerald-500 to-teal-400",
    border: "border-emerald-500/20",
    solid: "bg-emerald-500",
    pill: "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400",
    shadow: "shadow-emerald-500/25",
    swatch: "bg-emerald-500",
    label: "Emerald",
  },
  orange: {
    gradient: "from-orange-500 to-amber-400",
    border: "border-orange-500/20",
    solid: "bg-orange-500",
    pill: "bg-orange-500/20 border border-orange-500/30 text-orange-400",
    shadow: "shadow-orange-500/25",
    swatch: "bg-orange-500",
    label: "Orange",
  },
  rose: {
    gradient: "from-rose-500 to-pink-400",
    border: "border-rose-500/20",
    solid: "bg-rose-500",
    pill: "bg-rose-500/20 border border-rose-500/30 text-rose-400",
    shadow: "shadow-rose-500/25",
    swatch: "bg-rose-500",
    label: "Rose",
  },
  cyan: {
    gradient: "from-cyan-500 to-sky-400",
    border: "border-cyan-500/20",
    solid: "bg-cyan-500",
    pill: "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400",
    shadow: "shadow-cyan-500/25",
    swatch: "bg-cyan-500",
    label: "Cyan",
  },
  indigo: {
    gradient: "from-indigo-500 to-blue-400",
    border: "border-indigo-500/20",
    solid: "bg-indigo-500",
    pill: "bg-indigo-500/20 border border-indigo-500/30 text-indigo-400",
    shadow: "shadow-indigo-500/25",
    swatch: "bg-indigo-500",
    label: "Indigo",
  },
  teal: {
    gradient: "from-teal-500 to-emerald-400",
    border: "border-teal-500/20",
    solid: "bg-teal-500",
    pill: "bg-teal-500/20 border border-teal-500/30 text-teal-400",
    shadow: "shadow-teal-500/25",
    swatch: "bg-teal-500",
    label: "Teal",
  },
  amber: {
    gradient: "from-amber-500 to-yellow-400",
    border: "border-amber-500/20",
    solid: "bg-amber-500",
    pill: "bg-amber-500/20 border border-amber-500/30 text-amber-400",
    shadow: "shadow-amber-500/25",
    swatch: "bg-amber-500",
    label: "Amber",
  },
  pink: {
    gradient: "from-pink-500 to-rose-400",
    border: "border-pink-500/20",
    solid: "bg-pink-500",
    pill: "bg-pink-500/20 border border-pink-500/30 text-pink-400",
    shadow: "shadow-pink-500/25",
    swatch: "bg-pink-500",
    label: "Pink",
  },
  slate: {
    gradient: "from-slate-500 to-slate-400",
    border: "border-slate-500/20",
    solid: "bg-slate-500",
    pill: "bg-slate-500/20 border border-slate-500/30 text-slate-400",
    shadow: "shadow-slate-500/25",
    swatch: "bg-slate-500",
    label: "Slate",
  },
  lime: {
    gradient: "from-lime-500 to-green-400",
    border: "border-lime-500/20",
    solid: "bg-lime-500",
    pill: "bg-lime-500/20 border border-lime-500/30 text-lime-400",
    shadow: "shadow-lime-500/25",
    swatch: "bg-lime-500",
    label: "Lime",
  },
  fuchsia: {
    gradient: "from-fuchsia-500 to-pink-400",
    border: "border-fuchsia-500/20",
    solid: "bg-fuchsia-500",
    pill: "bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400",
    shadow: "shadow-fuchsia-500/25",
    swatch: "bg-fuchsia-500",
    label: "Fuchsia",
  },
  sky: {
    gradient: "from-sky-500 to-blue-400",
    border: "border-sky-500/20",
    solid: "bg-sky-500",
    pill: "bg-sky-500/20 border border-sky-500/30 text-sky-400",
    shadow: "shadow-sky-500/25",
    swatch: "bg-sky-500",
    label: "Sky",
  },
  red: {
    gradient: "from-red-500 to-rose-400",
    border: "border-red-500/20",
    solid: "bg-red-500",
    pill: "bg-red-500/20 border border-red-500/30 text-red-400",
    shadow: "shadow-red-500/25",
    swatch: "bg-red-500",
    label: "Red",
  },
  yellow: {
    gradient: "from-yellow-500 to-amber-400",
    border: "border-yellow-500/20",
    solid: "bg-yellow-500",
    pill: "bg-yellow-500/20 border border-yellow-500/30 text-yellow-400",
    shadow: "shadow-yellow-500/25",
    swatch: "bg-yellow-500",
    label: "Yellow",
  },
};

export const FALLBACK_COLOR: SubjectColorSet = {
  gradient: "from-gray-500 to-gray-400",
  border: "border-gray-500/20",
  solid: "bg-gray-500",
  pill: "bg-gray-500/20 border border-gray-500/30 text-gray-400",
  shadow: "shadow-gray-500/25",
  swatch: "bg-gray-500",
  label: "Gray",
};

export const DEFAULT_SUBJECTS: SubjectConfig[] = [
  { name: "Mathematics", color: "blue" },
  { name: "Physics", color: "violet" },
  { name: "Chemistry", color: "emerald" },
  { name: "Biology", color: "teal" },
  { name: "History", color: "orange" },
  { name: "Swedish", color: "rose" },
  { name: "English", color: "indigo" },
  { name: "Programming", color: "cyan" },
];

export function getSubjectColor(
  subjectName: string | null | undefined,
  userSubjects: SubjectConfig[]
): SubjectColorSet {
  if (!subjectName) return FALLBACK_COLOR;
  const match = userSubjects.find(
    (s) => s.name.toLowerCase() === subjectName.toLowerCase()
  );
  return match ? (SUBJECT_COLORS[match.color] ?? FALLBACK_COLOR) : FALLBACK_COLOR;
}
