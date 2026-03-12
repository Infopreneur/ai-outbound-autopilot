/**
 * POST /api/discovery/sources/apify
 *
 * Low-level Apify-specific endpoint.
 * Use this when you need direct control over actor selection or input schema,
 * rather than the generic /api/discovery/run wrapper.
 *
 * Request body:
 * {
 *   niche:       "Roofing Contractors"
 *   city?:       "Phoenix"
 *   state?:      "AZ"
 *   maxResults?: 100
 *   actorKey?:   "googleMaps" | "yelp" | "yellowPages"  // default: googleMaps
 * }
 */

import { NextRequest, NextResponse }   from 'next/server'
import { runApifyDiscovery, APIFY_ACTORS, type ApifyActorKey } from '@/lib/discovery/apify'
import { logUsage }                    from '@/lib/usage/cost-tracker'
import type { DiscoveryRunParams }     from '@/lib/discovery/types'

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

  const actorKey = (b.actorKey as ApifyActorKey) ?? 'googleMaps'
  if (!Object.keys(APIFY_ACTORS).includes(actorKey)) {
    return NextResponse.json(
      { error: `"actorKey" must be one of: ${Object.keys(APIFY_ACTORS).join(', ')}` },
      { status: 422 },
    )
  }

  const params: DiscoveryRunParams = {
    source:     'apify',
    niche:      b.niche.trim(),
    city:       typeof b.city  === 'string' ? b.city.trim()  : undefined,
    state:      typeof b.state === 'string' ? b.state.trim() : undefined,
    maxResults: Math.min(Number(b.maxResults ?? 50), 200),
  }

  try {
    const { leads, runId, rawCount, estimatedCost } = await runApifyDiscovery(params)

    logUsage({
      provider:     'apify',
      service:      actorKey === 'googleMaps' ? 'google-maps-scraper'
                  : actorKey === 'yelp'       ? 'yelp-scraper'
                  :                             'yellow-pages-scraper',
      feature:      'lead-discovery',
      input_units:  0,
      output_units: leads.length,
      status:       'success',
      metadata:     { runId, rawCount, actorId: APIFY_ACTORS[actorKey] },
    })

    return NextResponse.json({
      runId,
      actorId:       APIFY_ACTORS[actorKey],
      rawCount,
      leadsFound:    leads.length,
      estimatedCost,
      leads,
    })
  } catch (err) {
    console.error('[POST /api/discovery/sources/apify]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Apify discovery failed.' },
      { status: 500 },
    )
  }
}
