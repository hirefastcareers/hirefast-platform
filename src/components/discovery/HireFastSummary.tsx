import { CheckCircle2, AlertCircle } from 'lucide-react'

type HireFastSummaryProps = {
  yearsExperience: string | null
  topSkills: string[]
  verificationStatus: { rtw: boolean; ticketsSummary: string }
}

/**
 * Clean 3-bullet summary for CV Speed-Reader: Experience, Top Skills, Verification (RTW/Tickets).
 */
export default function HireFastSummary({
  yearsExperience,
  topSkills,
  verificationStatus,
}: HireFastSummaryProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
        HireFast Summary
      </h3>
      <ul className="space-y-2 text-sm text-slate-800">
        <li className="flex gap-2">
          <span className="text-slate-400 font-medium shrink-0">1.</span>
          <span>
            <strong>Experience:</strong>{' '}
            {yearsExperience ?? 'Not stated'}
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-slate-400 font-medium shrink-0">2.</span>
          <span>
            <strong>Top skills:</strong>{' '}
            {topSkills.length > 0 ? topSkills.join(', ') : 'None listed'}
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-slate-400 font-medium shrink-0">3.</span>
          <span className="flex items-center gap-1.5">
            <strong>Verification:</strong>{' '}
            {verificationStatus.rtw ? (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                RTW
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                No RTW
              </span>
            )}
            {verificationStatus.ticketsSummary && (
              <span className="text-slate-600">• {verificationStatus.ticketsSummary}</span>
            )}
          </span>
        </li>
      </ul>
    </div>
  )
}
