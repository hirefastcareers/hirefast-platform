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
 * Sector-specific green zone (miles).
 * Logistics & Retail: 10 (local focus). Manufacturing: 15. Engineering: 25 (high-skill/pay, travel further).
 */
const GREEN_MILES: Record<string, number> = {
  logistics: 10,
  retail: 10,
  manufacturing: 15,
  engineering: 25,
}

/** Amber cutoff (miles): red beyond this. */
const AMBER_MILES: Record<string, number> = {
  logistics: 20,
  retail: 20,
  manufacturing: 28,
  engineering: 45,
}

/**
 * Categorise distance into commute risk level.
 * - Logistics & Retail: green &lt; 10 mi, amber 10–20 mi, red &gt; 20 mi
 * - Manufacturing: green &lt; 15 mi, amber 15–28 mi, red &gt; 28 mi
 * - Engineering: green &lt; 25 mi, amber 25–45 mi, red &gt; 45 mi
 */
export function getCommuteRiskLevel(
  distanceMiles: number | null,
  sector?: string | null
): CommuteRiskLevel | null {
  if (distanceMiles == null || typeof distanceMiles !== 'number' || distanceMiles < 0)
    return null
  const greenMiles = sector ? (GREEN_MILES[sector] ?? 10) : 10
  const amberMiles = sector ? (AMBER_MILES[sector] ?? 20) : 20
  if (distanceMiles < greenMiles) return 'green'
  if (distanceMiles <= amberMiles) return 'amber'
  return 'red'
}

/**
 * Get distance in miles between two UK postcodes (Postcodes.io + Haversine)
 * and the commute risk level. Pass job sector for sector-specific thresholds (e.g. engineering 20 mi green).
 */
export async function getCommuteDistanceAndRisk(
  candidatePostcode: string,
  jobPostcode: string,
  jobSector?: string | null
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
  const riskLevel = getCommuteRiskLevel(rounded, jobSector)

  return {
    commute_distance_miles: rounded,
    commute_risk_level: riskLevel,
  }
}
