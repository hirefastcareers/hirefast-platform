import { useState, useEffect, useRef } from 'react'
import { X, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '../supabase'

const SKILLS = [
  'Developer',
  'Designer',
  'Recruiter',
  'Other'
]

function CandidateRegistration({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    primarySkill: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const timeoutRef = useRef(null)

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: '',
        email: '',
        primarySkill: ''
      })
      setErrors({})
      setLoading(false)
      setSuccess(false)
    } else {
      // Clean up timeout when modal closes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    // Cleanup function to clear timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isOpen])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.primarySkill) {
      newErrors.primarySkill = 'Please select your primary skill'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('candidates')
        .insert([
          {
            full_name: formData.fullName.trim(),
            email: formData.email.trim().toLowerCase(),
            primary_skill: formData.primarySkill
          }
        ])

      if (error) throw error

      setSuccess(true)
      
      // Reset form after showing success
      timeoutRef.current = setTimeout(() => {
        setFormData({
          fullName: '',
          email: '',
          primarySkill: ''
        })
        setSuccess(false)
        onClose()
        timeoutRef.current = null
      }, 3000)
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors({ submit: error.message || 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-[slideUp_0.3s_ease-out]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition z-10"
          disabled={loading}
        >
          <X size={24} />
        </button>

        {success ? (
          // Success State
          <div className="p-8 sm:p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#0d2547] mb-3">
              You're on the list!
            </h2>
            <p className="text-slate-600 text-lg">
              We'll be in touch soon with opportunities that match your skills.
            </p>
          </div>
        ) : (
          // Registration Form
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-black text-[#0d2547] mb-2">
              Join HireFast
            </h2>
            <p className="text-slate-600 mb-6">
              Get matched with top employers in minutes
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-[#0d2547] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2547] transition ${
                    errors.fullName ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="John Smith"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#0d2547] mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2547] transition ${
                    errors.email ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Primary Skill */}
              <div>
                <label className="block text-sm font-semibold text-[#0d2547] mb-2">
                  Primary Skill *
                </label>
                <select
                  name="primarySkill"
                  value={formData.primarySkill}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2547] transition bg-white ${
                    errors.primarySkill ? 'border-red-300' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select your skill</option>
                  {SKILLS.map(skill => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
                {errors.primarySkill && (
                  <p className="text-red-500 text-xs mt-1">{errors.primarySkill}</p>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0d2547] text-white py-4 rounded-full font-bold text-base hover:opacity-90 transition shadow-lg shadow-[#0d2547]/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Submitting...</span>
                  </>
                ) : (
                  'Submit Application →'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default CandidateRegistration
