import { ExamData } from '../lib/types';
import { SubjectConfig } from '../lib/colors';
import { getSubjectColor } from '../lib/colors';

interface UpcomingExamCardProps {
  exam: ExamData;
  userSubjects: SubjectConfig[];
}

/**
 * Upcoming exam card
 * Shows exam title, color dot, and relative date
 */
export default function UpcomingExamCard({
  exam,
  userSubjects,
}: UpcomingExamCardProps) {
  const color = getSubjectColor(exam.subject, userSubjects);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-2.5 w-2.5 rounded-full ${color.solid} ring-4 ring-white/5`} />
        <div>
          <p className="text-sm font-semibold text-foreground truncate max-w-[180px]">
            {exam.title}
          </p>
          <p className="text-xs text-muted-foreground">{exam.relativeDate}</p>
        </div>
      </div>
    </div>
  );
}
