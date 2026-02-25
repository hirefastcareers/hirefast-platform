import { NavLink, useNavigate } from 'react-router-dom'
import { Briefcase, Users, BarChart3, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import CompanySwitcher from './CompanySwitcher'
import { supabase } from '../../supabase'

const recruiterNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Leads', end: true },
  { to: '/dashboard/candidates', icon: Users, label: 'Candidates', end: false },
  { to: '/dashboard/recruiter', icon: Briefcase, label: 'Jobs', end: false },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', end: false },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings', end: false },
]

export default function Sidebar() {
  const navigate = useNavigate()

  async function handleLogOut() {
    await supabase.auth.signOut()
    navigate('/employer/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-xl">
      {/* Logo + Company Switcher */}
      <div className="border-b border-slate-200/80 p-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-[#0d2547] font-black text-xl tracking-tight hover:opacity-90 transition"
        >
          Hire<span className="text-[#f4601a]">Fast</span>
        </button>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Recruiter Command Centre
        </p>
        <div className="mt-4">
          <CompanySwitcher />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {recruiterNavItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to + label}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-[#0d2547] text-white shadow-lg shadow-[#0d2547]/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#0d2547]'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
        <div className="pt-4 mt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={handleLogOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#0d2547] transition"
          >
            <LogOut size={20} strokeWidth={2} />
            Log out
          </button>
        </div>
      </nav>
    </aside>
  )
}
