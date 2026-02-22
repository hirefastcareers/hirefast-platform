import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Users, Briefcase, Settings } from 'lucide-react'

export default function EmployerDashboardLayout() {
  const navigate = useNavigate()
  const navItems = [
    { to: '/employer/dashboard', icon: Users, label: 'Applicants' },
    { to: '/employer/dashboard/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/employer/dashboard/settings', icon: Settings, label: 'Settings' }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 z-40 h-full w-56 border-r border-slate-200 bg-white hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <button
            onClick={() => navigate('/')}
            className="text-slate-900 font-bold text-lg tracking-tight hover:opacity-80 transition"
          >
            Hire<span className="text-[#f4601a]">Fast</span>
          </button>
          <p className="text-xs text-slate-500 mt-1">Employer dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/employer/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="text-slate-900 font-bold tracking-tight"
          >
            Hire<span className="text-[#f4601a]">Fast</span>
          </button>
        </header>
        <nav className="flex gap-1 border-b border-slate-200 bg-white px-2 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/employer/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="lg:pl-56 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
