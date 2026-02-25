import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function EmployerLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      navigate('/employer/dashboard')
    } catch (err) {
      const msg = (err.message || '').toLowerCase()
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setError('Email or password is incorrect. Check for typos, or use Forgot password below.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#0d2547]">
            Hire<span className="text-[#f4601a]">Fast</span>
          </h1>
          <p className="text-[#5a6e8a] mt-1 text-sm">Sign in to your employer account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-[#0d2547] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm text-[#0d2547] placeholder:text-[#5a6e8a] focus:outline-none focus:border-[#0d2547] transition"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-[#0d2547]">Password</label>
              <button
                type="button"
                onClick={() => navigate('/employer/forgot-password')}
                className="text-sm text-[#0d2547] font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your password"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm text-[#0d2547] placeholder:text-[#5a6e8a] focus:outline-none focus:border-[#0d2547] transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#f4601a] text-white py-4 rounded-xl font-bold text-base hover:opacity-90 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-[#5a6e8a] mt-6">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/employer/signup')}
            className="text-[#0d2547] font-bold hover:underline"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  )
}

export default EmployerLogin
