import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabase'

type InterestCheckContext = {
  full_name: string
  job_title: string
  company_name: string
}

export default function ConfirmInterest() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t')

  const [context, setContext] = useState<InterestCheckContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [invalidLink, setInvalidLink] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!id || !token) {
      setInvalidLink(true)
      setLoading(false)
      return
    }
    let cancelled = false
    async function fetchContext() {
      setLoading(true)
      setInvalidLink(false)
      try {
        const { data, error } = await supabase.rpc('get_interest_check_context', {
          p_application_id: id,
          p_token: token,
        })
        if (cancelled) return
        if (error) throw error
        const row = Array.isArray(data) ? data[0] : data
        if (!row?.full_name) setInvalidLink(true)
        else setContext(row as InterestCheckContext)
      } catch {
        if (!cancelled) setInvalidLink(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchContext()
    return () => { cancelled = true }
  }, [id, token])

  async function handleResponse(interestStatus: 'confirmed' | 'withdrawn') {
    if (!id || !token) return
    setSubmitting(true)
    try {
      const { error } = await supabase.rpc('update_application_interest_check', {
        p_interest_check_token: token,
        p_application_id: id,
        p_interest_status: interestStatus,
      })
      if (error) throw error
      setSuccess(true)
    } catch {
      setInvalidLink(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" aria-hidden />
        <p className="text-slate-400 mt-4 font-medium">Loading…</p>
      </div>
    )
  }

  if (invalidLink) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-300 font-medium">This link is invalid or has expired.</p>
        <p className="text-slate-500 text-sm mt-2">If you have questions, please contact the recruiter directly.</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" aria-hidden />
        <h1 className="text-2xl font-bold mb-2">Thank you</h1>
        <p className="text-slate-400 max-w-sm">
          Your response has been recorded. The recruiter will be in touch if appropriate.
        </p>
      </div>
    )
  }

  if (!context) return null

  const { full_name, company_name, job_title } = context

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold text-white text-center leading-snug mb-6">
          Hi {full_name}, {company_name} is interested in your application for {job_title}. Are you still available?
        </h1>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleResponse('confirmed')}
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 text-white font-semibold py-4 text-base hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                Sending…
              </span>
            ) : (
              "Yes, I'm interested"
            )}
          </button>
          <button
            type="button"
            onClick={() => handleResponse('withdrawn')}
            disabled={submitting}
            className="w-full rounded-xl border border-slate-500 bg-transparent text-slate-300 font-semibold py-4 text-base hover:bg-slate-800/50 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            No, I'm no longer looking
          </button>
        </div>
      </div>
    </div>
  )
}
