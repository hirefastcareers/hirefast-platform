import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, MapPin, LayoutDashboard, X, Send, ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar'

function DemoFormModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', message: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // TODO: send to Supabase or your backend
      await new Promise((r) => setTimeout(r, 600))
      setSent(true)
      setForm({ name: '', company: '', email: '', message: '' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Request a Demo</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="text-center py-6">
              <p className="text-emerald-400 font-semibold mb-2">Thank you.</p>
              <p className="text-slate-400 text-sm">We&apos;ll be in touch shortly.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 text-amber-400 hover:text-amber-300 text-sm font-medium"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Company</label>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                  placeholder="Company name"
                  className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Work email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Message (optional)</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us about your hiring volume..."
                  className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-slate-900 font-bold py-3.5 hover:bg-amber-400 transition disabled:opacity-50"
              >
                {loading ? 'Sending…' : (
                  <>
                    <Send className="w-4 h-4" /> Send request
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EmployerSales() {
  const navigate = useNavigate()
  const [demoOpen, setDemoOpen] = useState(false)

  const solutions = [
    {
      icon: Zap,
      title: 'Frictionless Apply',
      description: 'Candidates enter via magic link. No passwords, no lengthy forms—just one tap to start.',
      accent: 'blue',
    },
    {
      icon: MapPin,
      title: 'Local First',
      description: 'Postcode-aware sorting built for UK logistics and retail. See the right candidates first.',
      accent: 'blue',
    },
    {
      icon: LayoutDashboard,
      title: 'Recruiter Command Center',
      description: 'The dashboard we built to manage leads in one click. Pre-qualified, ranked, ready.',
      accent: 'gold',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      {/* Background orbs — electric blue & gold */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[80px]" />
      </div>

      <Navbar />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
        {/* Hero */}
        <section className="text-center mb-16 sm:mb-24">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            High-Volume Hiring at <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">5G Speed.</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Stop losing great candidates to slow applications. Built for UK employers who need to fill roles fast.
          </p>
        </section>

        {/* The Problem */}
        <section className="mb-16 sm:mb-24">
          <div className="rounded-2xl sm:rounded-3xl border border-red-500/20 bg-red-950/20 p-6 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">The Drop-off Crisis</h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              <span className="text-red-400 font-semibold">60% of UK candidates</span> abandon applications if they take longer than 3 minutes. Every extra field and click costs you hires. We built HireFast so applicants get from &ldquo;interested&rdquo; to &ldquo;applied&rdquo; in seconds—not minutes.
            </p>
          </div>
        </section>

        {/* The Solution — 3 cards */}
        <section className="mb-16 sm:mb-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10 sm:mb-12">The solution</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {solutions.map(({ icon: Icon, title, description, accent }) => (
              <article
                key={title}
                className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-800/50 backdrop-blur-sm p-6 sm:p-8 flex flex-col h-full"
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 ${
                    accent === 'gold'
                      ? 'bg-amber-500/20 border border-amber-400/30 text-amber-400'
                      : 'bg-blue-500/20 border border-blue-400/30 text-blue-400'
                  }`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed flex-1">{description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="text-slate-400 text-base sm:text-lg mb-6">See how it works for your team.</p>
          <button
            onClick={() => setDemoOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 text-slate-900 font-bold text-lg px-8 py-4 hover:bg-amber-400 transition shadow-lg shadow-amber-500/25"
          >
            Request a Demo
          </button>
        </section>

        {/* Back link */}
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>
        </div>
      </main>

      <DemoFormModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}
