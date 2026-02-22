import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      })
      if (signInError) throw signInError
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d2547] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-[#d5e0ee]/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#0d2547]">
            Hire<span className="text-[#f4601a]">Fast</span>
          </h1>
          <p className="text-[#5a6e8a] mt-2 text-sm font-medium">
            High-volume recruitment, simplified
          </p>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
            Check your inbox! We&apos;ve sent a secure login link.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-[#0d2547] mb-1">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full border border-[#d5e0ee] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4601a]/50 focus:border-[#f4601a] transition"
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#f4601a] text-white py-4 rounded-xl font-bold text-base hover:opacity-90 transition disabled:opacity-50 mt-1"
            >
              {loading ? 'Sending…' : 'Send Magic Link'}
            </button>
          </form>
        ) : (
          <p className="text-center text-sm text-[#5a6e8a]">
            Click the link in your email to sign in. You can close this tab.
          </p>
        )}
      </div>
    </div>
  )
}
