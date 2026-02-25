import { useState, useEffect } from 'react'
import { X, MapPin, Mail, Phone, Send, Loader2, FileText, ExternalLink, Copy, Link2 } from 'lucide-react'
import { supabase } from '../../supabase'
import { Badge, RTWBadge, CommuteBadge } from '../ui/badge'
import HireFastSummary from './HireFastSummary'

export type ApplicationForPanel = {
  id: string
  full_name: string
  email: string
  phone: string | null
  status: string
  created_at: string
  commute_distance: number | null
  commute_risk_level: string | null
  match_score: number | null
  has_rtw?: boolean | null
  candidate_postcode?: string | null
  candidate_skills?: string[] | null
  cv_url?: string | null
  cv_text?: string | null
  interest_check_sent_at?: string | null
  interest_status?: string | null
  jobs: { title: string; sector?: string | null; required_skills?: string[] | null } | null
  employers: { company_name: string } | null
}

type CandidateQuickViewPanelProps = {
  application: ApplicationForPanel | null
  activeJobRequiredSkills: string[]
  onClose: () => void
  onInterestCheckSent?: (applicationId: string) => void
}

/** Extract a rough "years of experience" from CV text (e.g. "5 years", "10+ years"). */
function parseYearsExperience(cvText: string | null | undefined): string | null {
  if (!cvText || typeof cvText !== 'string') return null
  const match = cvText.match(/(\d+)\s*\+?\s*years?\s*(?:of\s*)?(?:experience|exp\.?)?/i)
  if (match) return `${match[1]}+ years`
  const short = cvText.match(/(\d+)\s*\+?\s*years?/i)
  if (short) return `${short[1]} years`
  return null
}

/** Highlight keywords (required_skills) in text. Returns array of segments: { text, highlight }. */
function highlightKeywords(
  text: string,
  keywords: string[]
): Array<{ text: string; highlight: boolean }> {
  if (!keywords.length) return [{ text, highlight: false }]
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts: Array<{ text: string; highlight: boolean }> = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  const re = new RegExp(regex.source, 'gi')
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, m.index), highlight: false })
    }
    parts.push({ text: m[1], highlight: true })
    lastIndex = m.index + m[1].length
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false })
  }
  return parts.length ? parts : [{ text, highlight: false }]
}

export default function CandidateQuickViewPanel({
  application,
  activeJobRequiredSkills,
  onClose,
  onInterestCheckSent,
}: CandidateQuickViewPanelProps) {
  const [sendingInterestCheck, setSendingInterestCheck] = useState(false)
  const [profileCv, setProfileCv] = useState<{ cv_url: string | null; cv_text: string | null } | null>(null)
  const [profileCvLoading, setProfileCvLoading] = useState(false)
  const [requestCvLink, setRequestCvLink] = useState<string | null>(null)
  const [requestCvLoading, setRequestCvLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Pull CV from Candidate Profile (candidates table) when application has no CV
  useEffect(() => {
    if (!application?.id) {
      setProfileCv(null)
      return
    }
    const appCvUrl = application.cv_url ?? null
    const appCvText = (application.cv_text ?? '').trim()
    if (appCvUrl || appCvText) {
      setProfileCv(null)
      return
    }
    let cancelled = false
    setProfileCvLoading(true)
    setProfileCv(null)
    supabase
      .rpc('get_candidate_cv_for_application', { p_application_id: application.id })
      .then(({ data, error }) => {
        if (cancelled) return
        setProfileCvLoading(false)
        if (error || !data?.length) {
          setProfileCv(null)
          return
        }
        const row = Array.isArray(data) ? data[0] : data
        const cvUrl = (row?.cv_url ?? null) as string | null
        const cvText = (row?.cv_text ?? null) as string | null
        if (cvUrl || (cvText && String(cvText).trim())) {
          setProfileCv({ cv_url: cvUrl, cv_text: cvText ? String(cvText).trim() : null })
        } else {
          setProfileCv(null)
        }
      })
    return () => { cancelled = true }
  }, [application?.id, application?.cv_url, application?.cv_text])

  if (!application) return null

  const {
    id: applicationId,
    full_name,
    email,
    phone,
    status,
    created_at,
    commute_distance,
    commute_risk_level,
    match_score,
    has_rtw,
    candidate_postcode,
    candidate_skills,
    cv_url,
    cv_text,
    interest_check_sent_at,
    interest_status,
    jobs,
    employers,
  } = application

  // Prefer application CV, then CV pulled from Candidate Profile
  const displayCvUrl = cv_url || profileCv?.cv_url || null
  const displayCvText = ((cv_text ?? '').trim() || profileCv?.cv_text || '').trim()

  const miles = commute_distance != null ? Number(commute_distance) : null
  const risk = (commute_risk_level as 'green' | 'amber' | 'red') || null
  const score = match_score != null ? Math.round(Number(match_score)) : null
  const created = created_at
    ? new Date(created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

  const yearsExp = parseYearsExperience(displayCvText || (cv_text ?? null))
  const topSkills = (candidate_skills ?? []).slice(0, 3)
  const ticketsSummary =
    ((candidate_skills?.length ?? 0) > 0)
      ? (candidate_skills ?? []).join(', ')
      : 'No tickets listed'

  const cvPreviewText = displayCvText
  const keywordsToHighlight = activeJobRequiredSkills.length > 0 ? activeJobRequiredSkills : []
  const cvSegments =
    cvPreviewText && keywordsToHighlight.length > 0
      ? highlightKeywords(cvPreviewText, keywordsToHighlight)
      : [{ text: cvPreviewText, highlight: false }]

  const interestCheckAlreadySent = !!(interest_check_sent_at || interest_status === 'pending')
  const hasNoCv = !displayCvUrl && !cvPreviewText && !profileCvLoading

  async function handleRequestCv() {
    if (!applicationId) return
    setRequestCvLoading(true)
    setRequestCvLink(null)
    try {
      const { data, error } = await supabase.rpc('get_or_create_candidate_profile_link', {
        p_application_id: applicationId,
      })
      if (error) throw error
      const path = data as string | null
      if (path) {
        const base = typeof window !== 'undefined' ? window.location.origin : ''
        setRequestCvLink(base + path)
      }
    } finally {
      setRequestCvLoading(false)
    }
  }

  function copyRequestCvLink() {
    if (!requestCvLink) return
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(requestCvLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  async function handleSendInterestCheck() {
    setSendingInterestCheck(true)
    const now = new Date().toISOString()
    const token =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `tk_${Date.now()}_${Math.random().toString(36).slice(2)}`
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
      const { data } = await supabase.functions.invoke('send-interest-check', {
        body: { application_id: applicationId },
      })
      if (!data?.sent && data?.magic_link) console.log('[Interest Check] Magic link:', data.magic_link)
      onInterestCheckSent?.(applicationId)
    } finally {
      setSendingInterestCheck(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white shadow-xl border-l border-slate-200 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Candidate quick view"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">CV Speed-Reader</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <HireFastSummary
            yearsExperience={yearsExp}
            topSkills={topSkills}
            verificationStatus={{
              rtw: has_rtw === true,
              ticketsSummary: ((candidate_skills?.length ?? 0) > 0) ? ticketsSummary : 'No tickets listed',
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            {risk && <CommuteBadge risk={risk} />}
            <RTWBadge hasRtw={has_rtw === true} />
            {score != null && (
              <span className="text-sm font-semibold text-slate-700">Match: {score}%</span>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              CV Preview
            </h3>
            {profileCvLoading && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Checking Candidate Profile for CV…
              </div>
            )}
            {!profileCvLoading && displayCvUrl && !cvPreviewText && (
              <a
                href={displayCvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-slate-100"
              >
                View full CV <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {!profileCvLoading && cvPreviewText ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 max-h-64 overflow-y-auto">
                <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
                  {cvSegments.map((seg, i) =>
                    seg.highlight ? (
                      <mark
                        key={i}
                        className="bg-amber-200 text-amber-900 font-medium rounded px-0.5"
                      >
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    )
                  )}
                </p>
                {keywordsToHighlight.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    Highlighted: job required skills
                  </p>
                )}
              </div>
            ) : !profileCvLoading && hasNoCv && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-slate-500 text-sm">
                  No CV on file. Request one so the candidate can upload from their Digital Passport.
                </p>
                {requestCvLink ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-600">Magic link — send to candidate:</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={requestCvLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-blue-600 font-medium hover:bg-slate-50 break-all"
                      >
                        <Link2 className="w-4 h-4 shrink-0" />
                        {requestCvLink}
                      </a>
                      <button
                        type="button"
                        onClick={copyRequestCvLink}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 text-sm hover:bg-slate-900 hover:bg-slate-800/90"
                      >
                        <Copy className="w-4 h-4" />
                        {linkCopied ? 'Copied' : 'Copy link'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestCv}
                    disabled={requestCvLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white text-slate-900 font-bold px-4 py-3 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {requestCvLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Link2 className="w-5 h-5" />
                    )}
                    Request CV
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Name</p>
            <p className="text-slate-900 font-semibold">{full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email</p>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:underline"
            >
              <Mail className="w-4 h-4" />
              {email ?? '—'}
            </a>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Phone</p>
            <p className="flex items-center gap-1.5 text-slate-900 font-medium">
              <Phone className="w-4 h-4 text-slate-400" />
              {phone ?? '—'}
            </p>
          </div>
          {candidate_postcode && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Postcode</p>
              <p className="flex items-center gap-1.5 text-slate-900 font-medium">
                <MapPin className="w-4 h-4 text-slate-400" />
                {candidate_postcode}
              </p>
            </div>
          )}
          {miles != null && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Distance</p>
              <p className="text-slate-700">{miles} miles from job</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</p>
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 capitalize">
              {status ?? 'pending'}
            </span>
          </div>
          {jobs?.title && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Applied for</p>
              <p className="text-slate-900 font-medium">{jobs.title}</p>
              {employers?.company_name && (
                <p className="text-slate-500 text-sm">{employers.company_name}</p>
              )}
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Applied on</p>
            <p className="text-slate-600">{created}</p>
          </div>
        </div>

          <div className="shrink-0 border-t border-slate-200 bg-white p-4 safe-area-pb">
            <button
              type="button"
              onClick={handleSendInterestCheck}
              disabled={sendingInterestCheck || interestCheckAlreadySent}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 text-white font-bold py-5 text-xl hover:bg-emerald-500 disabled:opacity-60 disabled:pointer-events-none transition shadow-xl shadow-emerald-500/30"
            >
              {sendingInterestCheck ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <Send className="w-7 h-7" />
              )}
              {interestCheckAlreadySent
                ? 'Interest check sent'
                : sendingInterestCheck
                  ? 'Sending…'
                  : 'Send Interest Check'}
            </button>
            <p className="text-slate-500 text-sm text-center mt-2 font-medium">
              Solve the Ghosting Crisis — magic link so they confirm they&apos;re still interested. No password.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
