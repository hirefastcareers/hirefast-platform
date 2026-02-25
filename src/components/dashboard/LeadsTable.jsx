import { useState, useEffect } from 'react'
import { Mail } from 'lucide-react'
import { supabase } from '../../supabase'
import TableSkeleton from './TableSkeleton'

/**
 * Fetches from Supabase "applications" table.
 * Expected columns: id, full_name, email, phone, status, created_at
 */
export default function LeadsTable() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function fetchApplications() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await supabase
          .from('applications')
          .select('id, full_name, email, phone, status, created_at')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setApplications(data ?? [])
      } catch (err) {
        console.error('Applications fetch error:', err)
        setError(err.message ?? 'Failed to load applications.')
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const filtered = applications.filter((row) => {
    if (!statusFilter.trim()) return true
    const s = (row.status ?? '').toLowerCase()
    return s.includes(statusFilter.trim().toLowerCase())
  })

  if (loading) return <TableSkeleton />
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 backdrop-blur-sm p-6 text-center">
        <p className="text-red-700 font-semibold">{error}</p>
        <p className="text-sm text-red-600 mt-1">Check that the &quot;applications&quot; table exists in Supabase.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Applications</h1>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
        />
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block rounded-2xl border border-white/40 bg-white/60 backdrop-blur-sm overflow-hidden shadow-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80">
              <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
              <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
              <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Phone</th>
              <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No applications match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 bg-white/40 hover:bg-white/60 transition"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.full_name ?? '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{row.email ?? '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{row.phone ?? '—'}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {row.status ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={`mailto:${row.email}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs font-semibold hover:opacity-90 transition"
                    >
                      <Mail size={14} /> Email
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="lg:hidden space-y-4">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No applications match your filters.</p>
        ) : (
          filtered.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-sm p-4 shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">{row.full_name ?? '—'}</p>
                  <p className="text-sm text-slate-600">{row.email ?? '—'}</p>
                  <p className="text-sm text-slate-500 mt-1">{row.phone ?? '—'}</p>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 mt-2">
                    {row.status ?? '—'}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href={`mailto:${row.email}`}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-semibold"
                >
                  <Mail size={16} /> Email
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
