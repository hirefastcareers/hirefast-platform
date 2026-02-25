import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { EmployerProvider } from '../contexts/EmployerContext'
import Sidebar from '../components/layout/Sidebar'
import BottomNav from '../components/layout/BottomNav'
import CompanySwitcher from '../components/layout/CompanySwitcher'
import { supabase } from '../supabase'

/**
 * Responsive Recruiter Dashboard Layout (mobile-first).
 * - lg and up: Sidebar (with Company Switcher) on the left.
 * - Below lg: Header with company switcher + BottomNav (same nav items: Jobs, Candidates, Analytics).
 */
function DashboardLayout() {
  const navigate = useNavigate()

  async function handleLogOut() {
    await supabase.auth.signOut()
    navigate('/employer/login', { replace: true })
  }

  return (
    <EmployerProvider>
      <div className="min-h-screen bg-slate-100/80">
        {/* Desktop: Sidebar (recruiter) */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile: Header + Bottom nav (recruiter, same context) */}
        <div className="lg:hidden">
          <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-[#0d2547] font-black text-lg tracking-tight"
              >
                Hire<span className="text-[#f4601a]">Fast</span>
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Command Centre
              </span>
              <button
                type="button"
                onClick={handleLogOut}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
            <CompanySwitcher />
          </header>
          <BottomNav variant="recruiter" />
        </div>

        {/* Main content: offset by sidebar on desktop, by bottom nav on mobile */}
        <main className="min-h-screen pb-20 lg:pl-64 lg:pb-0">
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </EmployerProvider>
  )
}

export default DashboardLayout
