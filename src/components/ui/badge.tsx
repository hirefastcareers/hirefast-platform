import { type ReactNode } from 'react'

/**
 * Truth Engine badges per .cursorrules:
 * 🟢 High Match (>80%) / Short Commute
 * 🟡 Medium Match (50-79%) / Potential Travel Issues
 * 🔴 Low Match (<50%) / No RTW / Impossible Commute
 */
const variantStyles = {
  green:
    'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/40',
  amber:
    'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/40',
  red: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-400/40',
} as const

const dots = {
  green: '🟢',
  amber: '🟡',
  red: '🔴',
} as const

export type TruthVariant = keyof typeof variantStyles

type BadgeProps = {
  variant: TruthVariant
  children: ReactNode
  showDot?: boolean
  className?: string
}

export function Badge({ variant, children, showDot = true, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {showDot && <span aria-hidden>{dots[variant]}</span>}
      {children}
    </span>
  )
}

/** Truth Score badge: Match level (from match_score or commute + RTW). */
export function TruthScoreBadge({
  level,
  label,
}: {
  level: TruthVariant
  label: string
}) {
  return (
    <Badge variant={level}>
      {label}
    </Badge>
  )
}

/** Commute-only badge (Short / Medium / Long). */
export function CommuteBadge({ risk }: { risk: 'green' | 'amber' | 'red' }) {
  const labels = { green: 'Short commute', amber: 'Medium commute', red: 'Long commute' }
  return <Badge variant={risk}>{labels[risk]}</Badge>
}

/** RTW status: green = RTW, red = No RTW. */
export function RTWBadge({ hasRtw }: { hasRtw: boolean }) {
  if (hasRtw) return <Badge variant="green">RTW</Badge>
  return <Badge variant="red">No RTW</Badge>
}
