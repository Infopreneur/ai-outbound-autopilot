/**
 * POST /api/discovery/sources/maps
 *
 * Calls the real Google Places Text Search API, normalizes results,
 * persists them to Supabase, and returns the leads to the UI.
 *
 * Request body:
 * {
 *   niche:       "Roofing Contractors"
 *   city:        "Phoenix"
 *   state?:      "AZ"
 *   maxResults?: 50
 * }
 */

import { NextResponse }               from 'next/server'
import { searchGooglePlaces }         from '@/lib/maps/google-places'
import { normalizePlace }             from '@/lib/maps/google-normalize'
import { supabaseAdmin }              from '@/lib/supabase/server'
import { logUsage }                   from '@/lib/usage/cost-tracker'

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

  const max = Math.min(Number(maxResults ?? 20), 60)

  try {
    const places = await searchGooglePlaces({
      niche:      niche.trim(),
      city:       city.trim(),
      maxResults: max,
    })

    const normalized = places.map((p) => normalizePlace(p, city.trim()))

    // Persist to Supabase
    if (normalized.length > 0) {
      const { error } = await supabaseAdmin
        .from('companies')
        .insert(
          normalized.map((n) => ({
            name:         n.name,
            city:         n.city ?? null,
            state:        typeof state === 'string' ? state.trim() : null,
            rating:       n.rating,
            review_count: n.review_count,
            address:      n.address,
            phone:        n.phone    ?? null,
            website:      n.website  ?? null,
            source:       'maps',
          })),
        )

      if (error) console.error('[maps/route] companies insert:', error.message)
    }

    logUsage({
      provider:     'google',
      service:      'maps-places-api',
      feature:      'lead-discovery',
      input_units:  0,
      output_units: normalized.length,
      status:       'success',
      metadata:     { niche, city, state },
    })

    const jobId = `maps_${Date.now()}`

    return NextResponse.json({
      job: {
        id:              jobId,
        source:          'maps',
        status:          'completed',
        niche:           niche.trim(),
        city:            city.trim(),
        state:           state ?? null,
        maxResults:      max,
        resultsFound:    normalized.length,
        leadsNormalized: normalized.length,
        costEstimate:    parseFloat((Math.ceil(normalized.length / 20) * 0.017).toFixed(4)),
        startedAt:       new Date().toISOString(),
        completedAt:     new Date().toISOString(),
      },
      leads: normalized.map((n, i) => ({
        id:          `lead_${Date.now()}_${i}`,
        name:        n.name,
        website:     n.website  ?? null,
        phone:       n.phone    ?? null,
        address:     n.address  ?? null,
        city:        n.city     ?? null,
        state:       typeof state === 'string' ? state.trim() : null,
        rating:      n.rating,
        reviewCount: n.review_count,
        rawSource:   'maps',
        sourceJob:   jobId,
        normalizedAt: new Date().toISOString(),
        enriched:    false,
      })),
      count: normalized.length,
    })
  } catch (err) {
    console.error('[POST /api/discovery/sources/maps]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Maps search failed.' },
      { status: 500 },
    )
  }
}
