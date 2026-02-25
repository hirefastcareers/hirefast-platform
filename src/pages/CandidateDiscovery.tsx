import { useEffect, useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Eye, MapPin, Loader2, Briefcase } from 'lucide-react'
import { useEmployer } from '../contexts/EmployerContext'
import { supabase } from '../supabase'
import { TICKET_OPTIONS } from '../constants/skills'
import { Badge, RTWBadge, CommuteBadge } from '../components/ui/badge'
import CandidateQuickViewPanel from '../components/discovery/CandidateQuickViewPanel'
import DiscoveryListSkeleton from '../components/discovery/DiscoveryListSkeleton'

const SECTORS = [
  { id: '', label: 'All sectors' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'retail', label: 'Retail' },
] as const

const RADIUS_OPTIONS = [
  { value: 0, label: 'Any distance' },
  { value: 5, label: 'Within 5 miles' },
  { value: 10, label: 'Within 10 miles' },
  { value: 15, label: 'Within 15 miles' },
  { value: 20, label: 'Within 20 miles' },
  { value: 30, label: 'Within 30 miles' },
  { value: 50, label: 'Within 50 miles' },
] as const

type JobOption = {
  id: string
  title: string
  location: string | null
}

type ApplicationRow = {
  id: string
  job_id: string
  full_name: string
  email: string
  phone: string | null
  commute_distance: number | null
  commute_risk_level: string | null
  match_score: number | null
  status: string
  created_at: string
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

function getTruthLevel(
  matchScore: number | null,
  hasRtw: boolean | null | undefined,
  commuteRisk: string | null
): 'green' | 'amber' | 'red' {
  if (hasRtw === false) return 'red'
  const score = matchScore != null ? Math.round(Number(matchScore)) : null
  if (score != null) {
    if (score > 80) return 'green'
    if (score >= 50) return 'amber'
    return 'red'
  }
  if (commuteRisk === 'green') return 'green'
  if (commuteRisk === 'amber') return 'amber'
  return 'red'
}

function getTruthLabel(level: 'green' | 'amber' | 'red'): string {
  if (level === 'green') return 'High match'
  if (level === 'amber') return 'Medium match'
  return 'Low match'
}

export default function CandidateDiscovery() {
  const { selectedEmployerId: employerId, loading: contextLoading } = useEmployer()
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [radiusMiles, setRadiusMiles] = useState(0)
  const [sector, setSector] = useState('')
  const [skillsFilter, setSkillsFilter] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [quickViewApp, setQuickViewApp] = useState<ApplicationRow | null>(null)

  // Fetch jobs assigned to this employer (recruiter sees only jobs they have access to via RLS)
  useEffect(() => {
    if (!employerId) return
    let cancelled = false
    setJobsLoading(true)
    setJobs([])
    async function fetchJobs() {
      try {
        const { data, error: err } = await supabase
          .from('jobs')
          .select('id, title, location')
          .eq('employer_id', employerId)
          .eq('is_active', true)
          .order('title')
        if (cancelled) return
        if (err) throw err
        setJobs((data as JobOption[]) ?? [])
      } catch {
        if (!cancelled) setJobs([])
      } finally {
        if (!cancelled) setJobsLoading(false)
      }
    }
    fetchJobs()
    return () => { cancelled = true }
  }, [employerId])

  useEffect(() => {
    if (!employerId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    async function fetchApplications() {
      try {
        const select = `
          id, job_id, full_name, email, phone, commute_distance, commute_risk_level, match_score, status, created_at,
          has_rtw, candidate_postcode, candidate_skills, cv_url, cv_text, interest_check_sent_at, interest_status,
          jobs!inner(title, sector, required_skills, is_active),
          employers(company_name)
        `
        const { data, error: err } = await supabase
          .from('applications')
          .select(select)
          .eq('employer_id', employerId)
          .eq('jobs.is_active', true)
          .order('match_score', { ascending: false, nullsFirst: false })
        if (cancelled) return
        if (err) throw err
        setApplications((data as ApplicationRow[]) ?? [])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load candidates.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchApplications()
    return () => { cancelled = true }
  }, [employerId])

  const filtered = useMemo(() => {
    let list = applications
    if (selectedJobId) {
      list = list.filter((a) => a.job_id === selectedJobId)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q)
      )
    }
    if (radiusMiles > 0) {
      list = list.filter(
        (a) => a.commute_distance != null && Number(a.commute_distance) <= radiusMiles
      )
    }
    if (sector) {
      list = list.filter(
        (a) => (a.jobs?.sector ?? '').toLowerCase() === sector.toLowerCase()
      )
    }
    if (skillsFilter.length > 0) {
      const set = new Set(skillsFilter.map((s) => s.toLowerCase()))
      list = list.filter((a) => {
        const jobSkills = (a.jobs?.required_skills ?? []) as string[]
        const candSkills = (a.candidate_skills ?? []) as string[]
        return jobSkills.some((r) => set.has(r.toLowerCase())) ||
          candSkills.some((c) => set.has(String(c).toLowerCase()))
      })
    }
    return list
  }, [applications, selectedJobId, search, radiusMiles, sector, skillsFilter])

  const toggleSkill = (skill: string) => {
    setSkillsFilter((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  if (contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
        <p className="text-slate-600 font-medium">Loading…</p>
      </div>
    )
  }

  if (!employerId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600 font-medium">Select a company to discover candidates.</p>
      </div>
    )
  }

  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) : null

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Discovery</h1>
        <p className="text-slate-500 text-sm mt-1">
          Search and filter applications. Truth Score = proximity + RTW for the selected role.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label htmlFor="discovery-job-select" className="block text-sm font-semibold text-slate-700 mb-2">
          Recruiting for
        </label>
        <select
          id="discovery-job-select"
          value={selectedJobId ?? ''}
          onChange={(e) => setSelectedJobId(e.target.value || null)}
          disabled={jobsLoading}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-60"
        >
          <option value="">All roles</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
              {job.location ? ` — ${job.location}` : ''}
            </option>
          ))}
        </select>
        {jobsLoading && (
          <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading your jobs…
          </p>
        )}
        {selectedJob && (
          <p className="text-slate-600 text-sm mt-2 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-slate-400" />
            Truth Score and commute are for this role.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold transition ${
            showFilters
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Radius (miles)</label>
              <select
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {RADIUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {SECTORS.map(({ id, label }) => (
                  <option key={id || 'all'} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Skills / tickets</label>
            <div className="flex flex-wrap gap-2">
              {TICKET_OPTIONS.map((ticket) => (
                <button
                  key={ticket}
                  type="button"
                  onClick={() => toggleSkill(ticket)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    skillsFilter.includes(ticket)
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {ticket}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <DiscoveryListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600 font-medium">No candidates match your filters.</p>
          <p className="text-slate-500 text-sm mt-1">Try widening search or filters.</p>
        </div>
      ) : (
        <ul className="space-y-4" role="list">
          {filtered.map((app) => {
            const showRoleContext = !!selectedJobId
            const risk = (app.commute_risk_level as 'green' | 'amber' | 'red') || null
            const truthLevel = getTruthLevel(
              app.match_score,
              app.has_rtw,
              app.commute_risk_level
            )
            const truthLabel = getTruthLabel(truthLevel)
            const miles = app.commute_distance != null ? Number(app.commute_distance) : null

            return (
              <li key={app.id}>
                <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {showRoleContext && (
                          <>
                            <Badge variant={truthLevel}>{truthLabel}</Badge>
                            {risk && <CommuteBadge risk={risk} />}
                          </>
                        )}
                        <RTWBadge hasRtw={app.has_rtw === true} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 truncate">
                        {app.full_name ?? '—'}
                      </h3>
                      <p className="text-slate-500 text-sm truncate">{app.email}</p>
                      {app.jobs?.title && (
                        <p className="text-slate-600 text-sm mt-1">Applied: {app.jobs.title}</p>
                      )}
                      {showRoleContext && miles != null && (
                        <p className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                          <MapPin className="w-4 h-4 shrink-0" />
                          {miles} miles
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuickViewApp(app)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white font-semibold px-4 py-3 hover:bg-blue-700 transition"
                      >
                        <Eye className="w-4 h-4" />
                        Quick View
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      <CandidateQuickViewPanel
        application={quickViewApp}
        activeJobRequiredSkills={
          selectedJobId
            ? (applications.find((a) => a.job_id === selectedJobId)?.jobs?.required_skills ?? []) as string[]
            : []
        }
        onClose={() => setQuickViewApp(null)}
        onInterestCheckSent={(appId) => {
          setApplications((prev) =>
            prev.map((a) => {
              if (a.id !== appId) return a
              return {
                ...a,
                interest_status: 'pending',
                interest_check_sent_at: new Date().toISOString(),
              }
            })
          )
        }}
      />
    </div>
  )
}
