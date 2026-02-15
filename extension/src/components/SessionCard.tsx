import { BookOpen } from 'lucide-react';
import { SessionData } from '../lib/types';

interface SessionCardProps {
  session: SessionData;
}

/**
 * Individual study session card
 * Displays topic/method, exam title, and duration
 */
export default function SessionCard({ session }: SessionCardProps) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/25">
        <BookOpen className="h-4 w-4 text-indigo-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {session.topic || session.method}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {session.examTitle}
        </p>
      </div>

      <span className="text-xs font-medium text-indigo-400/80 bg-indigo-500/10 px-2.5 py-1 rounded-md">
        {session.duration} min
      </span>
    </div>
  );
}
