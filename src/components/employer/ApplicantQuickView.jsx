import { X, MapPin, FileCheck, ExternalLink } from 'lucide-react'
import { getTrustScore, trustScoreStyles } from '../../utils/trustScore'
import { getCommuteRiskLevel } from '../../utils/commuteUtils'

export default function ApplicantQuickView({ application, onClose }) {
  if (!application) return null

  const { full_name, email, phone, status, created_at, job, postcode, candidate_postcode, rtw_document_url, distance_miles, commute_distance, commute_risk_level } = application
  const trust = getTrustScore(application, application.job)
  const miles = commute_distance != null ? Number(commute_distance) : distance_miles
  const commuteRisk = commute_risk_level || getCommuteRiskLevel(miles)
  const created = created_at ? new Date(created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '—'

  const statusStyles = {
    pending: 'bg-slate-100 text-slate-700 border border-slate-300',
    new: 'bg-slate-100 text-slate-700 border border-slate-300',
    shortlisted: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    interviewing: 'bg-amber-100 text-amber-800 border border-amber-300',
    offered: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    rejected: 'bg-red-100 text-red-700 border border-red-300'
  }
  const statusClass = statusStyles[status] ?? 'bg-slate-100 text-slate-700 border border-slate-300'

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
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trust score</p>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${trustScoreStyles[trust.level]}`}>
              {trust.label}
            </span>
          </div>
          {(commuteRisk || miles != null) && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Commute</p>
              <span className="flex items-center gap-1.5">
                {commuteRisk === 'green' && <span title="Low risk">🟢</span>}
                {commuteRisk === 'amber' && <span title="Medium risk">🟡</span>}
                {commuteRisk === 'red' && <span title="High risk">🔴</span>}
                {miles != null && (
                  <span className="text-slate-600 text-sm">{miles} miles</span>
                )}
              </span>
            </div>
          )}
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
          {(candidate_postcode || postcode) && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1"><MapPin className="inline w-3.5 h-3.5 mr-1" /> Postcode</p>
              <p className="text-slate-900 font-medium">{candidate_postcode || postcode}</p>
            </div>
          )}
          {rtw_document_url && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1"><FileCheck className="inline w-3.5 h-3.5 mr-1" /> Right to Work / Licence</p>
              <a href={rtw_document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#0d2547] font-medium hover:underline">
                View document <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</p>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}>
              {status ?? 'pending'}
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
