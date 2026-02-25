/**
 * Trust score: logic-driven badges.
 * High (green): has_rtw true AND all job required_skills met.
 * Medium (amber): has_rtw true but missing required skills.
 * Low (red): has_rtw false (Compliance Risk).
 * @param {object} application - Application row (has_rtw, candidate_skills)
 * @param {object} [job] - Job row (required_skills array); optional for backwards compat
 */
export function getTrustScore(application, job) {
  const hasRtw = application?.has_rtw === true || application?.has_rtw === 'true' || application?.has_rtw === 1
  const hasDocument = !!(application?.rtw_document_url && String(application.rtw_document_url).trim())
  const rtwOk = hasRtw || hasDocument

  if (!rtwOk) return { level: 'red', label: 'Low', count: 0, reason: 'Compliance risk' }

  const required = (job?.required_skills && Array.isArray(job.required_skills)) ? job.required_skills : []
  const candidate = (application?.candidate_skills && Array.isArray(application.candidate_skills)) ? application.candidate_skills : []
  const candidateSet = new Set(candidate.map((s) => String(s).trim().toLowerCase()))
  const allSkillsMet = required.length === 0 || required.every((r) => candidateSet.has(String(r).trim().toLowerCase()))

  if (allSkillsMet) return { level: 'green', label: 'High', count: 3, reason: 'RTW + skills' }
  return { level: 'amber', label: 'Medium', count: 2, reason: 'RTW ok, skills missing' }
}

export const trustScoreStyles = {
  green: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  amber: 'bg-amber-100 text-amber-800 border border-amber-300',
  red: 'bg-red-100 text-red-700 border border-red-300'
}
