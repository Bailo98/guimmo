export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#1e2430] rounded-2xl overflow-hidden border border-slate-100 dark:border-[#2a3040]">
      <div className="aspect-[4/3] skeleton-light dark:skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton-light dark:skeleton rounded-lg w-3/4" />
        <div className="h-3 skeleton-light dark:skeleton rounded-lg w-1/2" />
        <div className="h-5 skeleton-light dark:skeleton rounded-lg w-1/3" />
        <div className="flex gap-2 mt-3">
          <div className="flex-1 h-8 skeleton-light dark:skeleton rounded-xl" />
          <div className="flex-1 h-8 skeleton-light dark:skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}
