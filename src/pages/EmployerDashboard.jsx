import { useState, useEffect } from 'react'
import { Users, UserPlus, MessageCircle, Eye, Loader2 } from 'lucide-react'
import { supabase } from '../supabase'
import ApplicantQuickView from '../components/employer/ApplicantQuickView'

const DEMO_EMPLOYER_NAME = 'CloudNine Logistics'

const statusStyles = {
  new: 'bg-slate-100 text-slate-700',
  interviewing: 'bg-amber-100 text-amber-800',
  offered: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700'
}

function EmployerDashboard() {
  const [employer, setEmployer] = useState(null)
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quickViewApp, setQuickViewApp] = useState(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const { data: employerData, error: empErr } = await supabase
          .from('employers')
          .select('id, company_name, admin_email')
          .ilike('company_name', DEMO_EMPLOYER_NAME)
          .limit(1)
          .single()

        if (empErr || !employerData) {
          setError('Employer not found. Ensure "CloudNine Logistics" is seeded in the employers table.')
          setEmployer(null)
          setApplications([])
          setJobs([])
          return
        }

        setEmployer(employerData)

        const { data: jobsData, error: jobsErr } = await supabase
          .from('jobs')
          .select('id, title, location')
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
        <p className="text-sm mt-1">Check your Supabase tables: employers, applications (and optionally jobs).</p>
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No applications yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const status = (app.status || 'new').toLowerCase()
                  const statusClass = statusStyles[status] ?? statusStyles.new
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
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">{app.full_name ?? '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{app.email ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{applied}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setQuickViewApp(applicationWithJob(app))}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Eye size={16} /> Quick view
                        </button>
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
            const status = (app.status || 'new').toLowerCase()
            const statusClass = statusStyles[status] ?? statusStyles.new
            const applied = app.created_at
              ? new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'
            return (
              <div
                key={app.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{app.full_name ?? '—'}</p>
                    <p className="text-sm text-slate-600">{app.email ?? '—'}</p>
                    <p className="text-xs text-slate-500 mt-1">{applied}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}>
                    {status}
                  </span>
                </div>
                <button
                  onClick={() => setQuickViewApp(applicationWithJob(app))}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Eye size={16} /> Quick view
                </button>
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
