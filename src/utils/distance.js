/**
 * Hardcoded job location for distance calculation (Birmingham).
 * In production you might use job.location_postcode from the jobs table.
 */
export const DEFAULT_JOB_POSTCODE = 'B1 1AA'

/**
 * Rough distance in miles from Birmingham to common UK postcode areas (by first letter).
 * Used to show "long commute" warning when > 15 miles.
 */
const MILES_FROM_BIRMINGHAM_BY_PREFIX = {
  B: 0,
  C: 5,
  W: 10,
  D: 12,
  S: 18,
  T: 16,
  L: 95,
  E: 115,
  N: 115,
  M: 85,
  O: 90,
  P: 100,
  H: 105,
  Y: 115,
  R: 95,
  G: 65,
  A: 105,
  I: 115,
  K: 110,
  F: 115,
  J: 20,
  Z: 20
}

/**
 * Extract outcode (area) from UK postcode, e.g. "SW1A 1AA" -> "SW1", "B1 1AA" -> "B1"
 */
function getOutcode(postcode) {
  if (!postcode || typeof postcode !== 'string') return ''
  const trimmed = postcode.trim().toUpperCase().replace(/\s+/g, '')
  const match = trimmed.match(/^([A-Z]{1,2}[0-9][0-9A-Z]?)/)
  return match ? match[1] : trimmed.slice(0, 4) || ''
}

/**
 * Returns approximate distance in miles from candidate postcode to job location.
 * Job location is hardcoded as B1 1AA (Birmingham) unless job.location_postcode is set.
 */
export function getDistanceMiles(candidatePostcode, job = null) {
  const jobPostcode = (job && job.location_postcode) ? job.location_postcode : DEFAULT_JOB_POSTCODE
  const jobOutcode = getOutcode(jobPostcode)
  const candidateOutcode = getOutcode(candidatePostcode)
  if (!candidateOutcode) return null

  if (jobOutcode === candidateOutcode) return 0

  const prefix = candidateOutcode.slice(0, 1)
  const miles = MILES_FROM_BIRMINGHAM_BY_PREFIX[prefix] ?? 20
  return miles
}
