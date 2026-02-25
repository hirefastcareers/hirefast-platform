import { NavLink } from 'react-router-dom'
import { Briefcase, Users, BarChart3, UserCircle } from 'lucide-react'

export const candidateNavItems = [
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
  { to: '/jobs', icon: Users, label: 'Candidates' },
  { to: '/jobs', icon: BarChart3, label: 'Analytics' },
]

export const recruiterNavItems = [
  { to: '/dashboard/candidates', icon: Users, label: 'Candidates', end: false },
  { to: '/dashboard/recruiter', icon: Briefcase, label: 'Jobs', end: false },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', end: false },
]

type NavItem = {
  to: string
  icon: typeof Briefcase
  label: string
  end?: boolean
}

/**
 * Mobile-first bottom navigation. Thumb-friendly: large tap targets, clear labels.
 * Use variant="candidate" for job-seeker views, variant="recruiter" for dashboard mobile.
 */
export default function BottomNav({
  variant = 'candidate',
}: {
  variant?: 'candidate' | 'recruiter'
}) {
  const items: NavItem[] =
    variant === 'recruiter'
      ? recruiterNavItems
      : candidateNavItems.map(({ to, icon, label }) => ({ to, icon, label }))

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200/80 bg-white/95 backdrop-blur-xl safe-area-pb"
      role="navigation"
      aria-label="Primary"
    >
      {items.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={label}
          to={to}
          end={end ?? to === '/dashboard'}
          className={({ isActive }) =>
            `flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold transition active:scale-95 ${
              isActive
                ? 'text-[#0d2547]'
                : 'text-slate-500 hover:text-slate-700'
            }`
          }
        >
          <Icon size={22} strokeWidth={2} aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
