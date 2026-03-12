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
console.log("DISCOVERY ROOT ROUTE HIT")
import { NextResponse }                      from 'next/server'
import { runGooglePlacesDiscovery }           from '@/lib/discovery/google-places'
import { runApifySource }                     from '@/lib/discovery/sources/apify'
import { logUsage }                           from '@/lib/usage/cost-tracker'
import { supabaseAdmin }                      from '@/lib/supabase/server'
import type { DiscoveryRunParams, JobSource } from '@/lib/discovery/types'

const VALID_SOURCES: JobSource[] = ['google-places', 'apify', 'maps', 'yelp', 'manual']

export async function POST(req: Request) {
  console.log('🎯 POST /api/discovery HIT')

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
        const startedAt = new Date().toISOString()
        const result    = await runGooglePlacesDiscovery(params)
        const completedAt = new Date().toISOString()

        // ── Upsert companies (conflict on place_id) ──────────────────────
        if (result.leads.length > 0) {
          console.log(`[discovery/route] upserting ${result.leads.length} companies to Supabase…`)

          const { data: companyData, error: companyErr } = await supabaseAdmin
            .from('companies')
            .upsert(
              result.leads.map((l) => ({
                name:         l.name,
                website:      l.website      ?? null,
                phone:        l.phone        ?? null,
                city:         l.city         ?? null,
                state:        l.state        ?? null,
                place_id:     l.placeId      ?? null,
                rating:       l.rating       ?? null,
                review_count: l.reviewCount  ?? null,
              })),
              { onConflict: 'place_id', ignoreDuplicates: true },
            )

          if (companyErr) {
            console.error('[discovery/route] ❌ companies upsert FAILED')
            console.error('  message:', companyErr.message)
            console.error('  code:   ', companyErr.code)
            console.error('  details:', companyErr.details)
            console.error('  hint:   ', companyErr.hint)
          } else {
            console.log(`[discovery/route] ✅ companies upsert OK — ${result.leads.length} rows`)
          }

          // ── Persist raw scraper payloads ───────────────────────────────────
          const { error: rawErr } = await supabaseAdmin
            .from('scrape_results_raw')
            .insert(
              result.leads.map((l) => ({
                source:      'maps',
                external_id: l.placeId ?? null,
                raw_payload: {
                  name:         l.name,
                  place_id:     l.placeId,
                  address:      l.address,
                  phone:        l.phone,
                  website:      l.website,
                  rating:       l.rating,
                  review_count: l.reviewCount,
                  city:         l.city,
                  state:        l.state,
                },
              })),
            )
          if (rawErr) console.error('[discovery/route] scrape_results_raw insert:', rawErr.message)
        }

        // ── Insert discovery_jobs row ─────────────────────────────────────
        console.log(`[discovery/route] inserting discovery_jobs row — niche="${params.niche}" city="${params.city}"`)

        const { data: jobData, error: jobErr } = await supabaseAdmin
          .from('discovery_jobs')
          .insert({
            name:          `${params.niche}${params.city ? ` — ${params.city}` : ''}`,
            source:        'google-native',
            niche:         params.niche,
            city:          params.city    ?? null,
            state:         params.state   ?? null,
            status:        'completed',
            results_count: result.leads.length,
          })
          .select()

        if (jobErr) {
          console.error('[discovery/route] ❌ discovery_jobs insert FAILED')
          console.error('  message:', jobErr.message)
          console.error('  code:   ', jobErr.code)
          console.error('  details:', jobErr.details)
          console.error('  hint:   ', jobErr.hint)
        } else {
          console.log('[discovery/route] ✅ discovery_jobs insert OK:', jobData)
        }

        // ── Log usage ─────────────────────────────────────────────────────
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
            startedAt,
            completedAt,
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
