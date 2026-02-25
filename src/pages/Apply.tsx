import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import { supabase } from '../supabase'
import {
  getCoordinates,
  calculateDistance,
  getCommuteRiskLevel,
  type CommuteRiskLevel,
} from '../utils/commute'

/** Location-only score 0–100 (green 100, amber 85, red 50). */
function locationScore(commuteRiskLevel: CommuteRiskLevel | null): number {
  if (!commuteRiskLevel) return 100
  if (commuteRiskLevel === 'green') return 100
  if (commuteRiskLevel === 'amber') return 85
  return 50
}

/**
 * Match score: No RTW => 0. Engineering without certs => 0.
 * For Engineering/Manufacturing with required_skills: 50% location + 50% skills match.
 * Otherwise: 100% location (Truth Engine only).
 */
function computeMatchScore(
  commuteRiskLevel: CommuteRiskLevel | null,
  hasRtw: boolean,
  isEngineering: boolean,
  hasCerts: boolean,
  isManufacturing: boolean,
  requiredSkills: string[],
  candidateSkills: string[]
): number {
  if (!hasRtw) return 0
  if (isEngineering && !hasCerts) return 0
  const locScore = locationScore(commuteRiskLevel)
  const useSkillsWeight = (isEngineering || isManufacturing) && requiredSkills.length > 0
  if (!useSkillsWeight) {
    let score = 100
    if (commuteRiskLevel === 'amber') score -= 15
    if (commuteRiskLevel === 'red') score -= 50
    return Math.max(0, Math.min(100, score))
  }
  const skillsScore = requiredSkills.length === 0 ? 100 : (candidateSkills.filter((c) => requiredSkills.includes(c)).length / requiredSkills.length) * 100
  const combined = 0.5 * locScore + 0.5 * skillsScore
  return Math.max(0, Math.min(100, Math.round(combined)))
}

type JobData = {
  title: string
  pay_rate: string | null
  employer_id: string
  location: string | null
  postcode?: string | null
  sector?: string | null
  required_skills?: string[] | null
  employers: { company_name: string } | null
}

export default function Apply() {
  const params = useParams<{ jobId?: string; id?: string }>()
  const jobId = params.jobId ?? params.id
  const navigate = useNavigate()

  const [job, setJob] = useState<JobData | null>(null)
  const [loadingJob, setLoadingJob] = useState(!!jobId)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [postcode, setPostcode] = useState('')
  const [hasRtw, setHasRtw] = useState<boolean | null>(null)
  const [hasCerts, setHasCerts] = useState<boolean | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existingApplication, setExistingApplication] = useState<{ created_at: string; status: string } | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(false)

  // Fetch job with company name (join employers)
  useEffect(() => {
    if (!jobId) return
    let cancelled = false
    setLoadingJob(true)
    setError(null)
    async function fetchJob() {
      try {
        const { data, error: err } = await supabase
          .from('jobs')
          .select('title, pay_rate, employer_id, location, postcode, sector, required_skills, employers(company_name)')
          .eq('id', jobId)
          .eq('is_active', true)
          .single()
        if (cancelled) return
        if (err) {
          setError(err.message ?? 'Job not found.')
          setJob(null)
          return
        }
        setJob(data as JobData)
      } catch (e) {
        if (!cancelled) setError('Something went wrong.')
      } finally {
        if (!cancelled) setLoadingJob(false)
      }
    }
    fetchJob()
    return () => { cancelled = true }
  }, [jobId])

  // Check for existing application when we have job and a valid-looking email (Express Apply: show Already Applied)
  useEffect(() => {
    if (!jobId || !email.trim()) {
      setExistingApplication(null)
      return
    }
    const trimmed = email.trim()
    if (!trimmed.includes('@') || trimmed.length < 6) {
      setExistingApplication(null)
      return
    }
    let cancelled = false
    setLoadingExisting(true)
    setExistingApplication(null)
    ;(async () => {
      try {
        const { data, error: rpcErr } = await supabase.rpc('get_application_status_for_candidate', {
          p_job_id: jobId,
          p_email: trimmed,
        })
        if (cancelled) return
        if (!rpcErr && data && Array.isArray(data) && data.length > 0) {
          const row = data[0] as { created_at: string; status: string }
          setExistingApplication({ created_at: row.created_at, status: row.status ?? 'pending' })
        } else {
          setExistingApplication(null)
        }
      } catch {
        if (!cancelled) setExistingApplication(null)
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    })()
    return () => { cancelled = true }
  }, [jobId, email.trim()])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!job || !jobId) return
    setSubmitting(true)
    setError(null)
    try {
      const candidatePostcode = postcode.trim()
      const jobPostcode = (job.postcode && job.postcode.trim()) || (job.location && job.location.trim()) || ''
      let commute_distance_miles: number | null = null
      let commute_risk_level: CommuteRiskLevel | null = null

      if (candidatePostcode && jobPostcode) {
        const [jobCoords, candidateCoords] = await Promise.all([
          getCoordinates(jobPostcode),
          getCoordinates(candidatePostcode),
        ])
        if (!jobCoords || !candidateCoords) {
          setError('Please enter a valid UK postcode so we can calculate your commute.')
          return
        }
        const miles = calculateDistance(
          jobCoords.lat,
          jobCoords.lng,
          candidateCoords.lat,
          candidateCoords.lng
        )
        commute_distance_miles = Math.round(miles * 10) / 10
        commute_risk_level = getCommuteRiskLevel(commute_distance_miles, job.sector ?? undefined)
      }

      const isEngineering = (job.sector ?? '').toLowerCase() === 'engineering'
      const isManufacturing = (job.sector ?? '').toLowerCase() === 'manufacturing'
      const requiredSkills = (job.required_skills ?? []).filter(Boolean) as string[]
      const candidateSkills = selectedSkills.filter((s) => requiredSkills.includes(s))
      const match_score = computeMatchScore(
        commute_risk_level,
        hasRtw === true,
        isEngineering,
        isEngineering ? hasCerts === true : true,
        isManufacturing,
        requiredSkills,
        candidateSkills
      )

      const payload: Record<string, unknown> = {
        job_id: jobId,
        employer_id: job.employer_id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        candidate_postcode: candidatePostcode || null,
        status: 'pending',
        has_rtw: hasRtw === true,
        commute_distance: commute_distance_miles,
        commute_risk_level,
        match_score,
      }
      if (isEngineering) (payload as { has_certs?: boolean }).has_certs = hasCerts === true
      if (requiredSkills.length > 0) (payload as { candidate_skills?: string[] }).candidate_skills = candidateSkills

      const { error: insertErr } = await supabase.from('applications').insert(payload)
      if (insertErr) {
        if ((insertErr as { code?: string }).code === '23505') {
          setError("You've already applied to this role. We have your application on file.")
          return
        }
        throw insertErr
      }
      setSubmitted(true)
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ??
        (err instanceof Error ? err.message : 'Something went wrong.')
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const companyName = job?.employers?.company_name ?? 'The company'

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" aria-hidden />
        <p className="text-slate-400 mt-4 font-medium">Loading role…</p>
      </div>
    )
  }

  if (!job && !loadingJob) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-slate-400">Job not found.</p>
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="mt-4 text-amber-400 font-medium hover:underline"
        >
          Back to roles
        </button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white antialiased">
        <Navbar />
        <main className="relative max-w-lg mx-auto px-4 py-16 text-center">
          <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" aria-hidden />
            <h1 className="text-2xl font-bold text-white mb-2">Success!</h1>
            <p className="text-slate-300 mb-6">
              Application Sent! {companyName} will contact you shortly if it&apos;s a match.
            </p>
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="w-full rounded-xl bg-amber-500 text-slate-900 font-bold py-3.5 hover:bg-amber-400 transition"
            >
              Find more roles
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      <Navbar />

      <main className="relative max-w-lg mx-auto px-4 py-8 sm:py-10">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
          {job?.title ?? 'Apply'}
        </h1>
        <p className="text-slate-400 text-sm mb-1">
          {job?.employers?.company_name ?? ''}
        </p>
        {job?.pay_rate && (
          <p className="text-amber-400 text-sm font-medium mb-6">{job.pay_rate}</p>
        )}
        {!job?.pay_rate && <div className="mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm p-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="apply-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              id="apply-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Smith"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="apply-email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              id="apply-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="apply-phone" className="block text-sm font-medium text-slate-300 mb-1.5">
              Phone Number
            </label>
            <input
              id="apply-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 07123 456789"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="apply-postcode" className="block text-sm font-medium text-slate-300 mb-1.5">
              Where are you travelling from?
            </label>
            <input
              id="apply-postcode"
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/gi, '').slice(0, 8))}
              placeholder="e.g. SW1A 1AA"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              autoComplete="postal-code"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-800/50 px-4 py-3.5">
            <p className="text-sm font-medium text-slate-300 mb-2">
              Do you have the right to work in the UK? <span className="text-amber-400">*</span>
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="has_rtw"
                  checked={hasRtw === true}
                  onChange={() => setHasRtw(true)}
                  className="w-4 h-4 text-amber-500 border-slate-500 bg-slate-800 focus:ring-amber-400"
                />
                <span className="text-white">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="has_rtw"
                  checked={hasRtw === false}
                  onChange={() => setHasRtw(false)}
                  className="w-4 h-4 text-amber-500 border-slate-500 bg-slate-800 focus:ring-amber-400"
                />
                <span className="text-white">No</span>
              </label>
            </div>
          </div>

          {(job?.sector ?? '').toLowerCase() === 'engineering' && (
            <div className="rounded-xl border border-white/10 bg-slate-800/50 px-4 py-3.5">
              <p className="text-sm font-medium text-slate-300 mb-2">
                Do you hold the required safety tickets/certs for this role? <span className="text-amber-400">*</span>
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="has_certs"
                    checked={hasCerts === true}
                    onChange={() => setHasCerts(true)}
                    className="w-4 h-4 text-amber-500 border-slate-500 bg-slate-800 focus:ring-amber-400"
                  />
                  <span className="text-white">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="has_certs"
                    checked={hasCerts === false}
                    onChange={() => setHasCerts(false)}
                    className="w-4 h-4 text-amber-500 border-slate-500 bg-slate-800 focus:ring-amber-400"
                  />
                  <span className="text-white">No</span>
                </label>
              </div>
            </div>
          )}

          {(job?.required_skills?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-white/10 bg-slate-800/50 px-4 py-3.5">
              <p className="text-sm font-medium text-slate-300 mb-2">
                Which of the following do you currently hold?
              </p>
              <div className="flex flex-wrap gap-2">
                {(job!.required_skills ?? []).map((skill) => {
                  const checked = selectedSkills.includes(skill)
                  return (
                    <label
                      key={skill}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium cursor-pointer transition ${
                        checked
                          ? 'border-amber-400/60 bg-amber-500/20 text-white'
                          : 'border-white/10 bg-slate-800 text-slate-300 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedSkills((prev) =>
                            e.target.checked ? [...prev, skill] : prev.filter((s) => s !== skill)
                          )
                        }}
                        className="sr-only"
                      />
                      {skill}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={
              !!existingApplication ||
              submitting ||
              !fullName.trim() ||
              !email.trim() ||
              hasRtw === null ||
              ((job?.sector ?? '').toLowerCase() === 'engineering' && hasCerts === null)
            }
            className="w-full rounded-xl bg-amber-500 text-slate-900 font-bold py-4 text-base hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            {submitting ? 'Sending…' : existingApplication ? 'Already Applied' : 'Apply Now'}
          </button>
          {existingApplication && (
            <p className="text-slate-400 text-sm text-center mt-2">
              You applied for this role on{' '}
              {new Date(existingApplication.created_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
              . Status: {existingApplication.status === 'pending' ? 'Under Review' : existingApplication.status === 'shortlisted' ? 'Shortlisted' : existingApplication.status === 'rejected' ? 'Rejected' : existingApplication.status}.
            </p>
          )}
        </form>
      </main>
    </div>
  )
}
