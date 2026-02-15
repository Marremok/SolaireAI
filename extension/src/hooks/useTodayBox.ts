import { useQuery } from '@tanstack/react-query';
import { fetchTodayBox } from '../lib/api';

/**
 * React Query hook for fetching TodayBox data
 *
 * Features:
 * - Automatic refetch on popup open (refetchOnWindowFocus)
 * - 30 second stale time (data considered fresh for 30s)
 * - 3 retries with exponential backoff
 * - Error handling for auth failures
 */
export function useTodayBox() {
  return useQuery({
    queryKey: ['todaybox'],
    queryFn: fetchTodayBox,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when popup opens
    refetchInterval: false, // Don't auto-poll (popup is ephemeral)
    retry: (failureCount, error) => {
      // Don't retry on auth errors (401, 403)
      if (error instanceof Error && 'status' in error) {
        const statusError = error as Error & { status: number };
        if (statusError.status === 401 || statusError.status === 403) {
          return false;
        }
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
