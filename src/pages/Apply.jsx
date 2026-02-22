import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Upload, CheckCircle2, MapPin, Phone, FileCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import { supabase } from '../supabase'
import { getDistanceMilesFromApi, DEFAULT_JOB_POSTCODE } from '../utils/commuteUtils'

const BUCKET_RTW = 'rtw-documents'

function Apply() {
  const { id: jobId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const statePostcode = location.state?.postcode ?? ''
  const stateJob = location.state?.job

  const [job, setJob] = useState(stateJob || null)
  const [loadingJob, setLoadingJob] = useState(!stateJob && !!jobId)
  const [postcode, setPostcode] = useState(statePostcode)
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const [distanceMiles, setDistanceMilesState] = useState(null)
  const [distanceLoading, setDistanceLoadingState] = useState(false)
  const jobPostcode = (job && job.location_postcode) ? job.location_postcode : DEFAULT_JOB_POSTCODE
  const isLongCommute = distanceMiles != null && distanceMiles > 15
  const isImmediateStart = true

  useEffect(() => {
    if (!postcode.trim() || postcode.trim().length < 5 || !job) return
    let cancelled = false
    setDistanceLoadingState(true)
    getDistanceMilesFromApi(postcode.trim(), jobPostcode).then((miles) => {
      if (!cancelled) {
        setDistanceMilesState(miles != null ? Math.round(miles * 10) / 10 : null)
        setDistanceLoadingState(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setDistanceMilesState(null)
        setDistanceLoadingState(false)
      }
    })
    return () => { cancelled = true }
  }, [postcode.trim(), jobPostcode, job])

  const hasPostcode = postcode.trim().length >= 2
  const hasPhone = phone.trim().length >= 10
  const hasPhoto = !!photoFile || !!photoPreview
  const profileStrength = [hasPostcode, hasPhone, hasPhoto].filter(Boolean).length
  const strengthPercent = Math.round((profileStrength / 3) * 100)

  useEffect(() => {
    if (stateJob && stateJob.id === jobId) {
      setJob(stateJob)
      return
    }
    if (!jobId) return
    let cancelled = false
    async function fetchJob() {
      setLoadingJob(true)
      try {
        const { data, error: err } = await supabase
          .from('jobs')
          .select('id, title, location, employer_id')
          .eq('id', jobId)
          .single()
        if (!cancelled && err) {
          setError(err.message ?? 'Job not found.')
          setJob(null)
          return
        }
        if (!cancelled) setJob(data)
      } finally {
        if (!cancelled) setLoadingJob(false)
      }
    }
    fetchJob()
    return () => { cancelled = true }
  }, [jobId, stateJob])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (e.g. JPG, PNG).')
      return
    }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!job?.employer_id || !jobId) {
      setError('Missing job or employer.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    setSubmitting(true)
    setError(null)
    let rtwDocumentUrl = null
    let distanceMilesStored = null

    try {
      const postcodeTrimmed = postcode.trim()
      if (postcodeTrimmed.length >= 5) {
        const miles = await getDistanceMilesFromApi(postcodeTrimmed, jobPostcode)
        distanceMilesStored = miles != null ? Math.round(miles * 10) / 10 : null
      }

      if (photoFile) {
        setUploading(true)
        const ext = photoFile.name.split('.').pop() || 'jpg'
        const path = `${jobId}/${Date.now()}-rtw.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET_RTW)
          .upload(path, photoFile, { upsert: false })
        if (uploadErr) {
          console.warn('Upload failed:', uploadErr)
        } else {
          const { data: urlData } = supabase.storage.from(BUCKET_RTW).getPublicUrl(path)
          rtwDocumentUrl = urlData?.publicUrl ?? path
        }
        setUploading(false)
      }

      const { error: insertErr } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          employer_id: job.employer_id,
          full_name: fullName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          status: 'new',
          postcode: postcode.trim() || null,
          rtw_document_url: rtwDocumentUrl,
          distance_miles: distanceMilesStored
        })

      if (insertErr) throw insertErr
      setSubmitted(true)
    } catch (err) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    )
  }

  if (!job && !loadingJob) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-slate-400">Job not found.</p>
        <button
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
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Application sent</h1>
            <p className="text-slate-400 text-sm mb-6">
              The employer will be in touch if you&apos;re a match.
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="rounded-xl bg-amber-500 text-slate-900 font-bold px-6 py-3 hover:bg-amber-400 transition"
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
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <Navbar />

      <main className="relative max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
          {job?.title ?? 'Apply'}
        </h1>
        <p className="text-slate-400 text-sm mb-6">Complete your profile to apply.</p>

        {/* Profile Strength */}
        <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Profile strength</span>
            <span className="text-sm font-bold text-amber-400">{strengthPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
              style={{ width: `${strengthPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span className={hasPostcode ? 'text-emerald-400' : ''}>Postcode</span>
            <span className={hasPhone ? 'text-emerald-400' : ''}>Phone</span>
            <span className={hasPhoto ? 'text-emerald-400' : ''}>Photo</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <MapPin className="inline w-3.5 h-3.5 mr-1" /> Postcode
            </label>
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/gi, '').slice(0, 8))}
              placeholder="e.g. SW1A 1AA"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            {distanceLoading && (
              <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking distance…
              </p>
            )}
            {!distanceLoading && distanceMiles != null && (
              <p className="text-slate-400 text-xs mt-1">
                About {distanceMiles} mile{distanceMiles !== 1 ? 's' : ''} from the role.
                {isLongCommute && (
                  <span className="text-amber-400 block mt-0.5">Long commute—employers may consider travel.</span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <Phone className="inline w-3.5 h-3.5 mr-1" /> Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\s-]/g, '').slice(0, 20))}
              placeholder="e.g. 07XXX XXXXXX"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>

          {isImmediateStart && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                <FileCheck className="inline w-3.5 h-3.5 mr-1" /> Right to Work or relevant licence
              </label>
              <p className="text-slate-500 text-xs mb-2">
                Upload a photo of your Right to Work document or relevant licence (e.g. forklift, HGV).
              </p>
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-slate-800/50 p-6 cursor-pointer hover:border-amber-400/40 hover:bg-slate-800/80 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                {photoPreview ? (
                  <div className="space-y-2">
                    <img src={photoPreview} alt="Preview" className="max-h-24 rounded-lg object-cover mx-auto" />
                    <span className="text-emerald-400 text-sm font-medium">Photo added</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-500 mb-2" />
                    <span className="text-slate-400 text-sm">Tap to upload photo</span>
                  </>
                )}
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-slate-900 font-bold py-4 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition"
          >
            {uploading ? (
              <>Uploading…</>
            ) : submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
            ) : (
              <>Submit application</>
            )}
          </button>
        </form>
      </main>
    </div>
  )
}

export default Apply
