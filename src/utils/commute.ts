/**
 * Truth Engine: Postcodes.io (lat/long) + Haversine (miles) + risk level.
 */

const POSTCODES_IO_BASE = 'https://api.postcodes.io'

export type CommuteRiskLevel = 'green' | 'amber' | 'red'

export interface CommuteResult {
  commute_distance_miles: number | null
  commute_risk_level: CommuteRiskLevel | null
}

/**
 * UK postcode format: outcode + space + incode (last 3 chars).
 * Always return this format so Postcodes.io accepts it (e.g. S101QR -> S10 1QR).
 */
function normalisePostcode(postcode: string): string {
  if (!postcode || typeof postcode !== 'string') return ''
  const s = postcode.trim().toUpperCase().replace(/\s+/g, ' ').replace(/\s/g, '')
  if (s.length >= 5 && s.length <= 7) {
    return s.slice(0, -3) + ' ' + s.slice(-3)
  }
  return s
}

/**
 * Fetch latitude and longitude for a UK postcode from Postcodes.io.
 * Returns null if the postcode is invalid or the API request fails.
 */
export async function getCoordinates(
  postcode: string
): Promise<{ lat: number; lng: number } | null> {
  const normalised = normalisePostcode(postcode)
  if (!normalised || normalised.length < 4) return null

  try {
    const encoded = encodeURIComponent(normalised)
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

/** @deprecated Use getCoordinates. */
export const fetchCoordinates = getCoordinates

/**
 * Haversine formula: straight-line distance in miles between two lat/long points.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

/** @deprecated Use calculateDistance. */
export const haversineMiles = calculateDistance

/**
 * Categorise distance into commute risk level:
 * - &lt; 5 miles: green
 * - 5–15 miles: amber
 * - &gt; 15 miles: red
 */
export function getCommuteRiskLevel(distanceMiles: number | null): CommuteRiskLevel | null {
  if (distanceMiles == null || typeof distanceMiles !== 'number' || distanceMiles < 0)
    return null
  if (distanceMiles < 5) return 'green'
  if (distanceMiles <= 15) return 'amber'
  return 'red'
}

/**
 * Get distance in miles between two UK postcodes (Postcodes.io + Haversine)
 * and the commute risk level.
 */
export async function getCommuteDistanceAndRisk(
  candidatePostcode: string,
  jobPostcode: string
): Promise<CommuteResult> {
  const cand = normalisePostcode(candidatePostcode)
  const job = normalisePostcode(jobPostcode)
  if (!cand || !job) {
    return { commute_distance_miles: null, commute_risk_level: null }
  }

  const [from, to] = await Promise.all([
    getCoordinates(cand),
    getCoordinates(job),
  ])
  if (!from || !to) {
    return { commute_distance_miles: null, commute_risk_level: null }
  }

  const miles = calculateDistance(from.lat, from.lng, to.lat, to.lng)
  const rounded = Math.round(miles * 10) / 10
  const riskLevel = getCommuteRiskLevel(rounded)

  return {
    commute_distance_miles: rounded,
    commute_risk_level: riskLevel,
  }
}
