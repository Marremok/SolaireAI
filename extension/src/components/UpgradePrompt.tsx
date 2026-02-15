import { Sparkles, ArrowRight } from 'lucide-react';
import { openInNewTab } from '../lib/api';

/**
 * Upgrade prompt for non-Pro users
 * Shows benefits and CTA to upgrade
 */
export default function UpgradePrompt() {
  return (
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
      <div className="p-4 rounded-full bg-primary/10 mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Unlock TodayBox with Pro
      </h2>

      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Get instant access to your daily study plan, upcoming exams, and more.
      </p>

      <div className="space-y-2 mb-6 text-left">
        <div className="flex items-start gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
          <p className="text-sm text-foreground">Quick access to today's sessions</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
          <p className="text-sm text-foreground">AI-powered study schedules</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
          <p className="text-sm text-foreground">Personalized exam tracking</p>
        </div>
      </div>

      <button
        onClick={() => openInNewTab('https://solaireai.app/upgrade')}
        className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        Upgrade to Pro
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
