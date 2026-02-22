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
      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      })
      if (authError) throw authError

      // Save employer profile
      const { error: dbError } = await supabase
        .from('employers')
        .insert([{
          id: authData.user.id,
          email: form.email,
          company_name: form.company_name,
          location: form.location,
          website: form.website,
          company_description: form.company_description
        }])
      if (dbError) throw dbError

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
          <h1 className="text-3xl font-black text-[#0d2547]">
            Hire<span className="text-[#f4601a]">fast</span>
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
            <label className="block text-sm font-bold text-[#0d2547] mb-1">Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              required
              placeholder="e.g. Primark, Amazon, Co-op"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d2547] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0d2547] mb-1">Work Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@company.com"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d2547] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0d2547] mb-1">Password *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Minimum 6 characters"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d2547] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0d2547] mb-1">Location *</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              placeholder="e.g. Birmingham, Manchester, London"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d2547] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0d2547] mb-1">Website</label>
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="e.g. www.yourcompany.co.uk"
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d2547] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0d2547] mb-1">About your company</label>
            <textarea
              name="company_description"
              value={form.company_description}
              onChange={handleChange}
              rows={3}
              placeholder="Tell candidates what it's like to work for you..."
              className="w-full border border-[#d5e0ee] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d2547] transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#f4601a] text-white py-4 rounded-xl font-bold text-base hover:opacity-90 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account...' : 'Create Employer Account →'}
          </button>
        </form>

        <p className="text-center text-sm text-[#5a6e8a] mt-6">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/employer/login')}
            className="text-[#0d2547] font-bold cursor-pointer hover:underline"
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  )
}

export default EmployerSignup