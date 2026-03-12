/**
 * POST /api/discovery/sources/maps
 *
 * Google Maps-specific discovery endpoint.
 * Runs mock (or real) Maps Places API search, normalizes results,
 * and persists raw + normalized records to Supabase.
 *
 * Request body:
 * {
 *   niche:       "Roofing Contractors"
 *   city?:       "Phoenix"
 *   state?:      "AZ"
 *   maxResults?: 50
 * }
 */

import { NextRequest, NextResponse }         from 'next/server'
import { runMapsDiscovery }                  from '@/lib/discovery/maps'
import { logUsage }                          from '@/lib/usage/cost-tracker'
import { supabaseAdmin }                     from '@/lib/supabase/server'
import type { DiscoveryRunParams }           from '@/lib/discovery/types'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  if (!b.niche || typeof b.niche !== 'string' || b.niche.trim() === '') {
    return NextResponse.json({ error: '"niche" is required.' }, { status: 422 })
  }

  const params: DiscoveryRunParams = {
    source:     'maps',
    niche:      b.niche.trim(),
    city:       typeof b.city  === 'string' ? b.city.trim()  : undefined,
    state:      typeof b.state === 'string' ? b.state.trim() : undefined,
    maxResults: Math.min(Number(b.maxResults ?? 50), 200),
  }

  try {
    const { leads, jobId, rawCount, estimatedCost } = await runMapsDiscovery(params)

    // ── Persist raw scrape results ──────────────────────────────────────────
    if (leads.length > 0) {
      await supabaseAdmin
        .from('scrape_results_raw')
        .insert(
          leads.map((lead) => ({
            discovery_job_id: jobId,
            source:           'maps',
            external_id:      lead.sourceUrl ?? lead.id,
            raw_payload:      lead,
          })),
        )
        .then(({ error }) => {
          if (error) console.error('[maps/route] scrape_results_raw insert:', error.message)
        })

      // ── Persist normalized companies ──────────────────────────────────────
      await supabaseAdmin
        .from('companies')
        .insert(
          leads.map((lead) => ({
            name:           lead.name,
            website:        lead.website        ?? null,
            phone:          lead.phone          ?? null,
            city:           lead.city           ?? null,
            state:          lead.state          ?? null,
            zip:            lead.zip            ?? null,
            industry:       lead.industry       ?? null,
            rating:         lead.rating         ?? null,
            review_count:   lead.reviewCount    ?? null,
            address:        lead.address        ?? null,
            source:         'maps',
            source_job_id:  jobId,
          })),
        )
        .then(({ error }) => {
          if (error) console.error('[maps/route] companies insert:', error.message)
        })
    }

    // ── Log usage ─────────────────────────────────────────────────────────
    logUsage({
      provider:     'google',
      service:      'maps-places-api',
      feature:      'lead-discovery',
      input_units:  0,
      output_units: leads.length,
      status:       'success',
      metadata:     { jobId, rawCount, niche: params.niche, city: params.city, state: params.state },
    })

    // Return same shape as /api/discovery/run for UI compatibility
    return NextResponse.json({
      job: {
        id:              jobId,
        source:          'maps',
        status:          'completed',
        niche:           params.niche,
        city:            params.city,
        state:           params.state,
        maxResults:      params.maxResults,
        resultsFound:    leads.length,
        leadsNormalized: leads.length,
        costEstimate:    estimatedCost,
        startedAt:       new Date().toISOString(),
        completedAt:     new Date().toISOString(),
      },
      leads,
      count: leads.length,
    })
  } catch (err) {
    console.error('[POST /api/discovery/sources/maps]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Maps discovery failed.' },
      { status: 500 },
    )
  }
}
