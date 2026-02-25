import { useEmployerOptional } from '../contexts/EmployerContext'

export default function EmployerSwitcher() {
  const ctx = useEmployerOptional()
  if (!ctx) return null
  const { employers, selectedEmployerId, setSelectedEmployerId, loading } = ctx
  if (loading || employers.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Company</span>
      <select
        value={selectedEmployerId ?? ''}
        onChange={(e) => setSelectedEmployerId(e.target.value || null)}
        className="flex items-center gap-2 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-medium text-[#0d2547] focus:border-[#f4601a] focus:ring-2 focus:ring-[#f4601a]/20 outline-none transition"
        aria-label="Select company"
      >
        {employers.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.company_name}
          </option>
        ))}
      </select>
    </div>
  )
}
