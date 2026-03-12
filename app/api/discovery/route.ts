/**
 * POST /api/discovery
 *
 * Unified discovery dispatcher — routes to the correct source connector
 * based on the "source" field in the request body.
 *
 * Request body:
 * {
 *   source:      "google-places" | "apify" | "yelp" | "manual"
 *   niche:       "Roofing Contractors"
 *   city?:       "Phoenix"
 *   state?:      "AZ"
 *   maxResults?: 50
 *   industry?:   "roofing"   ← drives multi-keyword for google-places
 * }
 */

import { NextResponse }                   from 'next/server'
import { runGooglePlacesDiscovery }        from '@/lib/discovery/google-places'
import { runApifySource }                  from '@/lib/discovery/sources/apify'
import { logUsage }                        from '@/lib/usage/cost-tracker'
import type { DiscoveryRunParams, JobSource } from '@/lib/discovery/types'

const VALID_SOURCES: JobSource[] = ['google-places', 'apify', 'maps', 'yelp', 'manual']

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { niche, city, state, maxResults, industry } = body
  const source = (body.source as JobSource) ?? 'google-places'

  if (!VALID_SOURCES.includes(source)) {
    return NextResponse.json(
      { error: `"source" must be one of: ${VALID_SOURCES.join(', ')}` },
      { status: 422 },
    )
  }
  if (!niche || typeof niche !== 'string' || niche.trim() === '') {
    return NextResponse.json({ error: '"niche" is required.' }, { status: 422 })
  }

  const params: DiscoveryRunParams = {
    source,
    niche:      niche.trim(),
    city:       typeof city     === 'string' ? city.trim()     : undefined,
    state:      typeof state    === 'string' ? state.trim()    : undefined,
    maxResults: Math.min(Number(maxResults ?? 20), 200),
    industry:   typeof industry === 'string' ? industry        : undefined,
  }

  try {
    switch (source) {

      case 'google-places':
      case 'maps': {
        const result = await runGooglePlacesDiscovery(params)

        logUsage({
          provider:     'google',
          service:      'maps-places-api',
          feature:      'lead-discovery',
          input_units:  result.keywords.length,
          output_units: result.leads.length,
          status:       'success',
          metadata:     { source, city, state, usedFallback: result.usedFallback },
        })

        return NextResponse.json({
          job: {
            id:              result.jobId,
            source,
            status:          'completed',
            niche:           params.niche,
            city:            params.city ?? null,
            state:           params.state ?? null,
            maxResults:      params.maxResults,
            resultsFound:    result.leads.length,
            leadsNormalized: result.leads.length,
            costEstimate:    result.estimatedCost,
            keywords:        result.keywords,
            usedFallback:    result.usedFallback,
            startedAt:       new Date().toISOString(),
            completedAt:     new Date().toISOString(),
          },
          leads: result.leads,
          count: result.leads.length,
        })
      }

      case 'apify': {
        const result = await runApifySource(params)

        logUsage({
          provider:     'apify',
          service:      'google-maps-scraper',
          feature:      'lead-discovery',
          input_units:  0,
          output_units: result.leads.length,
          status:       'success',
          metadata:     { source, city, state },
        })

        return NextResponse.json({
          job: {
            id:              result.runId,
            source,
            status:          'completed',
            niche:           params.niche,
            city:            params.city ?? null,
            state:           params.state ?? null,
            maxResults:      params.maxResults,
            resultsFound:    result.leads.length,
            leadsNormalized: result.leads.length,
            costEstimate:    result.estimatedCost,
            startedAt:       new Date().toISOString(),
            completedAt:     new Date().toISOString(),
          },
          leads: result.leads,
          count: result.leads.length,
        })
      }

      case 'yelp':
        return NextResponse.json(
          { error: 'Yelp (ScraperAPI) discovery is not yet implemented.' },
          { status: 501 },
        )

      case 'manual':
        return NextResponse.json(
          { error: 'Manual entry does not use the discovery API.' },
          { status: 400 },
        )

      default:
        return NextResponse.json({ error: 'Unknown source.' }, { status: 400 })
    }
  } catch (err) {
    console.error('[POST /api/discovery]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Discovery failed.' },
      { status: 500 },
    )
  }
}
