import { X } from 'lucide-react'

export default function ApplicantQuickView({ application, onClose }) {
  if (!application) return null

  const { full_name, email, phone, status, created_at, job } = application
  const created = created_at ? new Date(created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '—'

  const statusStyles = {
    new: 'bg-slate-100 text-slate-700',
    interviewing: 'bg-amber-100 text-amber-800',
    offered: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-700'
  }
  const statusClass = statusStyles[status] ?? 'bg-slate-100 text-slate-700'

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col animate-[slideIn_0.2s_ease-out]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Candidate details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Name</p>
            <p className="text-slate-900 font-medium">{full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email</p>
            <a href={`mailto:${email}`} className="text-[#0d2547] font-medium hover:underline">
              {email ?? '—'}
            </a>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Phone</p>
            <p className="text-slate-900 font-medium">{phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</p>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}>
              {status ?? 'new'}
            </span>
          </div>
          {job?.title && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Applied for</p>
              <p className="text-slate-900 font-medium">{job.title}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Applied on</p>
            <p className="text-slate-600">{created}</p>
          </div>
        </div>
      </div>
    </>
  )
}
