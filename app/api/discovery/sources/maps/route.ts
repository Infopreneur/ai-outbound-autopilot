/**
 * POST /api/discovery/sources/maps
 *
 * Google Maps discovery endpoint.
 * Delegates to runMapsSearch which generates results and persists
 * them to the companies table in Supabase.
 *
 * Request body:
 * {
 *   niche:       "Roofing Contractors"
 *   city:        "Phoenix"
 *   state?:      "AZ"
 *   maxResults?: 50
 * }
 */

import { NextResponse }       from 'next/server'
import { runMapsSearch }      from '@/lib/maps/maps-search'
import { logUsage }           from '@/lib/usage/cost-tracker'

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { niche, city, state, maxResults } = body

  if (!niche || typeof niche !== 'string' || niche.trim() === '') {
    return NextResponse.json({ error: '"niche" is required.' }, { status: 422 })
  }
  if (!city || typeof city !== 'string') {
    return NextResponse.json({ error: '"city" is required.' }, { status: 422 })
  }

  const max = Math.min(Number(maxResults ?? 50), 200)

  try {
    const results = await runMapsSearch({
      niche:      niche.trim(),
      city:       city.trim(),
      state:      typeof state === 'string' ? state.trim() : undefined,
      maxResults: max,
    })

    logUsage({
      provider:     'google',
      service:      'maps-places-api',
      feature:      'lead-discovery',
      input_units:  0,
      output_units: results.length,
      status:       'success',
      metadata:     { niche, city, state },
    })

    // Return shape compatible with the prospecting page UI
    return NextResponse.json({
      job: {
        id:              `maps_${Date.now()}`,
        source:          'maps',
        status:          'completed',
        niche:           niche.trim(),
        city:            city.trim(),
        state:           state ?? null,
        maxResults:      max,
        resultsFound:    results.length,
        leadsNormalized: results.length,
        costEstimate:    parseFloat((Math.ceil(results.length / 20) * 0.017).toFixed(4)),
        startedAt:       new Date().toISOString(),
        completedAt:     new Date().toISOString(),
      },
      leads:  results.map((r, i) => ({
        id:          `lead_${Date.now()}_${i}`,
        name:        r.name,
        website:     r.website,
        phone:       r.phone,
        rating:      r.rating,
        reviewCount: r.review_count,
        city:        r.city,
        state:       r.state,
        rawSource:   'maps',
        normalizedAt: new Date().toISOString(),
        enriched:    false,
        sourceJob:   `maps_${Date.now()}`,
      })),
      count: results.length,
    })
  } catch (err) {
    console.error('[POST /api/discovery/sources/maps]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Maps search failed.' },
      { status: 500 },
    )
  }
}
