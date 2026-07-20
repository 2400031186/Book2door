export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className}`}
    />
  );
}

export function BookCardSkeleton() {
  return (
    <div className="glass-card p-3 space-y-2">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-2.5 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
}
