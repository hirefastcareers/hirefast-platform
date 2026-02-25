import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function EmployerSignup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    company_name: '',
    email: '',
    password: '',
    location: '',
    website: '',
    company_description: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Try to create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      })

      let session = authData?.session

      // If "user already registered", sign in with same credentials and then ensure employer exists
      if (authError) {
        const msg = (authError.message || '').toLowerCase()
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password
          })
          if (signInError) throw new Error('This email is already registered. Sign in with your password, or use Forgot password.')
          session = signInData?.session
        } else {
          throw authError
        }
      }

      if (!session) throw new Error('Please confirm your email first, then sign in to complete setup.')

      // Create employer (or get existing) via RPC
      const { data: employerId, error: rpcError } = await supabase.rpc('create_employer_on_signup', {
        p_company_name: form.company_name.trim(),
        p_admin_email: form.email.trim(),
        p_location: form.location?.trim() || null,
        p_website: form.website?.trim() || null,
        p_company_description: form.company_description?.trim() || null
      })
      if (rpcError) throw rpcError
      if (!employerId) throw new Error('Employer was not created.')

      navigate('/employer/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">
            Hire<span className="text-blue-600">fast</span>
          </h1>
          <p className="text-[#5a6e8a] mt-1 text-sm">Create your employer account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              required
              placeholder="e.g. Primark, Amazon, Co-op"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-[#5a6e8a] focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Work Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@company.com"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-[#5a6e8a] focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Password *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Minimum 6 characters"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-[#5a6e8a] focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Location *</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              placeholder="e.g. Birmingham, Manchester, London"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-[#5a6e8a] focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">Website</label>
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="e.g. www.yourcompany.co.uk"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-[#5a6e8a] focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">About your company</label>
            <textarea
              name="company_description"
              value={form.company_description}
              onChange={handleChange}
              rows={3}
              placeholder="Tell candidates what it's like to work for you..."
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-[#5a6e8a] focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-base hover:opacity-90 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account...' : 'Create Employer Account →'}
          </button>
        </form>

        <p className="text-center text-sm text-[#5a6e8a] mt-6">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/employer/login')}
            className="text-slate-900 font-bold cursor-pointer hover:underline"
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  )
}

export default EmployerSignup
