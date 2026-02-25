import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function EmployerResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setHasSession(!!session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setHasSession(!!session))
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg text-center">
          <h1 className="text-3xl font-black text-[#0d2547] mb-2">
            Hire<span className="text-[#f4601a]">Fast</span>
          </h1>
          <p className="text-[#5a6e8a] mb-6">Your password has been updated. You can now sign in.</p>
          <button
            type="button"
            onClick={() => navigate('/employer/login')}
            className="bg-[#f4601a] text-white py-3 px-6 rounded-xl font-bold hover:opacity-90"
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg text-center">
          <h1 className="text-3xl font-black text-[#0d2547] mb-2">
            Hire<span className="text-[#f4601a]">Fast</span>
          </h1>
          <p className="text-[#5a6e8a] mb-6">
            Use the link from your reset email to set a new password. Links expire after a short time.
          </p>
          <button
            type="button"
            onClick={() => navigate('/employer/forgot-password')}
            className="text-[#0d2547] font-bold hover:underline"
          >
            Send another reset link
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
          <p className="text-[#5a6e8a] mt-1 text-sm">Set your new password</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-[#0d2547] mb-1">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm text-[#0d2547] placeholder:text-[#5a6e8a] focus:outline-none focus:border-[#0d2547] transition"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#0d2547] mb-1">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="Same as above"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm text-[#0d2547] placeholder:text-[#5a6e8a] focus:outline-none focus:border-[#0d2547] transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#f4601a] text-white py-4 rounded-xl font-bold text-base hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default EmployerResetPassword
