import { Outlet } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'

/**
 * Mobile-first layout for candidate-facing views (e.g. job list, my applications).
 * Uses bottom navigation only; no sidebar.
 */
export default function CandidateLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="min-h-screen pb-20">
        <Outlet />
      </main>
      <BottomNav variant="candidate" />
    </div>
  )
}
