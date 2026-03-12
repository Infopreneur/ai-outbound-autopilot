/**
 * lib/discovery/google-places.ts
 *
 * Google Places discovery with automatic Apify fallback.
 *
 * Strategy:
 *  1. Run Google Places (real API, multi-keyword, deduped)
 *  2. If results < 50% of requested → supplement with Apify
 *  3. Merge and deduplicate by lowercased name
 *
 * Why keep both:
 *  Google Places — cheaper, faster, stable, capped at ~60/query
 *  Apify          — slower, costs more, but unlimited results + emails
 */

import { runMapsSource }  from './sources/maps'
import { runApifySource } from './sources/apify'
import type { DiscoveryRunParams, NormalizedCompanyLead } from './types'

export interface GooglePlacesResult {
  leads: NormalizedCompanyLead[]
  jobId: string
  rawCount: number
  keywords: string[]
  estimatedCost: number
  usedFallback: boolean
}

/** Threshold: if Places returns less than this fraction of maxResults, trigger Apify fallback */
const FALLBACK_THRESHOLD = 0.5

export async function runGooglePlacesDiscovery(
  params: DiscoveryRunParams,
): Promise<GooglePlacesResult> {
  const max = params.maxResults ?? 20

  // ── Step 1: Google Places ────────────────────────────────────────────────
  const placesResult = await runMapsSource(params)

  let leads        = placesResult.leads
  let usedFallback = false
  let cost         = placesResult.estimatedCost

  // ── Step 2: Apify fallback if results are thin ───────────────────────────
  if (leads.length < max * FALLBACK_THRESHOLD) {
    console.log(
      `[google-places] Places returned ${leads.length}/${max} — falling back to Apify`,
    )

    try {
      const apifyResult = await runApifySource(params)
      usedFallback = true
      cost = parseFloat((cost + apifyResult.estimatedCost).toFixed(4))

      // ── Step 3: Merge, dedup by name ──────────────────────────────────────
      const seenNames = new Set(leads.map((l) => l.name.toLowerCase().trim()))
      const newLeads  = apifyResult.leads.filter(
        (l) => !seenNames.has(l.name.toLowerCase().trim()),
      )

      leads = [...leads, ...newLeads]
    } catch (err) {
      // Fallback failure is non-fatal — return whatever Places got
      console.error('[google-places] Apify fallback failed:', err)
    }
  }

  return {
    leads,
    jobId:         placesResult.jobId,
    rawCount:      leads.length,
    keywords:      placesResult.keywords,
    estimatedCost: cost,
    usedFallback,
  }
}
