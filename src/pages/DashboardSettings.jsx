import { Settings } from 'lucide-react'

export default function DashboardSettings() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
      <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-sm p-12 text-center">
        <Settings className="mx-auto text-slate-300" size={48} />
        <p className="text-slate-500 font-medium mt-4">Settings coming soon.</p>
      </div>
    </div>
  )
}
