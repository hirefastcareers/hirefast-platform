import { Loader2 } from 'lucide-react'

export default function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/50 backdrop-blur-sm overflow-hidden shadow-lg">
      <div className="p-4 border-b border-slate-200/80 flex items-center gap-3">
        <div className="h-10 flex-1 max-w-xs rounded-xl bg-slate-200/60 animate-pulse" />
        <div className="h-10 flex-1 max-w-xs rounded-xl bg-slate-200/60 animate-pulse" />
      </div>
      <div className="p-4 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-sm font-medium">Loading applications…</span>
      </div>
      <div className="divide-y divide-slate-200/60">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="p-4 flex flex-wrap items-center gap-4">
            <div className="h-5 w-24 rounded bg-slate-200/60 animate-pulse" />
            <div className="h-5 w-36 rounded bg-slate-200/60 animate-pulse" />
            <div className="h-5 w-20 rounded bg-slate-200/60 animate-pulse" />
            <div className="h-5 w-28 rounded bg-slate-200/60 animate-pulse" />
            <div className="ml-auto flex gap-2">
              <div className="h-9 w-20 rounded-lg bg-slate-200/60 animate-pulse" />
              <div className="h-9 w-24 rounded-lg bg-slate-200/60 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
