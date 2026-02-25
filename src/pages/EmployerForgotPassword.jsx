import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function EmployerForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const origin = window.location.origin
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/employer/reset-password`
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg text-center">
          <h1 className="text-3xl font-black text-[#0d2547] mb-2">
            Hire<span className="text-[#f4601a]">Fast</span>
          </h1>
          <p className="text-[#5a6e8a] mb-6">
            If an account exists for <strong className="text-[#0d2547]">{email}</strong>, we&apos;ve sent a link to reset your password. Check your inbox and spam folder.
          </p>
          <button
            type="button"
            onClick={() => navigate('/employer/login')}
            className="text-[#0d2547] font-bold hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#0d2547]">
            Hire<span className="text-[#f4601a]">Fast</span>
          </h1>
          <p className="text-[#5a6e8a] mt-1 text-sm">Reset your password</p>
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
          <button
            type="submit"
            disabled={loading}
            className="bg-[#f4601a] text-white py-4 rounded-xl font-bold text-base hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-sm text-[#5a6e8a] mt-6">
          <button
            type="button"
            onClick={() => navigate('/employer/login')}
            className="text-[#0d2547] font-bold hover:underline"
          >
            Back to sign in
          </button>
        </p>
      </div>
    </div>
  )
}

export default EmployerForgotPassword
