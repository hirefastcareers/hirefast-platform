import { useEffect, useState } from 'react'
import { Package, ShoppingBag, UtensilsCrossed, Heart, MapPin, Copy, Check, X, Users, FileText, ThumbsUp, ThumbsDown, Activity, MessageCircle, Mail } from 'lucide-react'
import { supabase } from '../supabase'

type ApplicationRow = {
  id: string
  full_name: string
  email: string
  phone: string | null
  commute_distance: number | null
  commute_risk_level: string | null
  match_score: number | null
  status: string
  created_at: string
  shortlisted_at?: string | null
  jobs: { title: string } | null
}

function ApplicantScorecard({
  app,
  onShortlist,
  onReject,
  isUpdating,
}: {
  app: ApplicationRow
  onShortlist: () => void
  onReject: () => void
  isUpdating: boolean
}) {
  const riskConfig =
    app.commute_risk_level === 'green'
      ? { label: 'Green', dot: 'bg-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-400/40', text: 'text-emerald-300', pulse: true }
      : app.commute_risk_level === 'amber'
        ? { label: 'Amber', dot: 'bg-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-400/40', text: 'text-amber-300', pulse: false }
        : app.commute_risk_level === 'red'
          ? { label: 'Red', dot: 'bg-red-400', bg: 'bg-red-500/15', border: 'border-red-400/40', text: 'text-red-300', pulse: false }
          : null

  const isShortlisted = app.status === 'shortlisted'
  const isRejected = app.status === 'rejected'
  const score = app.match_score != null ? Math.min(100, Math.max(0, app.match_score)) : 0
  const hasScore = app.match_score != null
  const circumference = 2 * Math.PI * 36
  const strokeDash = hasScore ? (score / 100) * circumference : 0
  const isPerfect = hasScore && score >= 100

  const jobTitle = app.jobs?.title ?? 'the role'
  const messageText = `Hi ${app.full_name}, I saw your application for ${jobTitle} on HireFast...`
  const messageUrl = (() => {
    const trimmed = app.phone?.trim().replace(/\s/g, '')
    if (trimmed) {
      const digits = trimmed.replace(/\D/g, '')
      const waNumber = digits.startsWith('44') ? digits : digits.startsWith('0') ? '44' + digits.slice(1) : '44' + digits
      return `https://wa.me/${waNumber}?text=${encodeURIComponent(messageText)}`
    }
    return `mailto:${encodeURIComponent(app.email)}?subject=Your application for ${encodeURIComponent(jobTitle)}&body=${encodeURIComponent(messageText)}`
  })()

  return (
    <article
      className={`group relative rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.01] p-[1px] bg-gradient-to-br from-slate-500/30 via-indigo-500/20 to-slate-500/30 ${isRejected ? 'opacity-40 grayscale' : ''} ${isShortlisted ? 'ring-1 ring-emerald-400/50' : ''}`}
      aria-label={`Application from ${app.full_name}`}
    >
      <div className={`rounded-[11px] bg-white/5 backdrop-blur-md h-full ${isShortlisted ? 'border-l-4 border-emerald-500/60' : ''}`}>
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        {/* Column 1: Match score — circular progress ring or glowing pill */}
        <div className="flex-shrink-0 flex items-center justify-center">
          {hasScore ? (
            <div className={`relative w-20 h-20 sm:w-24 sm:h-24 ${isPerfect ? 'drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]' : ''}`}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96" aria-hidden>
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-700/80"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={isPerfect ? 'text-indigo-400' : 'text-indigo-500'}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - strokeDash}
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-bold tabular-nums text-white">
                {score}%
              </span>
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-700/50 border border-slate-600/60 flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold tabular-nums text-slate-500">—</span>
            </div>
          )}
        </div>

        {/* Column 2: Candidate info — hierarchy + icons */}
        <div className="min-w-0 flex-1 flex flex-col gap-1 sm:pl-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-white truncate">{app.full_name}</h3>
            {isShortlisted && (
              <span className="inline-flex items-center rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                Shortlisted
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm truncate">{app.email}</p>
          {app.jobs?.title && (
            <p className="text-indigo-300/90 text-sm">Applied to: {app.jobs.title}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {riskConfig && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${riskConfig.bg} ${riskConfig.border} ${riskConfig.text}`}
                title={`Commute risk: ${riskConfig.label}`}
              >
                {riskConfig.pulse ? (
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className={`absolute inline-flex h-full w-full rounded-full ${riskConfig.dot} opacity-75 animate-ping`} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${riskConfig.dot}`} />
                  </span>
                ) : (
                  <span className={`w-2 h-2 rounded-full ${riskConfig.dot}`} aria-hidden />
                )}
                <Activity size={12} className="opacity-90" aria-hidden />
              </span>
            )}
            {app.commute_distance != null && (
              <span className="inline-flex items-center gap-1.5 text-slate-500 text-sm">
                <MapPin size={14} className="flex-shrink-0" aria-hidden />
                {app.commute_distance.toFixed(1)} miles
              </span>
            )}
          </div>
        </div>

        {/* Column 3: Actions — Message (only when shortlisted, fade-in), Shortlist, Reject */}
        <div className="flex items-center gap-2 flex-shrink-0 border-t border-slate-700/50 pt-4 sm:pt-0 sm:border-t-0 opacity-80 group-hover:opacity-100 transition-opacity flex-wrap">
          {isShortlisted && (
            <span className="inline-flex message-pop-in">
              <a
                href={messageUrl}
                target={messageUrl.startsWith('http') ? '_blank' : undefined}
                rel={messageUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  messageUrl.startsWith('http')
                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white border-0 shadow-lg shadow-green-500/25 hover:from-green-300 hover:to-green-500 hover:shadow-green-500/30'
                    : 'border border-slate-500/60 bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 hover:text-white'
                }`}
                title={app.phone ? 'Open WhatsApp' : 'Send email'}
              >
                {messageUrl.startsWith('http') ? <MessageCircle size={16} aria-hidden /> : <Mail size={16} aria-hidden />}
                Message
              </a>
            </span>
          )}
          <button
            type="button"
            onClick={onShortlist}
            disabled={isUpdating}
            title={isShortlisted ? 'Click to clear shortlist' : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              isShortlisted
                ? 'bg-emerald-600/80 border border-emerald-500/40 text-white hover:bg-emerald-500/80 hover:border-emerald-400/60'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500 border-0 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-violet-400 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:pointer-events-none'
            } ${isRejected ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ThumbsUp size={16} aria-hidden />
            {isShortlisted ? 'Shortlisted (click to clear)' : 'Shortlist'}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={isUpdating}
            title={isRejected ? 'Click to clear rejection' : undefined}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all ${
              isRejected
                ? 'bg-red-900/40 border-red-700/50 text-red-300 hover:bg-red-800/50 hover:border-red-600/60'
                : 'border border-slate-500/60 bg-transparent text-slate-400 hover:bg-slate-500/10 hover:text-slate-200 hover:border-slate-400/60 disabled:opacity-50 disabled:pointer-events-none'
            } ${isShortlisted ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ThumbsDown size={16} aria-hidden />
            {isRejected ? 'Rejected (click to clear)' : 'Reject'}
          </button>
        </div>
      </div>
      {isUpdating && (
        <div className="h-0.5 w-full bg-slate-700/80 overflow-hidden">
          <div className="h-full w-1/3 bg-indigo-500 rounded-full animate-pulse" />
        </div>
      )}
      </div>
    </article>
  )
}

const SECTOR_TEMPLATES = {
  logistics: {
    id: 'logistics',
    label: 'Logistics',
    icon: Package,
    title: 'Warehouse Operative',
    description:
      'High-energy environment. Duties include picking, packing, and sorting. Must be reliable, punctual, and live within a 45-minute commute. Shift patterns available.',
    color: 'from-amber-500/90 to-orange-600/90 border-amber-400/30',
    hover: 'hover:from-amber-500 hover:to-orange-600 hover:border-amber-400/50',
  },
  retail: {
    id: 'retail',
    label: 'Retail',
    icon: ShoppingBag,
    title: 'Sales Assistant',
    description:
      'Seeking a customer-focused individual for a fast-paced retail floor. Responsible for stock replenishment and point-of-sale service. Must be eligible to work in the UK.',
    color: 'from-emerald-500/90 to-teal-600/90 border-emerald-400/30',
    hover: 'hover:from-emerald-500 hover:to-teal-600 hover:border-emerald-400/50',
  },
  hospitality: {
    id: 'hospitality',
    label: 'Hospitality',
    icon: UtensilsCrossed,
    title: 'Front of House / Server',
    description:
      "Energetic team member needed for a busy UK venue. Must have a 'can-do' attitude and excellent communication skills. Experience preferred but training provided.",
    color: 'from-rose-500/90 to-pink-600/90 border-rose-400/30',
    hover: 'hover:from-rose-500 hover:to-pink-600 hover:border-rose-400/50',
  },
  care: {
    id: 'care',
    label: 'Care',
    icon: Heart,
    title: 'Care Assistant',
    description:
      'Compassionate individual required to support residents with daily living. DBS check required. Must be local to the area or have reliable transport.',
    color: 'from-violet-500/90 to-purple-600/90 border-violet-400/30',
    hover: 'hover:from-violet-500 hover:to-purple-600 hover:border-violet-400/50',
  },
} as const

type SectorId = keyof typeof SECTOR_TEMPLATES

const initialForm = {
  title: '',
  description: '',
  pay_rate: '',
  postcode: '',
}

export default function RecruiterDashboard() {
  const [employerId, setEmployerId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)
  const [selectedSector, setSelectedSector] = useState<SectorId | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [newJobId, setNewJobId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeView, setActiveView] = useState<'rapid-post' | 'applicants'>('rapid-post')
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [applicationsError, setApplicationsError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolveSession() {
      setSessionLoading(true)
      setSessionError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return
        if (!session?.user) {
          setSessionError('Not signed in.')
          setSessionLoading(false)
          return
        }
        const uid = session.user.id

        const { data: assignments, error } = await supabase
          .from('recruiter_employers')
          .select('employer_id')
          .eq('user_id', uid)
          .limit(1)

        if (cancelled) return
        if (error) {
          setSessionError(error.message ?? 'Failed to load employer.')
          setSessionLoading(false)
          return
        }
        const first = assignments?.[0]?.employer_id ?? null
        setEmployerId(first ?? null)
        if (!first) setSessionError('No employer assigned. Create or link an employer first.')
      } catch (e) {
        if (!cancelled) setSessionError('Something went wrong.')
      } finally {
        if (!cancelled) setSessionLoading(false)
      }
    }

    resolveSession()
    return () => { cancelled = true }
  }, [])

  // Fetch applications for recruiter's jobs (RLS filters by employer)
  useEffect(() => {
    if (!employerId) return
    let cancelled = false
    setApplicationsLoading(true)
    setApplicationsError(null)
    async function fetchApplications() {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('id, full_name, email, phone, commute_distance, commute_risk_level, match_score, status, created_at, shortlisted_at, jobs!inner(title, is_active)')
          .eq('jobs.is_active', true)
          .order('match_score', { ascending: false, nullsFirst: false })
        if (cancelled) return
        if (error) throw error
        setApplications((data as ApplicationRow[]) ?? [])
      } catch (e) {
        if (!cancelled) setApplicationsError(e instanceof Error ? e.message : 'Failed to load applicants.')
      } finally {
        if (!cancelled) setApplicationsLoading(false)
      }
    }
    fetchApplications()
    return () => { cancelled = true }
  }, [employerId])

  /** Mock: simulates sending a professional rejection email to the candidate. */
  function sendRejectionEmail(email: string, candidateName: string, jobTitle: string) {
    const message = `Hi ${candidateName}, thanks for applying for ${jobTitle} via HireFast. The recruiter has reviewed your profile and won't be moving forward this time. We wish you the best in your search!`
    console.log(`Simulating professional rejection email to ${email}:`, message)
  }

  async function updateApplicationStatus(applicationId: string, status: 'shortlisted' | 'rejected' | 'pending') {
    setUpdatingId(applicationId)
    const shortlisted_at = status === 'shortlisted' ? new Date().toISOString() : null
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status, shortlisted_at })
        .eq('id', applicationId)
      if (error) throw error
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status, shortlisted_at: shortlisted_at ?? undefined } : a))
      )
    } catch {
      // Keep UI unchanged on error; could add toast
    } finally {
      setUpdatingId(null)
    }
  }

  const [rejectionToast, setRejectionToast] = useState<string | null>(null)

  async function handleReject(app: ApplicationRow) {
    await updateApplicationStatus(app.id, 'rejected')
    sendRejectionEmail(app.email, app.full_name, app.jobs?.title ?? 'the role')
    setRejectionToast(`Rejection sent. We've notified ${app.full_name} that they weren't successful this time.`)
    setTimeout(() => setRejectionToast(null), 4500)
  }

  function applyTemplate(sectorId: SectorId) {
    const t = SECTOR_TEMPLATES[sectorId]
    setSelectedSector(sectorId)
    setForm({
      title: t.title,
      description: t.description,
      pay_rate: '',
      postcode: form.postcode,
    })
    setSaveError(null)
    setNewJobId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setNewJobId(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSaveError('Please sign in to post jobs.')
        return
      }
      if (!employerId) {
        setSaveError('No employer assigned. Create or link an employer first.')
        return
      }

      const postcodeTrimmed = form.postcode.trim()
      const { data: inserted, error } = await supabase
        .from('jobs')
        .insert({
          employer_id: employerId,
          recruiter_id: user.id,
          title: form.title.trim() || 'Untitled role',
          location: postcodeTrimmed || null,
          location_name: postcodeTrimmed || 'Not specified',
          postcode: postcodeTrimmed || '',
          pay_rate: form.pay_rate.trim() || null,
          description_template: form.description.trim() || null,
          is_active: true,
        })
        .select('id')
        .single()

      if (error) throw error
      if (!inserted?.id) throw new Error('No job id returned.')

      setNewJobId(inserted.id)
      setForm({ ...initialForm, postcode: form.postcode })
      setSelectedSector(null)
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ??
        (err instanceof Error ? err.message : 'Failed to save job.')
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  const applyLink = newJobId
    ? `${window.location.origin}/jobs/${newJobId}/apply`
    : ''

  async function handleCopyLink() {
    if (!applyLink) return
    try {
      await navigator.clipboard.writeText(applyLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setSaveError('Could not copy to clipboard.')
    }
  }

  function closeSuccessModal() {
    setNewJobId(null)
    setCopied(false)
  }

  if (sessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-300 font-medium">Loading your employer...</p>
      </div>
    )
  }

  if (sessionError && !employerId) {
    return (
      <div className="rounded-2xl bg-red-950/40 border border-red-500/30 p-6 text-center max-w-md mx-auto">
        <p className="text-red-300 font-semibold">{sessionError}</p>
        <p className="text-slate-400 text-sm mt-2">Sign in or get an employer assigned to post jobs.</p>
      </div>
    )
  }

  return (
    <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6 px-4 py-6 sm:px-6 sm:py-6 bg-slate-900 min-h-[calc(100vh+2rem)] rounded-2xl">
      {rejectionToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md rounded-xl border border-slate-600/80 bg-slate-800 shadow-xl px-4 py-3 text-slate-200 text-sm toast-enter"
        >
          {rejectionToast}
        </div>
      )}
      <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveView('rapid-post')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeView === 'rapid-post'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FileText size={18} />
            Rapid Post
          </button>
          <button
            type="button"
            onClick={() => setActiveView('applicants')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeView === 'applicants'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Users size={18} />
            Applicants
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-6">
          {activeView === 'rapid-post' ? 'Rapid Post' : 'Applicants'}
        </h1>
        <p className="text-slate-400 mt-1">
          {activeView === 'rapid-post'
            ? 'Pick a sector, tweak the form, post in seconds.'
            : 'Applications for your jobs, sorted by match score.'}
        </p>
      </header>

      {activeView === 'applicants' ? (
        /* Applicants list */
        <section className="rounded-2xl border border-slate-700/80 bg-slate-800/50 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/80">
            <h2 className="text-lg font-semibold text-white">All applicants</h2>
            <p className="text-sm text-slate-400">Sorted by match score (highest first)</p>
          </div>
          <div className="p-4 sm:p-6">
            {applicationsLoading && (
              <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Loading applicants…</span>
              </div>
            )}
            {!applicationsLoading && applicationsError && (
              <p className="text-red-400 font-medium py-6">{applicationsError}</p>
            )}
            {!applicationsLoading && !applicationsError && applications.length === 0 && (
              <p className="text-slate-400 py-12 text-center">No applications yet. Share your job link to get candidates.</p>
            )}
            {!applicationsLoading && !applicationsError && applications.length > 0 && (
              <ul className="space-y-4" role="list">
                {applications.map((app) => (
                  <li key={app.id}>
                    <ApplicantScorecard
                      app={app}
                      onShortlist={() => updateApplicationStatus(app.id, app.status === 'shortlisted' ? 'pending' : 'shortlisted')}
                      onReject={() => app.status === 'rejected' ? updateApplicationStatus(app.id, 'pending') : handleReject(app)}
                      isUpdating={updatingId === app.id}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <>
      {/* Template buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {(Object.keys(SECTOR_TEMPLATES) as SectorId[]).map((sectorId) => {
          const t = SECTOR_TEMPLATES[sectorId]
          const Icon = t.icon
          const isSelected = selectedSector === sectorId
          return (
            <button
              key={sectorId}
              type="button"
              onClick={() => applyTemplate(sectorId)}
              className={`
                flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl px-4 py-6 sm:py-8
                bg-gradient-to-br ${t.color} border ${t.hover}
                text-white font-bold text-base sm:text-lg shadow-lg
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                ${isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900' : ''}
              `}
            >
              <Icon size={28} className="sm:w-8 sm:h-8" strokeWidth={2} aria-hidden />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Job form */}
      <section className="rounded-2xl border border-slate-700/80 bg-slate-800/50 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/80">
          <h2 className="text-lg font-semibold text-white">Job details</h2>
          <p className="text-sm text-slate-400">
            {selectedSector
              ? `Template: ${SECTOR_TEMPLATES[selectedSector].label} — edit and save when ready.`
              : 'Click a sector above to fill the form.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="job-title" className="block text-sm font-medium text-slate-300 mb-1">
              Job title
            </label>
            <input
              id="job-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Warehouse Operative"
              className="w-full rounded-xl border border-slate-600 bg-slate-800 text-white placeholder-slate-500 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="job-description" className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              id="job-description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description for candidates..."
              className="w-full rounded-xl border border-slate-600 bg-slate-800 text-white placeholder-slate-500 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition resize-y min-h-[100px]"
            />
          </div>

          {/* Pay rate and Job location side by side, equal columns */}
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="job-pay" className="block text-sm font-medium text-slate-300 mb-1">
                Pay rate
              </label>
              <input
                id="job-pay"
                type="text"
                value={form.pay_rate}
                onChange={(e) => setForm((f) => ({ ...f, pay_rate: e.target.value }))}
                placeholder="e.g. £11.50/hr"
                className="w-full rounded-xl border border-slate-600 bg-slate-800 text-white placeholder-slate-500 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
              />
            </div>
            {/* Truth input: prominent postcode */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Job location (postcode)</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Used to calculate candidate commute distance.
                  </p>
                  <input
                    type="text"
                    value={form.postcode}
                    onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. M1 1AA"
                    className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-800 text-white placeholder-slate-500 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {saveError && (
            <p className="text-red-400 text-sm font-medium">{saveError}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none transition"
            >
              {saving ? 'Saving...' : 'Save Job'}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(initialForm)
                setSelectedSector(null)
                setSaveError(null)
                closeSuccessModal()
              }}
              className="px-4 py-3 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-700/50 hover:text-white transition"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {/* Success modal: Job is Live! + shareable link + copy */}
      {newJobId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 id="success-modal-title" className="text-lg font-semibold text-white">
                Job is Live!
              </h2>
              <button
                type="button"
                onClick={closeSuccessModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-300 text-sm">
                Share this link for your 15-second application:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={applyLink}
                  className="flex-1 rounded-xl border border-slate-600 bg-slate-900 text-white text-sm px-3 py-2.5 font-mono truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/80">
              <button
                type="button"
                onClick={closeSuccessModal}
                className="w-full rounded-xl border border-slate-600 text-slate-300 font-medium py-2.5 hover:bg-slate-700 hover:text-white transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
      </div>
    </div>
  )
}
