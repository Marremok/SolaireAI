/**
 * Loading skeleton component
 * Shows while data is being fetched
 */
export default function LoadingState() {
  return (
    <div className="w-full p-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
        <div className="h-8 w-40 bg-white/10 rounded animate-pulse" />
      </div>

      {/* Upcoming exams skeleton */}
      <div className="space-y-3">
        <div className="h-3 w-28 bg-white/10 rounded animate-pulse" />
        <div className="h-16 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-16 bg-white/10 rounded-xl animate-pulse" />
      </div>

      {/* Sessions skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-36 bg-white/10 rounded animate-pulse" />
        <div className="h-14 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-14 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-14 bg-white/10 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
