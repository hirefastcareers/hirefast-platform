import { useState, useEffect, useRef, useCallback } from 'react'
import { X, CheckCircle2, Loader2, Zap, Mail } from 'lucide-react'
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
  const [touched, setTouched] = useState({ fullName: false, email: false, primarySkill: false })
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
      setTouched({ fullName: false, email: false, primarySkill: false })
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

  // Validation-as-you-type: get error for a single field (empty string if valid)
  const getFieldError = useCallback((name, value) => {
    switch (name) {
      case 'fullName':
        return !value.trim() ? 'Full name is required' : ''
      case 'email':
        if (!value.trim()) return 'Email is required'
        return !validateEmail(value) ? 'Please enter a valid email address' : ''
      case 'primarySkill':
        return !value ? 'Please select your primary skill' : ''
      default:
        return ''
    }
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const nextValue = type === 'checkbox' ? checked : value
    setFormData(prev => ({ ...prev, [name]: nextValue }))
    // Live validation: show error as soon as we have a rule to apply
    if (touched[name]) {
      const error = getFieldError(name, nextValue)
      setErrors(prev => ({ ...prev, [name]: error, submit: '' }))
    } else {
      setErrors(prev => ({ ...prev, [name]: '', submit: '' }))
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    const value = formData[name]
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = getFieldError(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const validateForm = () => {
    setTouched({ fullName: true, email: true, primarySkill: true })
    const newErrors = {
      fullName: getFieldError('fullName', formData.fullName),
      email: getFieldError('email', formData.email),
      primarySkill: getFieldError('primarySkill', formData.primarySkill)
    }
    setErrors(newErrors)
    return !newErrors.fullName && !newErrors.email && !newErrors.primarySkill
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

  const timelineSteps = [
    { icon: CheckCircle2, label: "We've got your details", sub: "You're in the system." },
    { icon: Zap, label: 'We match you with roles', sub: 'Employers see your profile.' },
    { icon: Mail, label: 'Employers get in touch', sub: 'Interviews and offers.' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-md relative overflow-hidden animate-[slideUp_0.3s_ease-out] rounded-3xl border border-white/20 bg-white/75 shadow-2xl shadow-black/20 backdrop-blur-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition z-10 rounded-full p-1 bg-white/50 hover:bg-white/80 backdrop-blur-sm"
          disabled={loading}
        >
          <X size={22} />
        </button>

        {success ? (
          // High-energy Success State + What happens next
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/30">
                <CheckCircle2 className="text-white" size={40} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0d2547] mb-2 tracking-tight">
                You're on the list!
              </h2>
              <p className="text-slate-600 text-base font-medium">
                We'll be in touch with roles that match your skills.
              </p>
            </div>
            <div className="border-t border-slate-200/80 pt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">What happens next</p>
              <ul className="space-y-4">
                {timelineSteps.map(({ icon: Icon, label, sub }, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#0d2547]/10 flex items-center justify-center text-[#0d2547]">
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <div>
                      <p className="font-bold text-[#0d2547]">{label}</p>
                      <p className="text-sm text-slate-500">{sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
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
                  onBlur={handleBlur}
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
                  onBlur={handleBlur}
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
                  onBlur={handleBlur}
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
