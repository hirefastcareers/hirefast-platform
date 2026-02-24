import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Users, Zap, BarChart3, Settings } from 'lucide-react'

function DashboardLayout() {
  const navigate = useNavigate()

  const navItems = [
    { to: '/dashboard', icon: Users, label: 'Leads' },
    { to: '/dashboard/recruiter', icon: Zap, label: 'Rapid Post' },
    { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/dashboard/settings', icon: Settings, label: 'Settings' }
  ]

  return (
    <div className="min-h-screen bg-slate-100/80">
      {/* Glassmorphism Sidebar - fixed on desktop, collapsible on mobile */}
      <aside className="fixed left-0 top-0 z-40 h-full w-64 border-r border-white/20 bg-white/60 backdrop-blur-xl lg:flex flex-col hidden">
        <div className="p-6 border-b border-white/20">
          <button
            onClick={() => navigate('/')}
            className="text-[#0d2547] font-black text-xl tracking-tight hover:opacity-90 transition"
          >
            Hire<span className="text-[#f4601a]">Fast</span>
          </button>
          <p className="text-xs text-slate-500 mt-1 font-medium">Recruiter Command Centre</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#0d2547] text-white shadow-lg shadow-[#0d2547]/20'
                    : 'text-slate-600 hover:bg-white/60 hover:text-[#0d2547]'
                }`
              }
            >
              <Icon size={20} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile: top bar + nav tabs */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/20 bg-white/70 backdrop-blur-xl px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="text-[#0d2547] font-black text-lg tracking-tight"
          >
            Hire<span className="text-[#f4601a]">Fast</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">Command Centre</span>
        </header>
        <nav className="flex gap-1 border-b border-slate-200/80 bg-white/50 backdrop-blur-sm px-2 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  isActive ? 'bg-[#0d2547] text-white' : 'text-slate-600 hover:bg-white/80'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="lg:pl-64 min-h-screen">
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
