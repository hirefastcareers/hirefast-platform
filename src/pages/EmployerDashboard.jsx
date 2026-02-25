import { useState, useEffect } from 'react'
import { Users, UserPlus, MessageCircle, Eye, Loader2 } from 'lucide-react'
import { supabase } from '../supabase'

/** Build WhatsApp URL: wa.me/44...?text=... */
function whatsAppUrl(phone, name, jobTitle) {
  if (!phone || !name) return null
  const digits = String(phone).replace(/\D/g, '')
  const waNumber = digits.startsWith('44') ? digits : digits.startsWith('0') ? '44' + digits.slice(1) : '44' + digits
  const text = `Hi ${name}, I'm reviewing your application for ${jobTitle} on HireFast. Do you have a moment to chat?`
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`
}
import ApplicantQuickView from '../components/employer/ApplicantQuickView'
import { getTrustScore, trustScoreStyles } from '../utils/trustScore'
import { getCommuteRiskLevel } from '../utils/commuteUtils'

const statusStyles = {
  pending: 'bg-slate-100 text-slate-700 border border-slate-300',
  new: 'bg-slate-100 text-slate-700 border border-slate-300',
  shortlisted: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  interviewing: 'bg-amber-100 text-amber-800 border border-amber-300',
  offered: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  rejected: 'bg-red-100 text-red-700 border border-red-300'
}

function EmployerDashboard() {
  const [employer, setEmployer] = useState(null)
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quickViewApp, setQuickViewApp] = useState(null)
  const [recruiterName, setRecruiterName] = useState('the hiring team')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Please sign in to view your dashboard.')
          setEmployer(null)
          setApplications([])
          setJobs([])
          return
        }

        // Get employer(s) linked to this user (recruiter_employers or from jobs they created)
        const { data: reRows } = await supabase
          .from('recruiter_employers')
          .select('employer_id')
          .eq('user_id', user.id)
        const { data: jobRows } = await supabase
          .from('jobs')
          .select('employer_id')
          .eq('recruiter_id', user.id)
        const employerIds = [
          ...(reRows ?? []).map((r) => r.employer_id),
          ...(jobRows ?? []).map((j) => j.employer_id)
        ].filter(Boolean)
        const uniqueIds = [...new Set(employerIds)]
        const employerId = uniqueIds[0]

        if (!employerId) {
          setError('No employer linked to your account yet. Use the Recruiter dashboard to create jobs and seed test data.')
          setEmployer(null)
          setApplications([])
          setJobs([])
          return
        }

        const { data: employerData, error: empErr } = await supabase
          .from('employers')
          .select('id, company_name, admin_email')
          .eq('id', employerId)
          .single()

        if (empErr || !employerData) {
          setError('Employer not found.')
          setEmployer(null)
          setApplications([])
          setJobs([])
          return
        }

        setEmployer(employerData)
        setRecruiterName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'the hiring team')

        const { data: jobsData, error: jobsErr } = await supabase
          .from('jobs')
          .select('id, title, location, required_skills')
          .eq('employer_id', employerData.id)

        if (!jobsErr) setJobs(jobsData ?? [])

        const { data: appsData, error: appsErr } = await supabase
          .from('applications')
          .select('*')
          .eq('employer_id', employerData.id)
          .order('created_at', { ascending: false })

        if (appsErr) throw appsErr
        setApplications(appsData ?? [])
      } catch (err) {
        console.error(err)
        setError(err.message ?? 'Failed to load dashboard data.')
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const today = new Date().toDateString()
  const newToday = applications.filter(
    (a) => a.created_at && new Date(a.created_at).toDateString() === today
  ).length
  const interviewing = applications.filter(
    (a) => (a.status || '').toLowerCase() === 'interviewing'
  ).length

  const applicationWithJob = (app) => {
    const job = jobs.find((j) => j.id === app.job_id)
    return { ...app, job }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-slate-500">
        <Loader2 className="animate-spin" size={24} />
        <span className="font-medium">Loading dashboard…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="font-semibold">{error}</p>
        <p className="text-sm mt-2">
          To add test data: go to <a href="/dashboard/recruiter" className="font-medium underline">Recruiter dashboard</a>, select your employer in the dropdown, open &quot;Dev: Seed test data&quot;, and click &quot;Seed test data&quot;. Then refresh this page.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {employer?.company_name ?? 'Dashboard'}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Applicants and activity</p>
      </div>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2.5">
              <Users className="text-slate-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total applicants</p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">+12% from last week</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2.5">
              <UserPlus className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{newToday}</p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">New today</p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">+5% vs last week</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <MessageCircle className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{interviewing}</p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Interviewing</p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">{interviewing > 0 ? `${interviewing} in pipeline` : 'Active pipeline'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table (desktop) */}
      <div className="hidden lg:block rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Applications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Commute</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tickets</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trust</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr className="text-sm">
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No applications yet.
                  </td>
                </tr>
              ) : (
                applications.map((app, idx) => {
                  const job = jobs.find((j) => j.id === app.job_id)
                  const jobTitle = job?.title || 'this role'
                  const status = (app.status || 'pending').toLowerCase()
                  const statusClass = statusStyles[status] ?? statusStyles.pending
                  const trust = getTrustScore(app, job)
                  const commuteRisk = app.commute_risk_level || getCommuteRiskLevel(app.commute_distance)
                  const commuteMiles = app.commute_distance != null ? Number(app.commute_distance) : null
                  const commuteColor = commuteRisk === 'green' ? 'text-emerald-600 font-medium' : commuteRisk === 'amber' ? 'text-amber-600 font-medium' : commuteRisk === 'red' ? 'text-red-600 font-medium' : 'text-slate-400'
                  const waUrl = whatsAppUrl(app.phone, app.full_name, jobTitle)
                  const tickets = (app.candidate_skills || []).filter(Boolean)
                  const applied = app.created_at
                    ? new Date(app.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '—'
                  return (
                    <tr
                      key={app.id}
                      className={`text-sm border-b border-slate-100 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-slate-100/80`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">{app.full_name ?? '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {commuteMiles != null ? (
                          <span className={commuteColor} title={commuteRisk ? `Risk: ${commuteRisk}` : ''}>
                            {commuteMiles.toFixed(1)} miles
                          </span>
                        ) : commuteRisk ? (
                          <span title="Commute risk">
                            {commuteRisk === 'green' && <span className="text-emerald-600 text-lg" aria-label="Low">🟢</span>}
                            {commuteRisk === 'amber' && <span className="text-amber-600 text-lg" aria-label="Medium">🟡</span>}
                            {commuteRisk === 'red' && <span className="text-red-600 text-lg" aria-label="High">🔴</span>}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="truncate max-w-[220px] inline-block align-bottom" title={app.email ?? ''}>{app.email ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        {tickets.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {tickets.map((t) => (
                              <span key={t} className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 border border-gray-200">
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${trustScoreStyles[trust.level]}`} title={trust.reason || trust.label}>
                          {trust.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize whitespace-nowrap ${statusClass}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{applied}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 p-2 text-green-700 hover:bg-slate-100 transition"
                              title="Open WhatsApp"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h.004c3.381 0 6.131-2.75 6.135-6.135a6.107 6.107 0 0 0-1.675-4.226 6.18 6.18 0 0 0-4.46-1.804 6.131 6.131 0 0 0-6.129 6.133c0 1.444.465 2.844 1.341 4.002L6.2 19.692l1.599-.428a6.09 6.09 0 0 0 3.252.939M12 2C6.477 2 2 6.477 2 12c0 2.125.659 4.105 1.804 5.662L2 22l4.418-1.177A9.94 9.94 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2" />
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={() => setQuickViewApp(applicationWithJob(app))}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Eye size={16} /> Quick view
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-4 mt-6">
        <h2 className="font-semibold text-slate-900">Applications</h2>
        {applications.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No applications yet.</p>
        ) : (
          applications.map((app) => {
            const job = jobs.find((j) => j.id === app.job_id)
            const jobTitle = job?.title || 'this role'
            const status = (app.status || 'pending').toLowerCase()
            const statusClass = statusStyles[status] ?? statusStyles.pending
            const trust = getTrustScore(app, job)
            const commuteRisk = app.commute_risk_level || getCommuteRiskLevel(app.commute_distance)
            const commuteMiles = app.commute_distance != null ? Number(app.commute_distance) : null
            const commuteColor = commuteRisk === 'green' ? 'text-emerald-600' : commuteRisk === 'amber' ? 'text-amber-600' : commuteRisk === 'red' ? 'text-red-600' : ''
            const waUrl = whatsAppUrl(app.phone, app.full_name, jobTitle)
            const tickets = (app.candidate_skills || []).filter(Boolean)
            const applied = app.created_at
              ? new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'
            return (
              <div
                key={app.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    {commuteMiles != null && <span className={`text-sm font-medium ${commuteColor}`}>{commuteMiles.toFixed(1)} mi</span>}
                    {commuteRisk && commuteMiles == null && (
                      <span className="text-lg" title="Commute">
                        {commuteRisk === 'green' && '🟢'}
                        {commuteRisk === 'amber' && '🟡'}
                        {commuteRisk === 'red' && '🔴'}
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{app.full_name ?? '—'}</p>
                      <p className="text-sm text-slate-600">{app.email ?? '—'}</p>
                      <p className="text-xs text-slate-500 mt-1">{applied}</p>
                      {tickets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tickets.map((t) => (
                            <span key={t} className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700 border border-gray-200">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${trustScoreStyles[trust.level]}`}>
                      {trust.label}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}>
                      {status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 py-2 text-sm font-medium text-green-700 hover:bg-slate-100 transition"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h.004c3.381 0 6.131-2.75 6.135-6.135a6.107 6.107 0 0 0-1.675-4.226 6.18 6.18 0 0 0-4.46-1.804 6.131 6.131 0 0 0-6.129 6.133c0 1.444.465 2.844 1.341 4.002L6.2 19.692l1.599-.428a6.09 6.09 0 0 0 3.252.939M12 2C6.477 2 2 6.477 2 12c0 2.125.659 4.105 1.804 5.662L2 22l4.418-1.177A9.94 9.94 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2" /></svg>
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => setQuickViewApp(applicationWithJob(app))}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Eye size={16} /> Quick view
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {quickViewApp && (
        <ApplicantQuickView
          application={quickViewApp}
          onClose={() => setQuickViewApp(null)}
        />
      )}
    </div>
  )
}

export default EmployerDashboard
