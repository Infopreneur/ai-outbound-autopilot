/**
 * lib/discovery/sources/maps.ts
 *
 * Google Maps connector — uses the real Google Places Text Search API.
 * Requires GOOGLE_MAPS_API_KEY in .env.local.
 *
 * Returns NormalizedCompanyLead[] so the job runner stays source-agnostic.
 */

import { searchGooglePlaces } from '@/lib/maps/google-places'
import { normalizePlace }     from '@/lib/maps/google-normalize'
import type { DiscoveryRunParams, NormalizedCompanyLead } from '../types'

// ─── Public interface ─────────────────────────────────────────────────────────

export interface MapsSourceResult {
  leads: NormalizedCompanyLead[]
  jobId: string
  rawCount: number
  /** Estimated USD cost — Google Places Text Search: ~$0.017 per 20 results */
  estimatedCost: number
}

export async function runMapsSource(params: DiscoveryRunParams): Promise<MapsSourceResult> {
  const city  = params.city  ?? ''
  const state = params.state ?? ''
  const max   = Math.min(params.maxResults ?? 20, 60)

  const jobId  = `maps_${Date.now()}`
  const places = await searchGooglePlaces({ niche: params.niche, city, maxResults: max })

  const leads: NormalizedCompanyLead[] = places.map((place) => {
    const n = normalizePlace(place, city)

    return {
      id:           crypto.randomUUID(),
      name:         n.name,
      website:      n.website   ?? undefined,
      phone:        n.phone     ?? undefined,
      address:      n.address   ?? undefined,
      city:         n.city      ?? undefined,
      state:        state       || undefined,
      rating:       n.rating    ?? undefined,
      reviewCount:  n.review_count > 0 ? n.review_count : undefined,
      sourceJob:    jobId,
      rawSource:    'maps',
      normalizedAt: new Date().toISOString(),
      enriched:     false,
    }
  })

  const estimatedCost = parseFloat((Math.ceil(leads.length / 20) * 0.017).toFixed(4))

  return { leads, jobId, rawCount: places.length, estimatedCost }
}
