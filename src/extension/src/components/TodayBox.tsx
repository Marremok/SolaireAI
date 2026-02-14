import { CalendarDays, Coffee, GraduationCap, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { formatDateFull, getToday } from '../lib/date';
import { useTodayBox } from '../hooks/useTodayBox';
import SessionCard from './SessionCard';
import UpcomingExamCard from './UpcomingExamCard';
import { openInNewTab } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Main TodayBox component
 * Displays today's study sessions and upcoming exams (top 3)
 */
export default function TodayBox() {
  const today = useMemo(() => getToday(), []);
  const formattedDate = useMemo(() => formatDateFull(today), [today]);
  const { data } = useTodayBox();
  const queryClient = useQueryClient();

  if (!data) return null;

  const { sessions, upcomingExams, isRestDay, subjects } = data;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['todaybox'] });
  };

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header with date and refresh */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 opacity-60">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              {formattedDate}
            </span>
          </div>
          <h2 className="text-2xl font-medium tracking-tight text-foreground">
            Today's <span className="text-muted-foreground">{isRestDay ? 'Rest' : 'Focus'}</span>
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Upcoming Exams */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">UPCOMING EXAMS</p>
        {upcomingExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl bg-white/5 border border-white/10">
            <GraduationCap className="h-5 w-5 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground text-center">
              No upcoming exams
            </p>
            <button
              onClick={() => openInNewTab('https://solaireai.app/dashboard/exams')}
              className="text-xs text-primary mt-2 hover:underline"
            >
              Add your first exam
            </button>
          </div>
        ) : (
          upcomingExams.map((exam) => (
            <UpcomingExamCard
              key={exam.id}
              exam={exam}
              userSubjects={subjects}
            />
          ))
        )}
      </div>

      {/* Today's Sessions */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">
          {isRestDay ? "Rest & Recharge" : "Today's Tasks"}
        </p>

        {isRestDay && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl bg-white/5 border border-white/10">
            <Coffee className="h-6 w-6 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-foreground font-medium mb-1">
              Enjoy your rest day!
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-[240px]">
              You've earned this break. Recharge today so you can tackle tomorrow with fresh energy.
            </p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-muted-foreground">No sessions today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>

      {/* Footer link */}
      <button
        onClick={() => openInNewTab('https://solaireai.app/dashboard')}
        className="w-full text-xs text-primary hover:underline text-center py-2"
      >
        View all exams →
      </button>
    </div>
  );
}
