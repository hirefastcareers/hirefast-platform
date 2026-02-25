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
    <div className="min-h-screen bg-[#000000]">
      {/* Sidebar — Apple Glass */}
      <aside className="fixed left-0 top-0 z-40 h-full w-64 border-t border-white/10 bg-[#1c1c1e]/60 backdrop-blur-xl lg:flex flex-col hidden">
        <div className="p-6 border-b border-white/10">
          <button
            onClick={() => navigate('/')}
            className="text-white font-bold text-xl tracking-tighter hover:opacity-90 transition-all duration-500"
          >
            Hire<span className="text-[#30d158]">Fast</span>
          </button>
          <p className="text-xs text-[#a1a1a6] mt-1 font-medium">Recruiter Command Centre</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-500 ${
                  isActive
                    ? 'bg-[#0a84ff] text-white'
                    : 'text-[#a1a1a6] hover:bg-white/10 hover:text-white'
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
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/10 bg-[#1c1c1e]/60 backdrop-blur-xl px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="text-white font-bold text-lg tracking-tighter"
          >
            Hire<span className="text-[#30d158]">Fast</span>
          </button>
          <span className="text-xs text-[#a1a1a6] font-medium">Command Centre</span>
        </header>
        <nav className="flex gap-1 border-b border-white/10 bg-[#1c1c1e]/40 backdrop-blur-xl px-2 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-500 ${
                  isActive ? 'bg-[#0a84ff] text-white' : 'text-[#a1a1a6] hover:bg-white/10 hover:text-white'
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
        <div className="p-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
