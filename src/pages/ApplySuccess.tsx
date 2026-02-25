import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function ApplySuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { jobTitle?: string; companyName?: string } | undefined
  const jobTitle = state?.jobTitle ?? 'the role'
  const companyName = state?.companyName ?? 'The company'

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      <Navbar />
      <main className="relative max-w-lg mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-8">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" aria-hidden />
          <h1 className="text-2xl font-bold text-white mb-2">You’re all set</h1>
          <p className="text-slate-300 mb-6">
            Your application for <strong>{jobTitle}</strong> at {companyName} has been confirmed. We’ll be in touch if it’s a match.
          </p>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="w-full rounded-xl bg-amber-500 text-slate-900 font-bold py-3.5 hover:bg-amber-400 transition"
          >
            Find more roles
          </button>
        </div>
      </main>
    </div>
  )
}
