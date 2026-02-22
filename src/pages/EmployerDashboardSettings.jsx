import { Settings } from 'lucide-react'

export default function EmployerDashboardSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <Settings className="mx-auto text-slate-300" size={48} />
        <p className="text-slate-500 font-medium mt-4">Settings coming soon.</p>
      </div>
    </div>
  )
}
