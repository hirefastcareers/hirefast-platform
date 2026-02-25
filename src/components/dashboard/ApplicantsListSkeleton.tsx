/**
 * Skeleton for RecruiterDashboard applicants list. Matches the dark slate theme
 * and card layout (score ring, name, badges, action buttons).
 */
export default function ApplicantsListSkeleton() {
  return (
    <ul className="space-y-4" role="list" aria-busy="true" aria-label="Loading applicants">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <li key={i} className="rounded-xl border border-slate-700/80 bg-slate-800/50 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-16 h-16 rounded-full bg-slate-700/60 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-slate-700/60 animate-pulse" />
                <div className="h-4 w-40 rounded bg-slate-700/50 animate-pulse" />
              </div>
            </div>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              <div className="h-6 w-14 rounded-md bg-slate-700/50 animate-pulse" />
              <div className="h-6 w-20 rounded-md bg-slate-700/50 animate-pulse" />
              <div className="h-6 w-16 rounded-md bg-slate-700/50 animate-pulse" />
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="h-9 w-24 rounded-lg bg-slate-700/60 animate-pulse" />
              <div className="h-9 w-20 rounded-lg bg-slate-700/60 animate-pulse" />
              <div className="h-9 w-28 rounded-lg bg-slate-700/60 animate-pulse" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
