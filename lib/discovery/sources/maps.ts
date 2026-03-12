/**
 * lib/discovery/sources/maps.ts
 *
 * Google Maps connector — uses the real Google Places Text Search API.
 * Requires GOOGLE_MAPS_API_KEY in .env.local.
 *
 * Supports multi-keyword discovery via INDUSTRY_PRESETS:
 *   - If params.industry matches a preset, runs one API call per keyword
 *   - Results are deduplicated by place_id
 *   - Falls back to params.niche as a single keyword if no preset found
 */

import { searchGooglePlaces } from '@/lib/maps/google-places'
import { normalizePlace }     from '@/lib/maps/google-normalize'
import { INDUSTRY_PRESETS }   from '@/lib/discovery/industries'
import type { GooglePlace }   from '@/lib/maps/google-places'
import type { DiscoveryRunParams, NormalizedCompanyLead } from '../types'

// ─── Public interface ─────────────────────────────────────────────────────────

export interface MapsSourceResult {
  leads: NormalizedCompanyLead[]
  jobId: string
  rawCount: number
  /** Keywords that were searched (one Places API call each) */
  keywords: string[]
  /** Estimated USD cost — Google Places Text Search: ~$0.017 per 20 results */
  estimatedCost: number
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runMapsSource(params: DiscoveryRunParams): Promise<MapsSourceResult> {
  const city  = params.city  ?? ''
  const state = params.state ?? ''
  const max   = Math.min(params.maxResults ?? 20, 60)
  const jobId = `maps_${Date.now()}`

  // Resolve keywords from industry preset or fall back to niche
  const preset   = params.industry ? INDUSTRY_PRESETS[params.industry] : null
  const keywords = preset ? preset.keywords : [params.niche]

  // Run one Places API call per keyword, deduplicate by place_id
  const seenIds  = new Set<string>()
  const allPlaces: GooglePlace[] = []

  for (const keyword of keywords) {
    const places = await searchGooglePlaces({ niche: keyword, city, maxResults: max })
    for (const place of places) {
      if (!seenIds.has(place.place_id)) {
        seenIds.add(place.place_id)
        allPlaces.push(place)
      }
    }
  }

  // Normalize to the shared NormalizedCompanyLead shape
  const leads: NormalizedCompanyLead[] = allPlaces.map((place) => {
    const n = normalizePlace(place, city)

    return {
      id:           crypto.randomUUID(),
      name:         n.name,
      website:      n.website             ?? undefined,
      phone:        n.phone               ?? undefined,
      address:      n.address             ?? undefined,
      city:         n.city                ?? undefined,
      state:        state                 || undefined,
      rating:       n.rating              ?? undefined,
      reviewCount:  n.review_count > 0 ? n.review_count : undefined,
      placeId:      n.place_id,
      sourceJob:    jobId,
      rawSource:    'maps',
      normalizedAt: new Date().toISOString(),
      enriched:     false,
    }
  })

  // Cost: one text-search request per 20 results, per keyword
  const apiCallCount  = keywords.length * Math.ceil(max / 20)
  const estimatedCost = parseFloat((apiCallCount * 0.017).toFixed(4))

  return { leads, jobId, rawCount: allPlaces.length, keywords, estimatedCost }
}
