import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Zap, ChevronRight, X, Loader2 } from 'lucide-react'
import { supabase } from '../supabase'
import { getDistanceMilesFromApi, DEFAULT_JOB_POSTCODE } from '../utils/commuteUtils'

function EligibilityModal({ job, isOpen, onClose, onEligible }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [rightToWork, setRightToWork] = useState(null)
  const [availableForShift, setAvailableForShift] = useState(null)
  const [postcode, setPostcode] = useState('')
  const [showLongCommuteConfirm, setShowLongCommuteConfirm] = useState(false)
  const [distanceMiles, setDistanceMiles] = useState(null)
  const [distanceLoading, setDistanceLoading] = useState(false)

  const jobPostcode = (job && job.location_postcode) ? job.location_postcode : DEFAULT_JOB_POSTCODE
  const shiftLabel = job?.shift_type || 'immediate start'
  const canProceedStep2 = rightToWork === true
  const canProceedStep3 = availableForShift === true
  const canSubmit = postcode.trim().length >= 2
  const isLongCommute = distanceMiles != null && distanceMiles > 15

  useEffect(() => {
    if (step !== 3 || postcode.trim().length < 5) {
      setDistanceMiles(null)
      return
    }
    let cancelled = false
    setDistanceLoading(true)
    setDistanceMiles(null)
    getDistanceMilesFromApi(postcode.trim(), jobPostcode).then((miles) => {
      if (!cancelled) {
        setDistanceMiles(miles != null ? Math.round(miles * 10) / 10 : null)
        setDistanceLoading(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setDistanceMiles(null)
        setDistanceLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [step, postcode.trim(), jobPostcode])

  const handleClose = () => {
    setStep(1)
    setRightToWork(null)
    setAvailableForShift(null)
    setPostcode('')
    setShowLongCommuteConfirm(false)
    onClose()
  }

  const proceedToApply = () => {
    if (!job?.id) return
    onEligible?.({ rightToWork, availableForShift, postcode: postcode.trim() })
    handleClose()
    navigate(`/jobs/${job.id}/apply`, { state: { postcode: postcode.trim(), job } })
  }

  const handleSubmit = () => {
    if (!canSubmit || !job?.id) return
    if (isLongCommute && !showLongCommuteConfirm) {
      setShowLongCommuteConfirm(true)
      return
    }
    proceedToApply()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} aria-hidden />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 px-4 py-3 bg-slate-900 z-10">
          <h3 className="text-lg font-bold text-white">Check eligibility</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {step === 1 && (
            <>
              <p className="text-white font-semibold">
                Do you have the right to work in the UK?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRightToWork(true)}
                  className={`flex-1 py-3.5 rounded-xl font-semibold transition ${
                    rightToWork === true
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setRightToWork(false)}
                  className={`flex-1 py-3.5 rounded-xl font-semibold transition ${
                    rightToWork === false
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  No
                </button>
              </div>
              <button
                type="button"
                onClick={() => canProceedStep2 && setStep(2)}
                disabled={!canProceedStep2}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 text-slate-900 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 transition"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-white font-semibold">
                Are you available for {shiftLabel}?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAvailableForShift(true)}
                  className={`flex-1 py-3.5 rounded-xl font-semibold transition ${
                    availableForShift === true
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setAvailableForShift(false)}
                  className={`flex-1 py-3.5 rounded-xl font-semibold transition ${
                    availableForShift === false
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  No
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-slate-300 font-medium hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => canProceedStep3 && setStep(3)}
                  disabled={!canProceedStep3}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 text-slate-900 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 transition"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

          {step === 3 && !showLongCommuteConfirm && (
            <>
              <p className="text-white font-semibold">What&apos;s your postcode?</p>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/gi, '').slice(0, 8))}
                placeholder="e.g. SW1A 1AA"
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 text-lg"
                autoFocus
              />
              {distanceLoading && (
                <p className="text-slate-400 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking distance…
                </p>
              )}
              {!distanceLoading && distanceMiles != null && !isLongCommute && (
                <p className="text-slate-400 text-sm">
                  About {distanceMiles} mile{distanceMiles !== 1 ? 's' : ''} from the job location.
                </p>
              )}
              {!distanceLoading && distanceMiles != null && isLongCommute && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-3">
                  <p className="text-amber-400 font-semibold text-sm">Commute Alert</p>
                  <p className="text-slate-300 text-sm mt-0.5">
                    This job is {distanceMiles} miles away. Have you considered the travel time for a 6 AM start?
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-slate-300 font-medium hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 py-3.5 rounded-xl bg-amber-500 text-slate-900 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 transition"
                >
                  Continue to apply
                </button>
              </div>
            </>
          )}

          {step === 3 && showLongCommuteConfirm && (
            <>
              <p className="text-amber-400 font-semibold">
                Commute Alert
              </p>
              <p className="text-slate-400 text-sm">
                This job is {distanceMiles} miles away. Have you considered the travel time for a 6 AM start? You can still apply if you&apos;re happy to travel.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLongCommuteConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-slate-300 font-medium hover:bg-white/5"
                >
                  Change postcode
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-3.5 rounded-xl bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition"
                >
                  Yes, continue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JobBoard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [eligibilityJob, setEligibilityJob] = useState(null)

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await supabase
          .from('jobs')
          .select('id, title, location, is_active')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setJobs(data ?? [])
      } catch (err) {
        console.error('Jobs fetch error:', err)
        setError(err.message ?? 'Failed to load jobs.')
        setJobs([])
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm font-medium">Loading roles…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6 text-center">
        <p className="text-red-400 font-semibold">{error}</p>
        <p className="text-slate-400 text-sm mt-1">Check that the &quot;jobs&quot; table exists and has active roles.</p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-800/30 p-8 text-center">
        <p className="text-white font-semibold">No roles right now</p>
        <p className="text-slate-400 text-sm mt-1">Check back soon for new opportunities.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="group relative rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-800/50 backdrop-blur-sm overflow-hidden hover:border-amber-500/30 hover:bg-slate-800/70 transition-all duration-200"
          >
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <Zap className="w-3.5 h-3.5" /> Immediate Start
              </span>
            </div>
            <div className="p-5 sm:p-6 flex flex-col min-h-[200px]">
              <h2 className="text-xl sm:text-2xl font-bold text-white pr-24 sm:pr-28 leading-tight mt-1">
                {job.title || 'Role'}
              </h2>
              {job.location && (
                <p className="flex items-center gap-2 text-slate-400 text-sm sm:text-base mt-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {job.location}
                </p>
              )}
              <div className="mt-auto pt-5">
                <button
                  type="button"
                  onClick={() => setEligibilityJob(job)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-slate-900 font-bold py-3.5 sm:py-4 text-sm sm:text-base hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
                >
                  Check Eligibility
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <EligibilityModal
        job={eligibilityJob}
        isOpen={!!eligibilityJob}
        onClose={() => setEligibilityJob(null)}
        onEligible={() => setEligibilityJob(null)}
      />
    </>
  )
}
