import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '../supabase'
import CvUploadZone, { ProcessingOverlay } from '../components/profile/CvUploadZone'
import { TICKET_OPTIONS } from '../constants/skills'

type ParsedData = {
  full_name: string | null
  phone: string | null
  email: string | null
  postcode: string | null
  candidate_skills: string[]
  has_rtw: boolean | null
  speed_summary: string | null
}

export default function CandidateProfile() {
  const [step, setStep] = useState<'upload' | 'processing' | 'verify' | 'saved'>('upload')
  const [cvText, setCvText] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [editLink, setEditLink] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedData>({
    full_name: null,
    phone: null,
    email: null,
    postcode: null,
    candidate_skills: [],
    has_rtw: null,
    speed_summary: null,
  })
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [postcode, setPostcode] = useState('')
  const [speedSummary, setSpeedSummary] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [hasRtw, setHasRtw] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [existingProfile, setExistingProfile] = useState<ParsedData & { id: string } | null>(null)

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const tokenFromUrl = urlParams?.get('t') ?? null

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
      let cancelled = false
      supabase
        .rpc('get_candidate_by_token', { p_token: tokenFromUrl })
        .then(({ data, error: err }) => {
          if (cancelled || err) return
          const row = Array.isArray(data) ? data[0] : data
          if (row) {
            setExistingProfile({
              id: row.id,
              full_name: row.full_name,
              phone: row.phone,
              email: row.email,
              postcode: row.postcode ?? null,
              candidate_skills: row.candidate_skills ?? [],
              has_rtw: row.has_rtw ?? null,
              speed_summary: row.speed_summary ?? null,
            })
            setFullName(row.full_name ?? '')
            setPhone(row.phone ?? '')
            setEmail(row.email ?? '')
            setPostcode(row.postcode ?? '')
            setSpeedSummary(row.speed_summary ?? '')
            setSkills((row.candidate_skills ?? []) as string[])
            setHasRtw(row.has_rtw ?? null)
            setStep('verify')
          }
        })
      return () => { cancelled = true }
    }
  }, [tokenFromUrl])

  const parseCv = useCallback(async (text: string) => {
    setCvText(text)
    setStep('processing')
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('parse-cv', {
        body: { cv_text: text },
      })
      if (fnErr) throw fnErr
      const result = (data ?? {}) as ParsedData
      setParsed(result)
      setFullName(result.full_name ?? '')
      setPhone(result.phone ?? '')
      setEmail(result.email ?? '')
      setPostcode(result.postcode ?? '')
      setSpeedSummary(result.speed_summary ?? '')
      setSkills(Array.isArray(result.candidate_skills) ? result.candidate_skills : [])
      setHasRtw(result.has_rtw ?? null)
      setStep('verify')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CV parsing failed. Try again or enter details manually.')
      setStep('upload')
    }
  }, [])

  const handlePasteParse = () => {
    const t = pasteText.trim()
    if (t.length < 50) {
      setError('Paste at least 50 characters from your CV.')
      return
    }
    parseCv(t)
  }

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const addFreeformSkill = (value: string) => {
    const v = value.trim()
    if (v && !skills.includes(v)) setSkills((prev) => [...prev, v])
  }

  const handleSave = async () => {
    const emailTrim = email.trim()
    if (!emailTrim) {
      setError('Email is required to save your profile.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (token && existingProfile) {
        await supabase.rpc('update_candidate_by_token', {
          p_token: token,
          p_full_name: fullName.trim() || null,
          p_phone: phone.trim() || null,
          p_candidate_skills: skills,
          p_has_rtw: hasRtw,
          p_cv_url: null,
          p_cv_text: cvText || null,
          p_postcode: postcode.trim() || null,
          p_speed_summary: speedSummary.trim() || null,
        })
      } else {
        const { data: inserted } = await supabase
          .from('candidates')
          .insert({
            email: emailTrim.toLowerCase(),
            full_name: fullName.trim() || null,
            phone: phone.trim() || null,
            postcode: postcode.trim() || null,
            candidate_skills: skills,
            has_rtw: hasRtw,
            speed_summary: speedSummary.trim() || null,
            cv_text: cvText || null,
          })
          .select('profile_token')
          .single()
        if (inserted?.profile_token) {
          setEditLink(`${typeof window !== 'undefined' ? window.location.origin : ''}/profile?t=${inserted.profile_token}`)
        }
      }
      setStep('saved')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed.'
      setError(msg.includes('duplicate') ? 'A profile with this email already exists. Use the link we sent you to edit.' : msg)
    } finally {
      setSaving(false)
    }
  }

  if (step === 'saved') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">Profile saved</h1>
          <p className="text-slate-600">
            Your Digital Passport is up to date. Recruiters can match you with roles.
          </p>
          {editLink && (
            <p className="text-slate-500 text-sm">
              Save this link to edit your profile later:{' '}
              <a href={editLink} className="text-[#0d2547] font-medium underline break-all">
                {editLink}
              </a>
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-lg mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Your Digital Passport
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Upload your CV once. We’ll fill the rest—you just verify.
          </p>
        </header>

        {step === 'upload' && (
          <div className="space-y-6">
            <CvUploadZone
              onTextReady={parseCv}
              disabled={false}
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Or paste your CV text
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste at least 50 characters from your CV…"
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f4601a]/30 focus:border-[#f4601a] resize-y"
              />
              <button
                type="button"
                onClick={handlePasteParse}
                disabled={pasteText.trim().length < 50}
                className="mt-2 w-full rounded-xl bg-[#0d2547] text-white font-semibold py-3 disabled:opacity-50"
              >
                Parse with AI
              </button>
            </div>
            {error && (
              <p className="text-amber-700 font-medium text-sm">{error}</p>
            )}
          </div>
        )}

        {step === 'processing' && (
          <ProcessingOverlay />
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <p className="text-slate-600 text-sm">
              Check the details we pulled from your CV. Edit if needed, then save.
            </p>
            {error && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Smith"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f4601a]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 07123 456789"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f4601a]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@example.com"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f4601a]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Postcode</label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g. M1 1AD (for distance matching)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f4601a]/30"
              />
            </div>
            {speedSummary && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Speed-Reader summary</p>
                <p className="text-slate-800 text-sm">{speedSummary}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Skills / tickets
              </label>
              <p className="text-slate-500 text-xs mb-2">Tap to add or remove</p>
              <div className="flex flex-wrap gap-2">
                {TICKET_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      skills.includes(skill)
                        ? 'border-[#0d2547] bg-[#0d2547] text-white'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-slate-500" />
                  <span className="font-semibold text-slate-800">Right to Work verified</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasRtw(true)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      hasRtw === true ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasRtw(false)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      hasRtw === false ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                Do you have the right to work in the UK?
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !email.trim()}
              className="w-full rounded-xl bg-[#f4601a] text-white font-bold py-4 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
