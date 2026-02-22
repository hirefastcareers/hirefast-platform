/**
 * Trust score based on postcode, phone, and Right to Work document.
 * Green: all 3 present. Amber: 2 of 3. Red: 0 or 1.
 */
export function getTrustScore(application) {
  const hasPostcode = !!(application?.postcode && String(application.postcode).trim())
  const hasPhone = !!(application?.phone && String(application.phone).trim())
  const hasDocument = !!(application?.rtw_document_url && String(application.rtw_document_url).trim())
  const count = [hasPostcode, hasPhone, hasDocument].filter(Boolean).length

  if (count >= 3) return { level: 'green', label: 'High', count }
  if (count === 2) return { level: 'amber', label: 'Medium', count }
  return { level: 'red', label: 'Low', count }
}

export const trustScoreStyles = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-700 border-red-200'
}
