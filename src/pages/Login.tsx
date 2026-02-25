import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = (err instanceof Error ? err.message : '').toLowerCase()
      if (
        msg.includes('invalid login') ||
        msg.includes('invalid credentials') ||
        msg.includes('invalid')
      ) {
        setError(
          'Email or password is incorrect. Check for typos, or use Forgot password below.'
        )
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
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
            Recruiter Command Centre — sign in
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-bold text-[#0d2547] mb-1"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              className="w-full border border-[#d5e0ee] rounded-xl px-4 py-3 text-sm text-[#0d2547] placeholder:text-[#5a6e8a] focus:outline-none focus:ring-2 focus:ring-[#f4601a]/50 focus:border-[#f4601a] transition"
              autoComplete="email"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="login-password"
                className="block text-sm font-bold text-[#0d2547]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate('/employer/forgot-password')}
                className="text-sm text-[#0d2547] font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your password"
              className="w-full border border-[#d5e0ee] rounded-xl px-4 py-3 text-sm text-[#0d2547] placeholder:text-[#5a6e8a] focus:outline-none focus:ring-2 focus:ring-[#f4601a]/50 focus:border-[#f4601a] transition"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#f4601a] text-white py-4 rounded-xl font-bold text-base hover:opacity-90 transition disabled:opacity-50 mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
