/**
 * Skeleton for CandidateDiscovery: filter bar + list of candidate cards.
 */
export default function DiscoveryListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
        <div className="h-4 w-24 rounded bg-slate-200 mb-3" />
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-32 rounded-xl bg-slate-200" />
          <div className="h-10 w-28 rounded-xl bg-slate-200" />
          <div className="h-10 w-24 rounded-xl bg-slate-200" />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-5 w-36 rounded bg-slate-200" />
              <div className="h-4 w-48 rounded bg-slate-100" />
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="h-8 w-16 rounded-lg bg-slate-200" />
              <div className="h-8 w-20 rounded-lg bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
