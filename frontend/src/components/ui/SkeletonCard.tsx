export function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-100 border border-slate-200 shimmer">
      <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-2/3" />
        <div className="h-2 bg-slate-200 rounded w-1/3" />
      </div>
      <div className="w-20 h-5 rounded-full bg-slate-200" />
    </div>
  );
}