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

/** Truth Engine match score: base 100, −15 amber, −50 red; clamped 0–100. */
function computeMatchScore(commuteRiskLevel: CommuteRiskLevel | null): number {
  let score = 100
  if (commuteRiskLevel === 'amber') score -= 15
  if (commuteRiskLevel === 'red') score -= 50
  return Math.max(0, Math.min(100, score))
}

type JobData = {
  title: string
  pay_rate: string | null
  employer_id: string
  location: string | null
  postcode?: string | null
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
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
          .select('title, pay_rate, employer_id, location, postcode, employers(company_name)')
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
        commute_risk_level = getCommuteRiskLevel(commute_distance_miles)
      }

      const match_score = computeMatchScore(commute_risk_level)

      const { error: insertErr } = await supabase.from('applications').insert({
        job_id: jobId,
        employer_id: job.employer_id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        candidate_postcode: candidatePostcode || null,
        status: 'new',
        commute_distance: commute_distance_miles,
        commute_risk_level,
        match_score,
      })
      if (insertErr) throw insertErr
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
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

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

          <button
            type="submit"
            disabled={submitting || !fullName.trim() || !email.trim()}
            className="w-full rounded-xl bg-amber-500 text-slate-900 font-bold py-4 text-base hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            {submitting ? 'Sending…' : 'Submit Application'}
          </button>
        </form>
      </main>
    </div>
  )
}
