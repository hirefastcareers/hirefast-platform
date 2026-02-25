import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap,
  MapPin,
  MessageCircle,
  ArrowLeft,
  Send,
  X,
  CheckCircle2,
  Building2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { Sheet } from '../components/ui/sheet'
import { supabase } from '../supabase'

function DemoFormDrawer({ open, onOpenChange }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', message: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('sales_enquiries').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        message: form.message.trim() || null,
      })
      if (error) throw error
      setSent(true)
      setForm({ name: '', company: '', email: '', message: '' })
    } catch (err) {
      console.error(err)
      setForm((prev) => ({ ...prev, _error: 'Something went wrong. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value, _error: undefined }))
  }

  const handleClose = () => {
    onOpenChange(false)
    if (sent) setTimeout(() => setSent(false), 300)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <div className="rounded-t-2xl bg-white border-t border-slate-200 shadow-2xl min-h-[40vh]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h3 className="text-lg font-bold text-slate-900">Request a Demo</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 pb-safe">
          {sent ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <p className="text-slate-900 font-semibold text-lg mb-1">Thank you</p>
              <p className="text-slate-600 text-sm">
                We&apos;ll be in touch shortly to show you how HireFast can reduce drop-off and ghosting.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 rounded-xl bg-slate-900 text-white font-semibold px-6 py-3 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="demo-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Name
                </label>
                <input
                  id="demo-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="demo-company" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Company
                </label>
                <input
                  id="demo-company"
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                  placeholder="Company name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="demo-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Work email
                </label>
                <input
                  id="demo-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="demo-message" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Message (optional)
                </label>
                <textarea
                  id="demo-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us about your hiring volume..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                />
              </div>
              {form._error && (
                <p className="text-sm text-red-600 font-medium">{form._error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold py-4 text-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Sending…' : (
                  <>
                    <Send className="w-5 h-5" /> Send request
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </Sheet>
  )
}

export default function EmployerSales() {
  const navigate = useNavigate()
  const [demoOpen, setDemoOpen] = useState(false)

  const solutions = [
    {
      icon: Zap,
      title: '15-second Express Apply',
      description: 'Candidates apply with name, email, phone and postcode. Magic link—no passwords. Built for mobile; thumb-friendly so you don’t lose applicants in the funnel.',
      accent: 'orange',
    },
    {
      icon: MapPin,
      title: 'Truth Engine',
      description: 'Postcode-based commute distance and Right to Work drive match scores. See 🟢 High, 🟡 Medium and 🔴 Low at a glance. Prioritise verified data over guesswork.',
      accent: 'navy',
    },
    {
      icon: MessageCircle,
      title: 'Anti-Ghosting',
      description: 'Interest Check magic links let candidates confirm they’re still interested. One tap, no login. Fewer no-shows and a clear audit trail for recruiters.',
      accent: 'navy',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Navbar />

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-20">
        {/* Hero */}
        <section className="text-center mb-14 sm:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            Stop the drop-off. End the ghosting.
          </h1>
          <p className="mt-4 sm:mt-5 text-slate-600 text-base sm:text-lg max-w-xl mx-auto">
            High-volume UK recruitment: 15-second applications, postcode-based matching and Interest Checks so candidates stay accountable. Built for Logistics, Engineering, Manufacturing and Retail.
          </p>
        </section>

        {/* Problem — two crises */}
        <section className="mb-14 sm:mb-20 space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">The Drop-off Crisis</h2>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
              <span className="font-semibold text-red-700">Around 60% of UK candidates</span> abandon applications that take longer than a few minutes. Every extra field costs you hires. HireFast gets applicants from interested to applied in seconds—not minutes.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">The Ghosting Crisis</h2>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
              Candidates go quiet; recruiters chase. We use <strong>Interest Check</strong> magic links so people confirm they’re still interested with one tap. No passwords. You see who’s hot and who’s gone cold.
            </p>
          </div>
        </section>

        {/* Sectors */}
        <section className="mb-14 sm:mb-20">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center">
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">
              Sector-specific
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">
              Logistics · Engineering · Manufacturing · Retail
            </p>
          </div>
        </section>

        {/* Solution cards */}
        <section className="mb-14 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-8 sm:mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {solutions.map(({ icon: Icon, title, description, accent }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col h-full shadow-sm"
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 ${
                    accent === 'orange'
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600'
                      : 'bg-slate-900/10 border border-slate-900/20 text-slate-900'
                  }`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed flex-1">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-sm">
          <p className="text-slate-600 text-base sm:text-lg mb-2">
            See how it works for your team.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Plans from £50/month. No long-term lock-in.
          </p>
          <button
            type="button"
            onClick={() => setDemoOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold text-lg px-8 py-4 sm:py-5 hover:bg-blue-700 transition shadow-lg shadow-blue-500/25 w-full sm:w-auto min-h-[3.25rem]"
          >
            <Building2 className="w-5 h-5" /> Request a Demo
          </button>
        </section>

        {/* Back link */}
        <div className="mt-14 pt-8 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>
        </div>
      </main>

      <DemoFormDrawer open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  )
}
