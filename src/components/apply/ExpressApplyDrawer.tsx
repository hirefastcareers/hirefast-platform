import { useState, useCallback } from 'react'
import { X, Loader2, MapPin } from 'lucide-react'
import { Sheet, SheetHeader, SheetContent } from '../ui/sheet'
import { supabase } from '../../supabase'
import { getCommuteDistanceAndRisk, type CommuteRiskLevel } from '../../utils/commute'

/** Match score from Truth Engine (commute only): green 100, amber 85, red 50. */
function matchScoreFromRisk(risk: CommuteRiskLevel | null): number | null {
  if (!risk) return null
  if (risk === 'green') return 100
  if (risk === 'amber') return 85
  return 50
}

type JobForApply = {
  id: string
  employer_id: string
  title: string
  location: string | null
  sector?: string | null
}

type ExpressApplyDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: JobForApply | null
  onSuccess: () => void
}

export default function ExpressApplyDrawer({
  open,
  onOpenChange,
  job,
  onSuccess,
}: ExpressApplyDrawerProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [postcode, setPostcode] = useState('')
  const [commuteMiles, setCommuteMiles] = useState<number | null>(null)
  const [commuteRisk, setCommuteRisk] = useState<CommuteRiskLevel | null>(null)
  const [commuteLoading, setCommuteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const jobPostcode = (job?.location ?? '').trim()

  const calculateCommute = useCallback(async () => {
    const candidatePostcode = postcode.trim()
    if (!candidatePostcode || !jobPostcode) {
      setCommuteMiles(null)
      setCommuteRisk(null)
      return
    }
    setCommuteLoading(true)
    setError(null)
    try {
      const result = await getCommuteDistanceAndRisk(
        candidatePostcode,
        jobPostcode,
        job?.sector ?? undefined
      )
      setCommuteMiles(result.commute_distance_miles ?? null)
      setCommuteRisk(result.commute_risk_level ?? null)
    } catch {
      setCommuteMiles(null)
      setCommuteRisk(null)
      setError('We couldn’t validate that postcode. Try again or leave blank.')
    } finally {
      setCommuteLoading(false)
    }
  }, [postcode.trim(), jobPostcode, job?.sector])

  const handlePostcodeBlur = () => {
    if (postcode.trim().length >= 4 && jobPostcode) calculateCommute()
  }

  const badge = commuteRisk
    ? commuteRisk === 'green'
      ? { label: 'Short commute', dot: '🟢', bg: 'bg-emerald-500/15', border: 'border-emerald-400/40', text: 'text-emerald-300' }
      : commuteRisk === 'amber'
        ? { label: 'Medium commute', dot: '🟡', bg: 'bg-amber-500/15', border: 'border-amber-400/40', text: 'text-amber-300' }
        : { label: 'Long commute', dot: '🔴', bg: 'bg-red-500/15', border: 'border-red-400/40', text: 'text-red-300' }
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!job) return
    setSubmitting(true)
    setError(null)
    try {
      const candidatePostcode = postcode.trim()
      let distance = commuteMiles
      let risk = commuteRisk
      if (candidatePostcode && jobPostcode && (distance == null || risk == null)) {
        const result = await getCommuteDistanceAndRisk(
          candidatePostcode,
          jobPostcode,
          job.sector ?? undefined
        )
        distance = result.commute_distance_miles ?? null
        risk = result.commute_risk_level ?? null
      }
      const match = matchScoreFromRisk(risk ?? null)

      const payload = {
        job_id: job.id,
        employer_id: job.employer_id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        candidate_postcode: candidatePostcode || null,
        commute_distance: distance,
        commute_risk_level: risk,
        match_score: match,
        status: 'pending',
        has_rtw: null,
      }

      const { error: insertErr } = await supabase.from('applications').insert(payload)
      if (insertErr) {
        if ((insertErr as { code?: string }).code === '23505') {
          setError("You've already applied to this role.")
          return
        }
        throw insertErr
      }

      const redirectTo = `${window.location.origin}/apply/success?job=${job.id}`
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      })
      if (otpErr) {
        setError(otpErr.message ?? 'Application saved. We couldn’t send the confirmation link.')
        return
      }
      setMagicLinkSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    onOpenChange(false)
    setFullName('')
    setEmail('')
    setPhone('')
    setPostcode('')
    setCommuteMiles(null)
    setCommuteRisk(null)
    setError(null)
    setMagicLinkSent(false)
  }

  if (!job) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <h2 className="text-lg font-bold text-white">Express Apply</h2>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </SheetHeader>
      <SheetContent>
        {magicLinkSent ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-emerald-400 font-semibold text-lg">Application received</p>
            <p className="text-slate-300 text-sm">
              We’ve sent a magic link to <strong className="text-white">{email}</strong>. Click it to confirm your application—no password needed.
            </p>
            <button
              type="button"
              onClick={() => {
                handleClose()
                onSuccess()
              }}
              className="w-full rounded-xl bg-amber-500 text-slate-900 font-bold py-3.5"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pb-8">
            <p className="text-slate-400 text-sm">
              Three fields. We’ll use your postcode to show your commute match.
            </p>
            {error && (
              <div className="rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm p-3">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="express-name" className="block text-sm font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                id="express-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Smith"
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-base"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="express-email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="express-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@example.com"
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-base"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="express-phone" className="block text-sm font-medium text-slate-300 mb-1.5">
                Phone
              </label>
              <input
                id="express-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 07123 456789"
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-base"
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="express-postcode" className="block text-sm font-medium text-slate-300 mb-1.5">
                Postcode
              </label>
              <div className="flex gap-2 items-center">
                <input
                  id="express-postcode"
                  type="text"
                  value={postcode}
                  onChange={(e) => {
                    setPostcode(e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/gi, '').slice(0, 8))
                    setCommuteMiles(null)
                    setCommuteRisk(null)
                  }}
                  onBlur={handlePostcodeBlur}
                  placeholder="e.g. SW1A 1AA"
                  className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-base"
                  autoComplete="postal-code"
                />
                {jobPostcode && (
                  <button
                    type="button"
                    onClick={calculateCommute}
                    disabled={commuteLoading || postcode.trim().length < 4}
                    className="shrink-0 rounded-xl bg-slate-700 px-3 py-3.5 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    {commuteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                  </button>
                )}
              </div>
              {commuteLoading && (
                <p className="text-slate-400 text-sm mt-1.5 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Calculating distance…
                </p>
              )}
              {!commuteLoading && commuteMiles != null && badge && (
                <div className={`mt-2 rounded-xl border px-4 py-2.5 ${badge.bg} ${badge.border} ${badge.text}`}>
                  <span className="font-semibold">{badge.dot} {badge.label}</span>
                  <span className="ml-2 text-sm">About {commuteMiles} miles from job</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !fullName.trim() || !email.trim()}
              className="w-full rounded-xl bg-amber-500 text-slate-900 font-bold py-4 text-base hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none transition"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Sending…
                </span>
              ) : (
                'Submit — we’ll email you a link to confirm'
              )}
            </button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
