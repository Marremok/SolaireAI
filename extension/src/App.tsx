import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertCircle, LogIn } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingState from './components/LoadingState';
import UpgradePrompt from './components/UpgradePrompt';
import TodayBox from './components/TodayBox';
import { useTodayBox } from './hooks/useTodayBox';
import { openInNewTab } from './lib/api';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: false,
    },
  },
});

/**
 * Main content component (handles different states)
 */
function AppContent() {
  const { data, isLoading, error } = useTodayBox();

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error handling
  if (error) {
    const statusError = error as Error & { status?: number };

    // Not authenticated (401)
    if (statusError.status === 401) {
      return (
        <div className="w-full min-h-100 flex flex-col items-center justify-center p-8 text-center">
          <LogIn className="h-12 w-12 text-primary mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Please Sign In
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Sign in to SolaireAI to access your TodayBox.
          </p>
          <button
            onClick={() => openInNewTab('https://solaireai.app/sign-in')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      );
    }

    // Not Pro (403)
    if (statusError.status === 403) {
      return <UpgradePrompt />;
    }

    // Other errors (network, 500, etc.)
    return (
      <div className="w-full min-h-100 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Connection Error
        </h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {error.message || 'Failed to connect to SolaireAI. Please try again.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Success - show TodayBox
  return <TodayBox />;
}

/**
 * Root App component with providers
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <div className="min-w-100 max-w-100 min-h-125 max-h-150 overflow-y-auto bg-background text-foreground dark">
          <AppContent />
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
