import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Home() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleWaitlistSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const { data, error: rpcError } = await supabase.rpc('join_waitlist', {
        p_email: trimmed,
      })
      if (rpcError) throw rpcError
      setSuccess(true)
      setEmail('')
    } catch (err) {
      const msg = err?.message ?? 'Something went wrong'
      setError(msg.includes('Invalid email') ? 'Please enter a valid email address.' : 'Could not join the list. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white antialiased flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="font-bold text-lg sm:text-xl tracking-tight"
          >
            <span className="text-white">Hire</span>
            <span className="text-blue-500">Fast</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2.5 rounded-xl border border-white/20 hover:border-blue-500/50 hover:bg-white/5 transition"
          >
            Recruiter Login
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-xl mx-auto text-center">
          {/* Hero */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            The 15-Second Application Engine for UK Teams.
          </h1>
          <p className="mt-4 sm:mt-6 text-slate-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            We fix the <strong className="text-slate-300">Drop-off</strong> and <strong className="text-slate-300">Ghosting</strong> crises.
            The Truth Engine ranks candidates by commute and Right to Work—so you hire on verified data, not guesswork.
          </p>

          {/* Waitlist */}
          <div className="mt-10 sm:mt-14">
            {success ? (
              <div
                className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-8 sm:py-10"
                role="status"
                aria-live="polite"
              >
                <p className="text-emerald-400 font-semibold text-lg sm:text-xl">
                  You're on the list 🟢
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  We'll be in touch when we launch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <label htmlFor="waitlist-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="flex-1 min-h-[56px] rounded-xl border border-white/20 bg-white/5 px-5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 text-base"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[56px] px-8 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 transition"
                >
                  {loading ? 'Joining…' : 'Join Waitlist'}
                </button>
              </form>
            )}
            {error && (
              <p className="mt-3 text-red-400 text-sm" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
