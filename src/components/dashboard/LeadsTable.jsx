import { useState, useEffect } from 'react'
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../../supabase'
import TableSkeleton from './TableSkeleton'

/**
 * Expects Supabase "leads" table with columns:
 * id, full_name, email, postcode, role, secondary_email (nullable = drop-off), processed, created_at
 */
export default function LeadsTable() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [postcodeFilter, setPostcodeFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setLeads(data ?? [])
      } catch (err) {
        console.error('Leads fetch error:', err)
        setError(err.message ?? 'Failed to load leads.')
        setLeads([])
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [])

  const filteredLeads = leads.filter((lead) => {
    const postcodeMatch = !postcodeFilter.trim() ||
      (lead.postcode && String(lead.postcode).toLowerCase().includes(postcodeFilter.trim().toLowerCase()))
    const roleMatch = !roleFilter.trim() ||
      (lead.role && String(lead.role).toLowerCase().includes(roleFilter.trim().toLowerCase()))
    return postcodeMatch && roleMatch
  })

  const handleMarkProcessed = async (id, currentProcessed) => {
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ processed: !currentProcessed })
        .eq('id', id)
      if (updateError) throw updateError
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, processed: !currentProcessed } : l))
      )
    } catch (err) {
      console.error('Update error:', err)
    }
  }

  const isDropOff = (lead) => lead.secondary_email == null || lead.secondary_email === ''

  if (loading) return <TableSkeleton />
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 backdrop-blur-sm p-6 text-center">
        <p className="text-red-700 font-semibold">{error}</p>
        <p className="text-sm text-red-600 mt-1">Check that the &quot;leads&quot; table exists in Supabase.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-[#0d2547] tracking-tight">Candidate leads</h1>

      {/* UK-specific filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by Postcode"
          value={postcodeFilter}
          onChange={(e) => setPostcodeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2547] w-full sm:w-48"
        />
        <input
          type="text"
          placeholder="Filter by Role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2547] w-full sm:w-48"
        />
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block rounded-2xl border border-white/40 bg-white/60 backdrop-blur-sm overflow-hidden shadow-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80">
              <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
              <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
              <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Postcode</th>
              <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
              <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No leads match your filters.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`border-b border-slate-100 transition ${
                    isDropOff(lead) ? 'bg-red-50/70' : 'bg-white/40 hover:bg-white/60'
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-[#0d2547]">{lead.full_name ?? '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{lead.email ?? '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{lead.postcode ?? '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{lead.role ?? '—'}</td>
                  <td className="py-3 px-4">
                    {isDropOff(lead) ? (
                      <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                        <AlertCircle size={14} /> Drop-off risk
                      </span>
                    ) : lead.processed ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle2 size={14} /> Processed
                      </span>
                    ) : (
                      <span className="text-slate-500 text-sm">New</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d2547] text-white px-3 py-2 text-xs font-semibold hover:opacity-90 transition"
                      >
                        <Mail size={14} /> Email
                      </a>
                      <button
                        onClick={() => handleMarkProcessed(lead.id, lead.processed)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <CheckCircle2 size={14} /> {lead.processed ? 'Unmark' : 'Mark processed'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="lg:hidden space-y-4">
        {filteredLeads.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No leads match your filters.</p>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className={`rounded-2xl border p-4 shadow-md ${
                isDropOff(lead)
                  ? 'border-red-200/80 bg-red-50/70'
                  : 'border-white/40 bg-white/60 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[#0d2547]">{lead.full_name ?? '—'}</p>
                  <p className="text-sm text-slate-600">{lead.email ?? '—'}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {lead.postcode ?? '—'} · {lead.role ?? '—'}
                  </p>
                  {isDropOff(lead) && (
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium mt-2">
                      <AlertCircle size={12} /> Drop-off risk (no secondary contact)
                    </span>
                  )}
                </div>
                {lead.processed && (
                  <span className="text-green-600 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Processed
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <a
                  href={`mailto:${lead.email}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0d2547] text-white py-2.5 text-sm font-semibold"
                >
                  <Mail size={16} /> Email
                </a>
                <button
                  onClick={() => handleMarkProcessed(lead.id, lead.processed)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700"
                >
                  <CheckCircle2 size={16} /> {lead.processed ? 'Unmark' : 'Mark processed'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
