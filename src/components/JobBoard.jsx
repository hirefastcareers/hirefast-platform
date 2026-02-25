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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} aria-hidden />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-900">Check eligibility</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {step === 1 && (
            <>
              <p className="text-slate-900 font-semibold">
                Do you have the right to work in the UK?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRightToWork(true)}
                  className={`flex-1 py-3.5 rounded-xl font-semibold transition ${
                    rightToWork === true
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setRightToWork(false)}
                  className={`flex-1 py-3.5 rounded-xl font-semibold transition ${
                    rightToWork === false
                      ? 'bg-slate-200 text-slate-900 border-2 border-slate-900'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  No
                </button>
              </div>
              <button
                type="button"
                onClick={() => canProceedStep2 && setStep(2)}
                disabled={!canProceedStep2}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-slate-900 font-semibold">
                Are you available for {shiftLabel}?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAvailableForShift(true)}
                  className={`flex-1 py-3.5 rounded-xl font-semibold transition ${
                    availableForShift === true
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setAvailableForShift(false)}
                  className={`flex-1 py-3.5 rounded-xl font-semibold transition ${
                    availableForShift === false
                      ? 'bg-slate-200 text-slate-900 border-2 border-slate-900'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  No
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 bg-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => canProceedStep3 && setStep(3)}
                  disabled={!canProceedStep3}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

          {step === 3 && !showLongCommuteConfirm && (
            <>
              <p className="text-slate-900 font-semibold">What&apos;s your postcode?</p>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/gi, '').slice(0, 8))}
                placeholder="e.g. SW1A 1AA"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-lg"
                autoFocus
              />
              {distanceLoading && (
                <p className="text-slate-600 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking distance…
                </p>
              )}
              {!distanceLoading && distanceMiles != null && !isLongCommute && (
                <p className="text-slate-600 text-sm">
                  About {distanceMiles} mile{distanceMiles !== 1 ? 's' : ''} from the job location.
                </p>
              )}
              {!distanceLoading && distanceMiles != null && isLongCommute && (
                <div className="rounded-xl bg-slate-100 border border-slate-200 p-3">
                  <p className="text-slate-900 font-semibold text-sm">Commute alert</p>
                  <p className="text-slate-600 text-sm mt-0.5">
                    This job is {distanceMiles} miles away. Have you considered the travel time for a 6 AM start?
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 bg-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                  Continue to apply
                </button>
              </div>
            </>
          )}

          {step === 3 && showLongCommuteConfirm && (
            <>
              <p className="text-slate-900 font-semibold">
                Commute alert
              </p>
              <p className="text-slate-600 text-sm">
                This job is {distanceMiles} miles away. Have you considered the travel time for a 6 AM start? You can still apply if you&apos;re happy to travel.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLongCommuteConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 bg-white"
                >
                  Change postcode
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
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
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await supabase
          .from('jobs')
          .select('id, title, location, is_active, immediate_start')
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
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading roles…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-slate-900 font-semibold">{error}</p>
        <p className="text-slate-600 text-sm mt-1">Check that the &quot;jobs&quot; table exists and has active roles.</p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-900 font-semibold">No roles right now</p>
        <p className="text-slate-600 text-sm mt-1">Check back soon for new opportunities.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {jobs.map((job) => (
          <article
            key={job.id}
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-blue-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="p-5 sm:p-6 flex flex-col min-h-[200px]">
              {job.immediate_start && (
                <span className="inline-flex items-center gap-1 self-start rounded-full bg-blue-600/10 border border-blue-600/20 px-2.5 py-1 text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">
                  <Zap className="w-3.5 h-3.5" /> Immediate Start
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {job.title || 'Role'}
              </h2>
              {job.location && (
                <p className="flex items-center gap-2 text-slate-600 text-sm sm:text-base mt-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-slate-500" />
                  {job.location}
                </p>
              )}
              <div className="mt-auto pt-5">
                <span className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold py-3.5 sm:py-4 text-sm sm:text-base group-hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">
                  View & Apply
                  <ChevronRight className="w-5 h-5" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

    </>
  )
}
