/**
 * Commute utilities: fetch UK postcode coordinates via postcodes.io and compute distance (Haversine).
 */

const POSTCODES_IO_BASE = 'https://api.postcodes.io'

/** Hardcoded job postcode for testing (Manchester). Use job.location_postcode in production. */
export const DEFAULT_JOB_POSTCODE = 'M1 1AA'

/**
 * Normalise postcode for API: uppercase, single space before incode.
 */
function normalisePostcode(postcode) {
  if (!postcode || typeof postcode !== 'string') return ''
  const trimmed = postcode.trim().toUpperCase().replace(/\s+/g, ' ')
  return trimmed
}

/**
 * Fetch lat/long for a UK postcode using the postcodes.io API.
 * @param {string} postcode - UK postcode (e.g. "SW1A 1AA", "M11AA")
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export async function fetchCoordinates(postcode) {
  const normalised = normalisePostcode(postcode)
  if (!normalised || normalised.length < 4) return null

  try {
    const encoded = encodeURIComponent(normalised.replace(/\s/g, ''))
    const res = await fetch(`${POSTCODES_IO_BASE}/postcodes/${encoded}`)
    if (!res.ok) return null
    const data = await res.json()
    const lat = data?.result?.latitude
    const lng = data?.result?.longitude
    if (typeof lat !== 'number' || typeof lng !== 'number') return null
    return { lat, lng }
  } catch {
    return null
  }
}

/**
 * Haversine formula: distance in miles between two lat/long points.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in miles
 */
export function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3959 // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Get distance in miles between two UK postcodes using postcodes.io and Haversine.
 * @param {string} candidatePostcode
 * @param {string} [jobPostcode] - Defaults to M1 1AA
 * @returns {Promise<number | null>} distance in miles, or null if lookup failed
 */
export async function getDistanceMilesFromApi(candidatePostcode, jobPostcode = DEFAULT_JOB_POSTCODE) {
  const cand = normalisePostcode(candidatePostcode)
  const job = normalisePostcode(jobPostcode)
  if (!cand || !job) return null

  const [from, to] = await Promise.all([fetchCoordinates(cand), fetchCoordinates(job)])
  if (!from || !to) return null

  return haversineMiles(from.lat, from.lng, to.lat, to.lng)
}

/**
 * Commute risk level from distance in miles: green <10, amber 10–20, red >20.
 */
export function getCommuteRiskLevel(distanceMiles) {
  if (distanceMiles == null || typeof distanceMiles !== 'number') return null
  if (distanceMiles < 10) return 'green'
  if (distanceMiles <= 20) return 'amber'
  return 'red'
}
