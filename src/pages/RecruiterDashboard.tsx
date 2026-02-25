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
      ? { label: 'Green', color: '#30d158', pulse: true }
      : app.commute_risk_level === 'amber'
        ? { label: 'Amber', color: '#ff9f0a', pulse: false }
        : app.commute_risk_level === 'red'
          ? { label: 'Red', color: '#ff453a', pulse: false }
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
      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.01] apple-glass ${isRejected ? 'opacity-40 grayscale' : ''} ${isShortlisted ? 'ring-1 ring-[#30d158]/40' : ''}`}
      aria-label={`Application from ${app.full_name}`}
    >
      <div className={`h-full ${isShortlisted ? 'border-l-[3px] border-[#30d158]' : ''}`}>
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
        {/* Column 1: Candidate — very prominent name, then subtext and premium badges */}
        <div className="min-w-0 flex-1 flex flex-col gap-1.5 order-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tighter truncate">{app.full_name}</h3>
            {isShortlisted && (
              <span className="inline-flex items-center rounded-full border border-[#30d158]/40 bg-[#30d158]/15 px-2.5 py-0.5 text-xs font-medium text-[#30d158]">
                Shortlisted
              </span>
            )}
          </div>
          <p className="text-[#a1a1a6] text-sm truncate">{app.email}</p>
          {app.jobs?.title && (
            <p className="text-[#a1a1a6] text-sm">Applied to: {app.jobs.title}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {riskConfig && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-[#a1a1a6]"
                title={`Commute risk: ${riskConfig.label}`}
              >
                {riskConfig.pulse ? (
                  <span className="relative flex h-2.5 w-2.5" aria-hidden>
                    <span
                      className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60"
                      style={{ background: riskConfig.color, boxShadow: `0 0 12px 2px ${riskConfig.color}60` }}
                    />
                    <span
                      className="relative inline-flex h-full w-full rounded-full"
                      style={{ background: riskConfig.color, boxShadow: `0 0 10px 2px ${riskConfig.color}80` }}
                    />
                  </span>
                ) : (
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: riskConfig.color }}
                    aria-hidden
                  />
                )}
                <Activity size={12} className="opacity-80" aria-hidden />
                <span style={{ color: riskConfig.color }}>{riskConfig.label}</span>
              </span>
            )}
            {app.commute_distance != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-[#a1a1a6]">
                <MapPin size={12} className="flex-shrink-0" aria-hidden />
                {app.commute_distance.toFixed(1)} miles
              </span>
            )}
          </div>
        </div>

        {/* Column 2: Actions — Message (shortlisted only), Shortlist (white), Reject (outline) */}
        <div className="flex items-center gap-2 flex-shrink-0 order-2 opacity-90 group-hover:opacity-100 transition-opacity duration-500 flex-wrap">
          {isShortlisted && (
            <span className="inline-flex message-pop-in">
              <a
                href={messageUrl}
                target={messageUrl.startsWith('http') ? '_blank' : undefined}
                rel={messageUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-500 text-white hover:opacity-90"
                style={{ background: messageUrl.startsWith('http') ? '#30d158' : 'rgba(255,255,255,0.12)' }}
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
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-500 ${
              isShortlisted
                ? 'bg-white/15 text-white border border-white/20 hover:bg-white/25'
                : 'bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:pointer-events-none'
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
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-500 ${
              isRejected
                ? 'border-white/20 bg-white/5 text-[#a1a1a6]'
                : 'border-white/20 bg-transparent text-[#a1a1a6] hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:pointer-events-none'
            } ${isShortlisted ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ThumbsDown size={16} aria-hidden />
            {isRejected ? 'Rejected (click to clear)' : 'Reject'}
          </button>
        </div>

        {/* Column 3: Match score — far right, ultra-minimal thin glowing ring */}
        <div className="flex-shrink-0 flex items-center justify-center order-3 sm:ml-auto">
          {hasScore ? (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20" style={{ filter: isPerfect ? 'drop-shadow(0 0 8px rgba(10, 132, 255, 0.5))' : undefined }}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64" aria-hidden>
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={isPerfect ? '#30d158' : '#0a84ff'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - score / 100)}
                  style={{ transition: 'stroke-dashoffset 0.5s ease', filter: `drop-shadow(0 0 4px ${isPerfect ? '#30d158' : '#0a84ff'}40)` }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm sm:text-base font-bold tabular-nums text-white tracking-tighter">
                {score}%
              </span>
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <span className="text-sm font-bold tabular-nums text-[#a1a1a6]">—</span>
            </div>
          )}
        </div>
      </div>
      {isUpdating && (
        <div className="h-0.5 w-full bg-white/5 overflow-hidden">
          <div className="h-full w-1/3 bg-[#0a84ff] rounded-full animate-pulse" style={{ width: '30%' }} />
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 bg-[#000000]">
        <div className="w-10 h-10 border-2 border-[#0a84ff] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#a1a1a6] font-medium">Loading your employer...</p>
      </div>
    )
  }

  if (sessionError && !employerId) {
    return (
      <div className="rounded-2xl apple-glass border-t border-white/10 p-8 text-center max-w-md mx-auto">
        <p className="text-white font-semibold">{sessionError}</p>
        <p className="text-[#a1a1a6] text-sm mt-2">Sign in or get an employer assigned to post jobs.</p>
      </div>
    )
  }

  return (
    <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6 px-4 py-8 sm:px-6 sm:py-10 bg-[#000000] min-h-[calc(100vh+2rem)]">
      {rejectionToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-md rounded-2xl apple-glass px-5 py-4 text-[#a1a1a6] text-sm toast-enter"
        >
          {rejectionToast}
        </div>
      )}
      <div className="max-w-4xl mx-auto">
      <header className="mb-12 sm:mb-16">
        <div className="flex gap-1 p-1 rounded-full bg-white/5 w-fit border border-white/5">
          <button
            type="button"
            onClick={() => setActiveView('rapid-post')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-500 ${
              activeView === 'rapid-post'
                ? 'bg-[#0a84ff] text-white'
                : 'text-[#a1a1a6] hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText size={18} />
            Rapid Post
          </button>
          <button
            type="button"
            onClick={() => setActiveView('applicants')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-500 ${
              activeView === 'applicants'
                ? 'bg-[#0a84ff] text-white'
                : 'text-[#a1a1a6] hover:text-white hover:bg-white/10'
            }`}
          >
            <Users size={18} />
            Applicants
          </button>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter mt-10">
          {activeView === 'rapid-post' ? 'Rapid Post' : 'Applicants'}
        </h1>
        <p className="text-[#a1a1a6] mt-3 text-lg">
          {activeView === 'rapid-post'
            ? 'Pick a sector, tweak the form, post in seconds.'
            : 'Applications for your jobs, sorted by match score.'}
        </p>
      </header>

      {activeView === 'applicants' ? (
        /* Applicants list */
        <section className="rounded-2xl apple-glass overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white tracking-tighter">All applicants</h2>
            <p className="text-[#a1a1a6] text-sm mt-1">Sorted by match score (highest first)</p>
          </div>
          <div className="p-4 sm:p-8">
            {applicationsLoading && (
              <div className="flex items-center justify-center py-16 gap-4 text-[#a1a1a6]">
                <div className="w-8 h-8 border-2 border-[#0a84ff] border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Loading applicants…</span>
              </div>
            )}
            {!applicationsLoading && applicationsError && (
              <p className="text-[#ff453a] font-medium py-8">{applicationsError}</p>
            )}
            {!applicationsLoading && !applicationsError && applications.length === 0 && (
              <p className="text-[#a1a1a6] py-16 text-center">No applications yet. Share your job link to get candidates.</p>
            )}
            {!applicationsLoading && !applicationsError && applications.length > 0 && (
              <ul className="space-y-6" role="list">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
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
                flex flex-col items-center justify-center gap-3 rounded-2xl px-4 py-8 apple-glass
                text-white font-bold text-base sm:text-lg
                transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]
                ${isSelected ? 'ring-2 ring-[#0a84ff] ring-offset-2 ring-offset-[#000]' : ''}
              `}
            >
              <Icon size={28} className="sm:w-8 sm:h-8" strokeWidth={2} aria-hidden />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Job form */}
      <section className="rounded-2xl apple-glass overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white tracking-tighter">Job details</h2>
          <p className="text-[#a1a1a6] text-sm mt-1">
            {selectedSector
              ? `Template: ${SECTOR_TEMPLATES[selectedSector].label} — edit and save when ready.`
              : 'Click a sector above to fill the form.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div>
            <label htmlFor="job-title" className="block text-sm font-medium text-[#a1a1a6] mb-2">
              Job title
            </label>
            <input
              id="job-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Warehouse Operative"
              className="w-full rounded-2xl border border-white/10 bg-white/5 text-white placeholder-[#a1a1a6] px-4 py-3.5 focus:border-[#0a84ff] focus:ring-2 focus:ring-[#0a84ff]/30 outline-none transition-all duration-500"
            />
          </div>

          <div>
            <label htmlFor="job-description" className="block text-sm font-medium text-[#a1a1a6] mb-2">
              Description
            </label>
            <textarea
              id="job-description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description for candidates..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 text-white placeholder-[#a1a1a6] px-4 py-3.5 focus:border-[#0a84ff] focus:ring-2 focus:ring-[#0a84ff]/30 outline-none transition-all duration-500 resize-y min-h-[100px]"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="job-pay" className="block text-sm font-medium text-[#a1a1a6] mb-2">
                Pay rate
              </label>
              <input
                id="job-pay"
                type="text"
                value={form.pay_rate}
                onChange={(e) => setForm((f) => ({ ...f, pay_rate: e.target.value }))}
                placeholder="e.g. £11.50/hr"
                className="w-full rounded-2xl border border-white/10 bg-white/5 text-white placeholder-[#a1a1a6] px-4 py-3.5 focus:border-[#0a84ff] focus:ring-2 focus:ring-[#0a84ff]/30 outline-none transition-all duration-500"
              />
            </div>
            <div className="rounded-2xl apple-glass border-t border-white/10 p-4">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-[#0a84ff] flex-shrink-0 mt-0.5" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Job location (postcode)</p>
                  <p className="text-[#a1a1a6] text-sm mt-0.5">
                    Used to calculate candidate commute distance.
                  </p>
                  <input
                    type="text"
                    value={form.postcode}
                    onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. M1 1AA"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-[#a1a1a6] px-3 py-2.5 text-sm focus:border-[#0a84ff] focus:ring-2 focus:ring-[#0a84ff]/30 outline-none transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {saveError && (
            <p className="text-[#ff453a] text-sm font-medium">{saveError}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="px-6 py-3 rounded-full bg-[#0a84ff] text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none transition-all duration-500"
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
              className="px-5 py-3 rounded-full border border-white/20 text-[#a1a1a6] font-medium hover:bg-white/10 hover:text-white transition-all duration-500"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {/* Success modal: Job is Live! + shareable link + copy */}
      {newJobId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl apple-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 id="success-modal-title" className="text-xl font-bold text-white tracking-tighter">
                Job is Live!
              </h2>
              <button
                type="button"
                onClick={closeSuccessModal}
                className="p-2 rounded-full text-[#a1a1a6] hover:text-white hover:bg-white/10 transition-all duration-500"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[#a1a1a6] text-sm">
                Share this link for your 15-second application:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={applyLink}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 text-white text-sm px-3 py-2.5 font-mono truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#0a84ff] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all duration-500"
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
            <div className="px-6 py-4 border-t border-white/10">
              <button
                type="button"
                onClick={closeSuccessModal}
                className="w-full rounded-full border border-white/20 text-[#a1a1a6] font-medium py-3 hover:bg-white/10 hover:text-white transition-all duration-500"
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
