import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Briefcase, Loader2, ChevronLeft } from 'lucide-react'
import Navbar from '../components/Navbar'
import ExpressApplyDrawer from '../components/apply/ExpressApplyDrawer'
import { supabase } from '../supabase'

type JobDetailData = {
  id: string
  employer_id: string
  title: string
  location: string | null
  pay_rate: string | null
  description_template: string | null
  sector: string | null
  employers: { company_name: string } | null
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobDetailData | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)
    async function fetchJob() {
      try {
        const { data, err } = await supabase
          .from('jobs')
          .select('id, employer_id, title, location, pay_rate, description_template, sector, employers(company_name)')
          .eq('id', id)
          .eq('is_active', true)
          .single()
        if (cancelled) return
        if (err) {
          setError(err.message ?? 'Job not found.')
          setJob(null)
          return
        }
        setJob(data as JobDetailData)
      } catch {
        if (!cancelled) setError('Something went wrong.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchJob()
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" aria-hidden />
        <p className="text-slate-400 mt-4 font-medium">Loading role…</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-slate-400">{error ?? 'Job not found.'}</p>
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

  const companyName = job.employers?.company_name ?? 'Company'

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      <Navbar />

      <main className="relative max-w-lg mx-auto px-4 pt-4 pb-32">
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 touch-manipulation"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to roles
        </button>

        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
            {job.title}
          </h1>
          <p className="text-slate-400 mt-1">{companyName}</p>
          {job.pay_rate && (
            <p className="text-amber-400 font-semibold mt-2">{job.pay_rate}</p>
          )}
          {job.location && (
            <p className="flex items-center gap-2 text-slate-300 text-sm mt-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {job.location}
            </p>
          )}
        </header>

        {job.description_template && (
          <section className="rounded-2xl border border-white/10 bg-slate-800/50 p-5 mb-8">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              About the role
            </h2>
            <p className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap">
              {job.description_template}
            </p>
          </section>
        )}

        <div className="fixed bottom-20 left-0 right-0 p-4 pb-safe max-w-lg mx-auto bg-slate-950/95 backdrop-blur border-t border-white/5 z-40">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-slate-900 font-bold py-4 text-lg hover:bg-amber-400 active:scale-[0.98] transition shadow-lg shadow-amber-500/20 touch-manipulation"
          >
            <Briefcase className="w-5 h-5" />
            Apply now — 15 seconds
          </button>
        </div>
      </main>

      <ExpressApplyDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        job={{
          id: job.id,
          employer_id: job.employer_id,
          title: job.title,
          location: job.location,
          sector: job.sector,
        }}
        onSuccess={() => {
          setDrawerOpen(false)
          navigate('/apply/success', { state: { jobTitle: job.title, companyName }, replace: true })
        }}
      />
    </div>
  )
}
