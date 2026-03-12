/**
 * Google Maps discovery source.
 *
 * Real implementation:
 *   Uses the Google Places API (Text Search + Place Details).
 *   Set GOOGLE_MAPS_API_KEY in .env.local to enable live results.
 *
 * Currently returns realistic mock data so the UI works without credentials.
 * Each function is a 1:1 replacement target when the real API is wired in.
 */

import type { DiscoveryRunParams, NormalizedCompanyLead, RawScrapeResult } from './types'
import { normalizeMapsResults } from './maps-normalize'

// ─── Mock data config ─────────────────────────────────────────────────────────

const NAME_PREFIXES = [
  'Valley', 'Sun', 'Pro', 'Elite', 'Premier', 'Metro', 'City',
  'Local', 'Ace', 'Master', 'Best', 'Top', 'Expert', 'Quality', 'Reliable',
  'Pacific', 'National', 'American', 'Midwest', 'Southern',
]

const NAME_SUFFIXES = [
  '& Sons', '& Associates', 'Solutions', 'Services', 'Group',
  'Team', 'Co.', 'Inc.', 'LLC', '& Company', 'Specialists',
  'Pros', 'Experts', 'Plus', 'Masters',
]

const STREETS = [
  'Main St', 'Oak Ave', 'Park Blvd', 'Commerce Dr', 'Industrial Way',
  'Business Pkwy', 'Center St', 'Market Ave', 'Trade Dr', 'Service Rd',
  'Enterprise Blvd', 'Corporate Way', 'Sunrise Ave', 'Sunset Dr', 'River Rd',
]

// ─── Raw record shape (mirrors Google Places API response) ───────────────────

export interface MapsRawResult {
  place_id: string
  name: string
  formatted_address: string
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  types: string[]
  business_status: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'
  city: string
  state: string
  postal_code: string
  maps_url: string
  opening_hours?: { open_now?: boolean }
}

// ─── Mock generator ───────────────────────────────────────────────────────────

function generateMockMapsResults(
  niche: string,
  city: string,
  state: string,
  count: number,
): MapsRawResult[] {
  // Deterministic seed so the same niche+city always returns the same set
  const seed = (niche + city + state)
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)

  const nicheSlug = niche.toLowerCase().replace(/[^a-z0-9]+/g, '_')

  return Array.from({ length: count }, (_, i) => {
    const prefixIdx = (seed + i * 3)  % NAME_PREFIXES.length
    const suffixIdx = (seed + i * 7)  % NAME_SUFFIXES.length
    const streetIdx = (seed + i * 5)  % STREETS.length

    const prefix  = NAME_PREFIXES[prefixIdx]
    const suffix  = NAME_SUFFIXES[suffixIdx]
    const bizName = `${prefix} ${niche} ${suffix}`
    const slug    = bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

    const streetNum = 100 + ((seed + i * 37) % 9900)
    const zip       = String(10000 + ((seed + i * 13) % 89999)).padStart(5, '0')

    // Ratings cluster around 4.x with occasional 3.x
    const ratingBase   = i % 6 === 0 ? 3.5 : 4.0
    const ratingOffset = ((seed + i * 17) % 10) * 0.1
    const rating       = parseFloat((ratingBase + ratingOffset).toFixed(1))
    const reviewCount  = 8 + ((seed + i * 23) % 492)

    const areaCode = 200 + ((seed + i * 11) % 799)
    const lineNum  = String(2000000 + ((seed + i * 41) % 7999999)).slice(0, 7)
    const phone    = `(${areaCode}) ${lineNum.slice(0, 3)}-${lineNum.slice(3, 7)}`

    return {
      place_id:            `ChIJ${String(seed + i).padStart(10, '0')}`,
      name:                bizName,
      formatted_address:   `${streetNum} ${STREETS[streetIdx]}, ${city}, ${state} ${zip}, USA`,
      formatted_phone_number: phone,
      website:             `https://www.${slug}.com`,
      rating,
      user_ratings_total:  reviewCount,
      types:               [nicheSlug, 'establishment', 'point_of_interest'],
      business_status:     'OPERATIONAL',
      city,
      state,
      postal_code:         zip,
      maps_url:            `https://maps.google.com/?cid=${seed + i * 999}`,
      opening_hours:       { open_now: i % 4 !== 0 },
    }
  })
}

// ─── Core operations (swap these for real API calls) ─────────────────────────

/**
 * Execute a Google Places Text Search.
 * Real: POST https://places.googleapis.com/v1/places:searchText
 */
async function searchPlaces(
  query: string,
  count: number,
  city: string,
  state: string,
  niche: string,
): Promise<MapsRawResult[]> {
  // Simulate API round-trip
  await new Promise((r) => setTimeout(r, 500))
  console.log(`[Maps] Would call Places API: "${query}" (max ${count})`)
  return generateMockMapsResults(niche, city, state, count)
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface MapsRunResult {
  leads: NormalizedCompanyLead[]
  jobId: string
  rawCount: number
  /** Estimated USD cost — Google Maps Places API charges ~$0.017/request */
  estimatedCost: number
}

/**
 * Full Maps discovery flow:
 *  1. Text-search Places API for niche + location
 *  2. Normalize results
 *  3. Return typed leads
 */
export async function runMapsDiscovery(
  params: DiscoveryRunParams,
): Promise<MapsRunResult> {
  const city  = params.city  ?? ''
  const state = params.state ?? ''
  const max   = params.maxResults ?? 50

  const query = [`${params.niche}`, city, state].filter(Boolean).join(' ')

  const rawData = await searchPlaces(query, max, city, state, params.niche)

  const jobId = `maps_${Date.now()}`

  const scrapeResult: RawScrapeResult = {
    source:    'maps',
    jobId,
    rawData:   rawData.slice(0, max) as unknown as Record<string, unknown>[],
    scrapedAt: new Date().toISOString(),
  }

  const leads        = normalizeMapsResults(scrapeResult)
  // Google Places API: ~$0.017 per text-search call, billed per 20 results
  const estimatedCost = parseFloat((Math.ceil(leads.length / 20) * 0.017).toFixed(4))

  return { leads, jobId, rawCount: rawData.length, estimatedCost }
}
