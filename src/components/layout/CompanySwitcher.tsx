import { ChevronsUpDown, Building2 } from 'lucide-react'
import { useEmployerOptional } from '../../contexts/EmployerContext'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '../ui/dropdown-menu'

export default function CompanySwitcher() {
  const ctx = useEmployerOptional()
  if (!ctx) return null
  const { employers, selectedEmployerId, setSelectedEmployerId, loading } = ctx
  if (loading || employers.length === 0) return null

  const selected = employers.find((e) => e.id === selectedEmployerId)
  const label = selected?.company_name ?? 'Select company'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-left text-sm font-medium text-[#0d2547] transition hover:bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#f4601a]/20 focus:ring-offset-2`}
      >
        <span className="flex items-center gap-2 truncate">
          <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[12rem]" align="start">
        <DropdownMenuLabel>Switch company</DropdownMenuLabel>
        {employers.map((emp) => (
          <DropdownMenuItem
            key={emp.id}
            onSelect={() => setSelectedEmployerId(emp.id)}
            className={selectedEmployerId === emp.id ? 'bg-slate-100 font-semibold' : ''}
          >
            {emp.company_name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
