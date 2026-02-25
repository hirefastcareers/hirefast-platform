import { useEffect, useState } from 'react'
import { Package, ShoppingBag, Cog, Wrench, MapPin, Copy, Check, X, Users, FileText, ThumbsUp, ThumbsDown, MessageCircle, Mail, ShieldCheck, AlertTriangle, Send, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabase'
import { useEmployer } from '../contexts/EmployerContext'
import { TICKET_OPTIONS } from '../constants/skills'
import { getCoordinates } from '../utils/commute'
import DevToolSeedData from '../components/DevToolSeedData'

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
  last_contacted_at?: string | null
  has_rtw?: boolean | null
  has_certs?: boolean | null
  interest_check_sent_at?: string | null
  interest_status?: string | null
  candidate_skills?: string[] | null
  reason?: string | null
  jobs: { title: string; sector?: string | null; required_skills?: string[] | null } | null
  employers: { company_name: string } | null
}

const HOURS_24 = 24
const HOURS_48 = 48
const HOURS_5_DAYS = 5 * 24

function getGhostingState(shortlistedAt: string | null | undefined, lastContactedAt: string | null | undefined): 'ghosting_risk' | 'contact_pending' | null {
  if (!shortlistedAt) return null
  const effectiveSince = lastContactedAt || shortlistedAt
  const since = new Date(effectiveSince).getTime()
  const hoursElapsed = (Date.now() - since) / (1000 * 60 * 60)
  if (hoursElapsed >= HOURS_5_DAYS) return 'ghosting_risk'
  if (hoursElapsed >= HOURS_48) return 'contact_pending'
  return null
}

/** Interest check sent >24h ago and still pending (no confirmed/withdrawn response). */
function isInterestCheckNoResponse(interestCheckSentAt: string | null | undefined, interestStatus: string | null | undefined): boolean {
  if (!interestCheckSentAt || interestStatus !== 'pending') return false
  const hoursElapsed = (Date.now() - new Date(interestCheckSentAt).getTime()) / (1000 * 60 * 60)
  return hoursElapsed >= HOURS_24
}

function sortApplicationsWithConfirmedFirst(apps: ApplicationRow[]): ApplicationRow[] {
  return apps.slice().sort((a, b) => {
    const aConfirmed = a.status === 'shortlisted' && a.interest_status === 'confirmed'
    const bConfirmed = b.status === 'shortlisted' && b.interest_status === 'confirmed'
    if (aConfirmed && !bConfirmed) return -1
    if (!aConfirmed && bConfirmed) return 1
    return (b.match_score ?? 0) - (a.match_score ?? 0)
  })
}

function ApplicantScorecard({
  app,
  onShortlist,
  onReject,
  onMessageClick,
  onSendInterestCheck,
  isUpdating,
  isSendingInterestCheck,
}: {
  app: ApplicationRow
  onShortlist: () => void
  onReject: () => void
  onMessageClick?: () => void
  onSendInterestCheck?: () => void
  isUpdating: boolean
  isSendingInterestCheck?: boolean
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

  const ghosting = isShortlisted ? getGhostingState(app.shortlisted_at, app.last_contacted_at) : null
  const hasRtw = app.has_rtw === true || app.has_rtw === 'true' || app.has_rtw === 1
  const isEngineering = (app.jobs?.sector ?? '').toLowerCase() === 'engineering'
  const hasCerts = app.has_certs === true || app.has_certs === 'true' || app.has_certs === 1
  const requiredSkills = (app.jobs?.required_skills ?? []).filter(Boolean) as string[]
  const candidateSkills = (app.candidate_skills ?? []).filter(Boolean) as string[]
  const matchingSkills = requiredSkills.filter((s) => candidateSkills.includes(s))
  const missingSkills = requiredSkills.filter((s) => !candidateSkills.includes(s))
  const hasMissingRequirements = requiredSkills.length > 0 && missingSkills.length > 0
  const interestCheckSentAt = app.interest_check_sent_at
  const interestConfirmed = app.interest_status === 'confirmed'
  const interestNoResponse = isInterestCheckNoResponse(app.interest_check_sent_at, app.interest_status)

  function handleMessageClick() {
    onMessageClick?.()
    if (messageUrl.startsWith('http')) window.open(messageUrl, '_blank', 'noopener,noreferrer')
    else window.location.href = messageUrl
  }

  return (
    <article
      className={`group relative rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.01] p-[1px] bg-gradient-to-br from-slate-500/30 via-indigo-500/20 to-slate-500/30 ${isRejected ? 'opacity-50 grayscale' : ''} ${isShortlisted ? 'ring-1 ring-emerald-400/50' : ''}`}
      aria-label={`Application from ${app.full_name}`}
    >
      <div className={`rounded-[11px] bg-white/5 backdrop-blur-md h-full ${isShortlisted ? 'border-l-4 border-emerald-500/60' : ''}`}>
      <div className="p-6 sm:p-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-row gap-4 sm:gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-white">
              {app.match_score != null ? `${score}%` : '—'}
            </span>
          </div>
          <div className="min-w-0 flex-1 flex flex-col gap-1">
          {interestConfirmed && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.35)] w-fit mb-1" title="Candidate confirmed they are still interested">
              ✅ Still Interested
            </span>
          )}
          <h3 className="text-lg font-semibold text-white truncate">{app.full_name}</h3>
          <p className="text-slate-400 text-sm truncate">{app.email}</p>
          {interestNoResponse && (
            <p className="text-amber-400/90 text-sm font-medium">No Response</p>
          )}
          {app.jobs?.title && (
            <p className="text-indigo-300/90 text-sm">Applied to: {app.jobs.title}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {hasRtw ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300" title="Right to work in the UK">
                <ShieldCheck size={14} className="flex-shrink-0" aria-hidden />
                RTW
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300" title="No right to work in the UK">
                <AlertTriangle size={14} className="flex-shrink-0" aria-hidden />
                No RTW
              </span>
            )}
            {isEngineering && (
              hasCerts ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300" title="Holds required safety tickets/certs">
                  Certs
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300" title="No required certs declared">
                  No Certs
                </span>
              )
            )}
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
                {riskConfig.label}
              </span>
            )}
            {ghosting === 'contact_pending' && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300" title="Shortlisted over 48 hours ago; contact pending">
                Contact Pending
              </span>
            )}
            {ghosting === 'ghosting_risk' && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-red-400/40 bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300 animate-pulse" title="Shortlisted over 5 days ago; high ghosting risk">
                Ghosting Risk
              </span>
            )}
            {app.commute_distance != null && (
              <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
                <MapPin size={14} className="flex-shrink-0" aria-hidden />
                {app.commute_distance.toFixed(1)} miles away
              </span>
            )}
            {hasMissingRequirements && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-red-400/40 bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300" title="Candidate is missing one or more required tickets/certs">
                Missing Requirements
              </span>
            )}
          </div>
          {requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {matchingSkills.map((s) => (
                <span key={s} className="inline-flex rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300" title="Candidate holds this">
                  {s}
                </span>
              ))}
              {missingSkills.map((s) => (
                <span key={s} className="inline-flex rounded-md border border-red-400/40 bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300 line-through" title="Required but not held">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-t border-slate-700/80 pt-4 sm:border-t-0 sm:pt-0">
          {isShortlisted && (
            <>
              <span className="inline-flex message-pop-in">
                <button
                  type="button"
                  onClick={handleMessageClick}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 transition"
                  title={app.phone ? 'Open WhatsApp (marks as contacted)' : 'Send email (marks as contacted)'}
                >
                  {messageUrl.startsWith('http') ? <MessageCircle size={16} aria-hidden /> : <Mail size={16} aria-hidden />}
                  Message
                </button>
              </span>
              {interestCheckSentAt ? (
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-slate-300" title="Interest check sent">
                  <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-400" aria-hidden />
                  Check Sent {new Date(interestCheckSentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onSendInterestCheck}
                  disabled={isSendingInterestCheck}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/50 bg-indigo-600/80 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500/80 disabled:opacity-50 disabled:pointer-events-none transition"
                  title="Send interest check link to candidate"
                >
                  {isSendingInterestCheck ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
                  ) : (
                    <Send size={16} aria-hidden />
                  )}
                  Interest Check
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={onShortlist}
            disabled={isUpdating}
            title={isShortlisted ? 'Click to clear shortlist' : undefined}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
              isShortlisted
                ? 'bg-emerald-600/80 border-emerald-500/40 text-white cursor-default'
                : 'bg-slate-700/80 border-slate-600 text-slate-200 hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:text-emerald-200 disabled:opacity-50 disabled:pointer-events-none'
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
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
              isRejected
                ? 'bg-red-900/60 border-red-800/60 text-red-300 cursor-default'
                : 'bg-slate-700/80 border-slate-600 text-slate-200 hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-200 disabled:opacity-50 disabled:pointer-events-none'
            } ${isShortlisted ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ThumbsDown size={16} aria-hidden />
            {isRejected ? 'Rejected (click to clear)' : 'Reject'}
          </button>
        </div>
      </div>
      {isUpdating && (
        <div className="h-0.5 w-full bg-slate-600 overflow-hidden">
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
  engineering: {
    id: 'engineering',
    label: 'Engineering',
    icon: Wrench,
    title: 'Maintenance Tech / Welder / CNC Operator',
    description:
      'Skilled role in engineering or maintenance. Relevant safety tickets and certifications may be required. Must have right to work in the UK and be willing to travel for the right opportunity.',
    color: 'from-violet-500/90 to-purple-600/90 border-violet-400/30',
    hover: 'hover:from-violet-500 hover:to-purple-600 hover:border-violet-400/50',
  },
  manufacturing: {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Cog,
    title: 'Machine Operator / Assembly / Picker-Packer',
    description:
      'Hands-on role in a manufacturing environment. Duties include machine operation, assembly, or picking and packing. Must be reliable, punctual, and live within a reasonable commute. Shift patterns available.',
    color: 'from-slate-500/90 to-zinc-600/90 border-slate-400/30',
    hover: 'hover:from-slate-500 hover:to-zinc-600 hover:border-slate-400/50',
  },
  retail: {
    id: 'retail',
    label: 'Retail',
    icon: ShoppingBag,
    title: 'Store Assistant / Stockroom / Floor Staff',
    description:
      'Customer-focused role on the shop floor or in stock. Duties include serving customers, replenishment, and till or stockroom work. Must be eligible to work in the UK and reliable.',
    color: 'from-emerald-500/90 to-teal-600/90 border-emerald-400/30',
    hover: 'hover:from-emerald-500 hover:to-teal-600 hover:border-emerald-400/50',
  },
} as const

type SectorId = keyof typeof SECTOR_TEMPLATES

const initialForm = {
  title: '',
  description: '',
  pay_rate: '',
  postcode: '',
  required_skills: [] as string[],
  auto_reject_low_matches: false,
}

export default function RecruiterDashboard() {
  const { selectedEmployerId: employerId, employers, loading: sessionLoading, error: sessionError, createEmployer } = useEmployer()
  const selectedCompanyName = employerId ? employers.find((e) => e.id === employerId)?.company_name : null
  const [form, setForm] = useState(initialForm)
  const [createEmployerForm, setCreateEmployerForm] = useState({ companyName: '', adminEmail: '' })
  const [creatingEmployer, setCreatingEmployer] = useState(false)
  const [createEmployerError, setCreateEmployerError] = useState<string | null>(null)
  const [selectedSector, setSelectedSector] = useState<SectorId | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [newJobId, setNewJobId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeView, setActiveView] = useState<'rapid-post' | 'applicants'>('rapid-post')
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [applicationsError, setApplicationsError] = useState<string | null>(null)
  const [hideRejected, setHideRejected] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [sendingInterestCheckId, setSendingInterestCheckId] = useState<string | null>(null)
  type PostcodeValidation = 'idle' | 'validating' | 'valid' | 'invalid'
  const [postcodeValidation, setPostcodeValidation] = useState<PostcodeValidation>('idle')

  // Fetch applications for the selected employer's jobs (filter by employer_id)
  useEffect(() => {
    if (!employerId) return
    let cancelled = false
    setApplicationsLoading(true)
    setApplicationsError(null)
    async function fetchApplications() {
      try {
        const fullSelect = `
          id, full_name, email, phone, commute_distance, commute_risk_level, match_score, status, reason, created_at,
          shortlisted_at, last_contacted_at, has_rtw, has_certs, candidate_skills, interest_check_sent_at, interest_status,
          jobs!inner(title, sector, required_skills, is_active),
          employers(company_name)
        `
        let { data, error } = await supabase
          .from('applications')
          .select(fullSelect)
          .eq('employer_id', employerId)
          .eq('jobs.is_active', true)
          .order('match_score', { ascending: false, nullsFirst: false })
        if (cancelled) return
        if (error && (error.message?.includes('column') ?? false)) {
          const minimalSelect = 'id, full_name, email, phone, commute_distance, match_score, status, created_at, shortlisted_at, jobs!inner(title, is_active), employers(company_name)'
          const fallback = await supabase
            .from('applications')
            .select(minimalSelect)
            .eq('employer_id', employerId)
            .eq('jobs.is_active', true)
            .order('match_score', { ascending: false, nullsFirst: false })
          if (cancelled) return
          if (!fallback.error) {
            data = fallback.data
            error = null
          }
        }
        if (error) throw error
        const rows = (data as ApplicationRow[]) ?? []
        setApplications(sortApplicationsWithConfirmedFirst(rows))
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Failed to load applicants.'
          setApplicationsError(msg.includes('column') ? `${msg} Run Supabase migrations 005–010 if you haven’t.` : msg)
        }
      } finally {
        if (!cancelled) setApplicationsLoading(false)
      }
    }
    fetchApplications()
    return () => { cancelled = true }
  }, [employerId])

  /** Soft reject: simulated email when an application is moved to Rejected (manual or auto). */
  function sendRejectionEmail(email: string, candidateName: string, jobTitle: string, companyName: string) {
    const message = `Hi ${candidateName}, thanks for applying to ${companyName} for ${jobTitle}. On this occasion, the recruiter has decided to move forward with other candidates who more closely match the specific site requirements. We wish you the best of luck.`
    console.log(`[Rejection email simulated] to ${email}:`, message)
  }

  const [updateErrorToast, setUpdateErrorToast] = useState<string | null>(null)

  async function updateApplicationStatus(
    applicationId: string,
    status: 'shortlisted' | 'rejected' | 'pending',
    reason?: string | null
  ) {
    setUpdatingId(applicationId)
    setUpdateErrorToast(null)
    const shortlisted_at = status === 'shortlisted' ? new Date().toISOString() : null
    const payload: { status: string; shortlisted_at: string | null; reason?: string } = { status, shortlisted_at }
    if (status === 'rejected' && reason !== undefined) payload.reason = reason ?? null
    try {
      const { error } = await supabase
        .from('applications')
        .update(payload)
        .eq('id', applicationId)
      if (error) throw error
      setApplications((prev) =>
        sortApplicationsWithConfirmedFirst(
          prev.map((a) =>
            a.id === applicationId
              ? { ...a, status, shortlisted_at: shortlisted_at ?? undefined, ...(reason !== undefined && { reason }) }
              : a
          )
        )
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update status.'
      setUpdateErrorToast(msg.includes('column') ? `${msg} Run migration 007 (shortlisted_at).` : msg)
      setTimeout(() => setUpdateErrorToast(null), 6000)
    } finally {
      setUpdatingId(null)
    }
  }

  async function updateLastContactedAt(applicationId: string) {
    const now = new Date().toISOString()
    try {
      const { error } = await supabase
        .from('applications')
        .update({ last_contacted_at: now })
        .eq('id', applicationId)
      if (error) throw error
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, last_contacted_at: now } : a))
      )
    } catch {
      // Keep UI unchanged on error
    }
  }

  async function sendInterestCheck(applicationId: string) {
    setSendingInterestCheckId(applicationId)
    const now = new Date().toISOString()
    const token = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tk_${Date.now()}_${Math.random().toString(36).slice(2)}`
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          interest_status: 'pending',
          interest_check_sent_at: now,
          interest_check_token: token,
        })
        .eq('id', applicationId)
      if (error) throw error
      setApplications((prev) =>
        sortApplicationsWithConfirmedFirst(
          prev.map((a) =>
            a.id === applicationId ? { ...a, interest_status: 'pending', interest_check_sent_at: now } : a
          )
        )
      )
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const magicLinkUrl = `${baseUrl}/confirm-interest/${applicationId}?t=${token}`
      console.log('[Interest Check] Magic link (simulated – will be sent via Resend/SMS):', magicLinkUrl)
    } catch {
      // Keep UI unchanged on error
    } finally {
      setSendingInterestCheckId(null)
    }
  }

  const [rejectionToast, setRejectionToast] = useState<string | null>(null)

  async function handleReject(app: ApplicationRow) {
    await updateApplicationStatus(app.id, 'rejected', 'Rejected by recruiter')
    const companyName = app.employers?.company_name ?? 'the company'
    sendRejectionEmail(app.email, app.full_name, app.jobs?.title ?? 'the role', companyName)
    setRejectionToast(`Rejection sent. We've notified ${app.full_name} that they weren't successful this time.`)
    setTimeout(() => setRejectionToast(null), 4500)
  }

  function applyTemplate(sectorId: SectorId) {
    const t = SECTOR_TEMPLATES[sectorId]
    setSelectedSector(sectorId)
    setForm((f) => ({
      ...f,
      title: t.title,
      description: t.description,
      pay_rate: '',
      required_skills: [],
    }))
    setSaveError(null)
    setNewJobId(null)
  }

  async function validatePostcode(postcode: string): Promise<boolean> {
    const trimmed = postcode.trim()
    if (!trimmed || trimmed.length < 4) {
      setPostcodeValidation('idle')
      return false
    }
    setPostcodeValidation('validating')
    const coords = await getCoordinates(trimmed)
    setPostcodeValidation(coords ? 'valid' : 'invalid')
    return !!coords
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
      if (postcodeTrimmed) {
        const valid = await validatePostcode(postcodeTrimmed)
        if (!valid) {
          setSaveError('Please enter a valid UK postcode. We use it to calculate candidate commute.')
          setSaving(false)
          return
        }
      }

      const { data: inserted, error } = await supabase
        .from('jobs')
        .insert({
          employer_id: employerId,
          recruiter_id: user.id,
          title: form.title.trim() || 'Untitled role',
          location: postcodeTrimmed || null,
          pay_rate: form.pay_rate.trim() || null,
          description_template: form.description.trim() || null,
          is_active: true,
          sector: selectedSector ?? null,
          required_skills: (form.required_skills?.length ? form.required_skills : []) as string[],
          auto_reject_low_matches: form.auto_reject_low_matches ?? false,
        })
        .select('id')
        .single()

      if (error) throw error
      if (!inserted?.id) throw new Error('No job id returned.')

      setNewJobId(inserted.id)
      setForm({ ...initialForm, postcode: form.postcode, required_skills: [] })
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

  if ((sessionError || !employerId) && !sessionLoading) {
    async function handleCreateEmployer(e: React.FormEvent) {
      e.preventDefault()
      setCreatingEmployer(true)
      setCreateEmployerError(null)
      const result = await createEmployer(createEmployerForm.companyName, createEmployerForm.adminEmail)
      setCreatingEmployer(false)
      if (!result) setCreateEmployerError('Could not create employer. Please try again.')
    }
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-slate-700/80 bg-slate-800/50 p-6">
        <h2 className="text-xl font-bold text-white mb-1">Create your first employer</h2>
        <p className="text-slate-400 text-sm mb-6">You need at least one employer to post jobs and view applicants.</p>
        <form onSubmit={handleCreateEmployer} className="space-y-4">
          <div>
            <label htmlFor="create-company-name" className="block text-sm font-medium text-slate-300 mb-1">Company name</label>
            <input
              id="create-company-name"
              type="text"
              value={createEmployerForm.companyName}
              onChange={(e) => setCreateEmployerForm((f) => ({ ...f, companyName: e.target.value }))}
              placeholder="e.g. Acme Ltd"
              className="w-full rounded-xl border border-slate-600 bg-slate-800 text-white placeholder-slate-500 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
            />
          </div>
          <div>
            <label htmlFor="create-admin-email" className="block text-sm font-medium text-slate-300 mb-1">Admin email</label>
            <input
              id="create-admin-email"
              type="email"
              value={createEmployerForm.adminEmail}
              onChange={(e) => setCreateEmployerForm((f) => ({ ...f, adminEmail: e.target.value }))}
              placeholder="e.g. you@company.com"
              className="w-full rounded-xl border border-slate-600 bg-slate-800 text-white placeholder-slate-500 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
            />
          </div>
          {createEmployerError && <p className="text-red-400 text-sm">{createEmployerError}</p>}
          <button
            type="submit"
            disabled={creatingEmployer}
            className="w-full rounded-xl bg-indigo-600 text-white font-semibold py-3 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            {creatingEmployer ? 'Creating…' : 'Create employer'}
          </button>
        </form>
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
      {updateErrorToast && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md rounded-xl border border-red-500/50 bg-red-950/90 shadow-xl px-4 py-3 text-red-200 text-sm toast-enter"
        >
          {updateErrorToast}
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
        <div className="mt-4">
          <DevToolSeedData />
        </div>
      </header>

      {activeView === 'applicants' ? (
        <section className="rounded-2xl border border-slate-700/80 bg-slate-800/50 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">All applicants</h2>
              <p className="text-sm text-slate-400">Sorted by match score (highest first)</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm font-medium">
              <input
                type="checkbox"
                checked={hideRejected}
                onChange={(e) => setHideRejected(e.target.checked)}
                className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-amber-500 focus:ring-amber-400"
              />
              Hide Rejected Candidates
            </label>
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
            {!applicationsLoading && !applicationsError && applications.length > 0 && (() => {
              const filtered = hideRejected ? applications.filter((a) => a.status !== 'rejected') : applications
              if (filtered.length === 0) {
                return (
                  <p className="text-slate-400 py-12 text-center">
                    No active applicants. Turn off &quot;Hide Rejected Candidates&quot; to see rejected.
                  </p>
                )
              }
              return (
              <ul className="space-y-4" role="list">
                {filtered.map((app) => (
                  <li key={app.id}>
                    <ApplicantScorecard
                      app={app}
                      onShortlist={() => updateApplicationStatus(app.id, app.status === 'shortlisted' ? 'pending' : 'shortlisted')}
                      onReject={() => app.status === 'rejected' ? updateApplicationStatus(app.id, 'pending') : handleReject(app)}
                      onMessageClick={() => updateLastContactedAt(app.id)}
                      onSendInterestCheck={() => sendInterestCheck(app.id)}
                      isUpdating={updatingId === app.id}
                      isSendingInterestCheck={sendingInterestCheckId === app.id}
                    />
                  </li>
                ))}
              </ul>
              )
            })()}
          </div>
        </section>
      ) : (
        <>
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

      <section className="rounded-2xl border border-slate-700/80 bg-slate-800/50 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/80">
          <h2 className="text-lg font-semibold text-white">Job details</h2>
          <p className="text-sm text-slate-400">
            {selectedSector
              ? `Template: ${SECTOR_TEMPLATES[selectedSector].label} — edit and save when ready.`
              : 'Click a sector above to fill the form.'}
          </p>
          {selectedCompanyName && (
            <p className="text-xs font-medium text-indigo-300 mt-2" title="Jobs are scoped to the company selected in the sidebar switcher">
              Posting for: {selectedCompanyName}
            </p>
          )}
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
            <div className={`rounded-xl border p-4 ${
                postcodeValidation === 'valid'
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : postcodeValidation === 'invalid'
                    ? 'border-red-500/40 bg-red-950/20'
                    : 'border-indigo-500/30 bg-indigo-950/20'
              }`}>
              <div className="flex gap-3">
                <MapPin className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  postcodeValidation === 'valid' ? 'text-emerald-400' : postcodeValidation === 'invalid' ? 'text-red-400' : 'text-indigo-400'
                }`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <label htmlFor="job-postcode" className="text-sm font-medium text-white">
                    Location (Postcode)
                  </label>
                  <p className="text-slate-400 text-sm mt-0.5">
                    UK postcode for commute distance. Validated via Postcodes.io.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      id="job-postcode"
                      type="text"
                      value={form.postcode}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, postcode: e.target.value.toUpperCase() }))
                        setPostcodeValidation('idle')
                      }}
                      onBlur={() => form.postcode.trim() && validatePostcode(form.postcode)}
                      placeholder="e.g. M1 1AA"
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 text-white placeholder-slate-500 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                    />
                    {postcodeValidation === 'validating' && (
                      <span className="text-slate-400 text-xs whitespace-nowrap">Validating…</span>
                    )}
                    {postcodeValidation === 'valid' && (
                      <span className="text-emerald-400 text-xs font-medium whitespace-nowrap">Valid</span>
                    )}
                    {postcodeValidation === 'invalid' && (
                      <span className="text-red-400 text-xs font-medium whitespace-nowrap">Invalid postcode</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-600/50 bg-slate-800/30 p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.auto_reject_low_matches ?? false}
                onChange={(e) => setForm((f) => ({ ...f, auto_reject_low_matches: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-amber-500 focus:ring-amber-400"
              />
              <span className="text-sm font-medium text-white">Auto-Reject Low Matches</span>
            </label>
            <p className="text-slate-400 text-sm mt-1 ml-7">
              When enabled, applications with no right to work or commute &gt; 30 miles are automatically rejected.
            </p>
          </div>

          {(selectedSector === 'engineering' || selectedSector === 'manufacturing') && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
              <p className="text-sm font-medium text-white mb-2">Required Tickets</p>
              <p className="text-slate-400 text-sm mb-3">Select all that apply for this role. Candidates will see these on the apply form.</p>
              <div className="flex flex-wrap gap-2">
                {TICKET_OPTIONS.map((ticket) => {
                  const checked = form.required_skills?.includes(ticket) ?? false
                  return (
                    <label
                      key={ticket}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium cursor-pointer transition ${
                        checked
                          ? 'border-indigo-400/60 bg-indigo-500/25 text-white'
                          : 'border-slate-600 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setForm((f) => {
                            const current = f.required_skills ?? []
                            if (e.target.checked) return { ...f, required_skills: [...current, ticket] }
                            return { ...f, required_skills: current.filter((s) => s !== ticket) }
                          })
                        }}
                        className="sr-only"
                      />
                      {ticket}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

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
                  setForm({ ...initialForm, required_skills: [] })
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
