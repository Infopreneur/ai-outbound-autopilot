/**
 * Normalizer for the "maps" discovery source.
 *
 * Converts raw Google Maps API-style records into the shared
 * NormalizedCompanyLead shape used across the platform.
 */

import type { RawScrapeResult, NormalizedCompanyLead } from './types'

// ─── Raw shape emitted by maps.ts ─────────────────────────────────────────────

interface MapsRawResult {
  place_id?: string
  name?: string
  formatted_address?: string
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  types?: string[]
  business_status?: string
  city?: string
  state?: string
  postal_code?: string
  maps_url?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractCity(address: string): string | undefined {
  // "123 Main St, Phoenix, AZ 85001, USA" → "Phoenix"
  const parts = address.split(',')
  return parts.length >= 2 ? parts[1].trim() : undefined
}

function extractState(address: string): string | undefined {
  const match = address.match(/,\s+([A-Z]{2})\s+\d{5}/)
  return match ? match[1] : undefined
}

function extractZip(address: string): string | undefined {
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/)
  return match ? match[1] : undefined
}

function primaryType(types: string[] | undefined): string | undefined {
  if (!Array.isArray(types) || types.length === 0) return undefined
  // Skip generic Google Maps type tags
  const skip = new Set(['establishment', 'point_of_interest', 'store', 'food', 'health'])
  const primary = types.find((t) => !skip.has(t))
  return (primary ?? types[0])
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Per-record normalizer ────────────────────────────────────────────────────

function normalizeMapsLead(
  raw: Record<string, unknown>,
  jobId: string,
): NormalizedCompanyLead {
  const r = raw as MapsRawResult
  const address = r.formatted_address ?? ''
  const niche = primaryType(r.types)

  return {
    id:           crypto.randomUUID(),
    name:         (r.name ?? 'Unknown Business').trim(),
    website:      r.website                   ?? undefined,
    phone:        r.formatted_phone_number    ?? undefined,
    address:      address || undefined,
    city:         r.city  ?? extractCity(address)  ?? undefined,
    state:        r.state ?? extractState(address) ?? undefined,
    zip:          r.postal_code ?? extractZip(address) ?? undefined,
    industry:     niche,
    niche,
    rating:       typeof r.rating              === 'number' ? r.rating              : undefined,
    reviewCount:  typeof r.user_ratings_total  === 'number' ? r.user_ratings_total  : undefined,
    sourceJob:    jobId,
    sourceUrl:    r.maps_url                   ?? undefined,
    rawSource:    'maps',
    normalizedAt: new Date().toISOString(),
    enriched:     false,
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function normalizeMapsResults(
  scrapeResult: RawScrapeResult,
): NormalizedCompanyLead[] {
  const { rawData, jobId } = scrapeResult
  if (!Array.isArray(rawData) || rawData.length === 0) return []

  try {
    return rawData.map((r) => normalizeMapsLead(r, jobId))
  } catch (err) {
    console.error('[maps-normalize] Failed to normalize results:', err)
    return []
  }
}
