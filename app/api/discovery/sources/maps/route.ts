/**
 * POST /api/discovery/sources/maps
 *
 * Runs a Google Places discovery job — either a single keyword search
 * or a full multi-keyword sweep when an industry preset is supplied.
 *
 * Request body:
 * {
 *   city:        "Phoenix"
 *   state?:      "AZ"
 *   maxResults?: 20
 *
 *   // Option A — industry preset (runs one search per keyword, deduplicates)
 *   industry:    "roofing"
 *
 *   // Option B — free-form single keyword
 *   niche:       "Roofing Contractors"
 * }
 */
console.log("MAPS DISCOVERY ROUTE HIT")
import { NextResponse }             from 'next/server'
import { getAccountContext }        from '@/lib/auth/server'
import { requireAnyRole }           from '@/lib/auth/permissions'
import { runMapsSource }            from '@/lib/discovery/sources/maps'
import { INDUSTRY_PRESETS }         from '@/lib/discovery/industries'
import { supabaseAdmin }            from '@/lib/supabase/server'
import { getUserSupabaseClient }    from '@/lib/supabase/user-server'
import { logUsage }                 from '@/lib/usage/cost-tracker'

export async function POST(req: Request) {
  console.log('🗺️  POST /api/discovery/sources/maps HIT')
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    requireAnyRole(ctx, ['admin'])
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = getUserSupabaseClient(ctx.accessToken)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { niche, city, state, maxResults, industry } = body

  if (!city || typeof city !== 'string') {
    return NextResponse.json({ error: '"city" is required.' }, { status: 422 })
  }

  // Resolve the effective niche label for logging / response
  const industryKey    = typeof industry === 'string' ? industry : null
  const preset         = industryKey ? INDUSTRY_PRESETS[industryKey] : null
  const effectiveNiche = preset
    ? preset.keywords[0]                             // first keyword as the display label
    : typeof niche === 'string' ? niche.trim() : ''

  if (!preset && !effectiveNiche) {
    return NextResponse.json(
      { error: 'Provide either "industry" (preset key) or "niche" (keyword).' },
      { status: 422 },
    )
  }

  const max = Math.min(Number(maxResults ?? 20), 60)

  try {
    const { leads, jobId, rawCount, keywords, estimatedCost } = await runMapsSource({
      source:   'maps',
      niche:    effectiveNiche,
      city:     city.trim(),
      state:    typeof state === 'string' ? state.trim() : undefined,
      maxResults: max,
      industry: industryKey ?? undefined,
    })

    // Persist all leads to Supabase
    if (leads.length > 0) {
      const { error: companyErr } = await supabase
        .from('companies')
        .upsert(
          leads.map((l) => ({
            account_id:    ctx.accountId,
            name:         l.name,
            place_id:     l.placeId      ?? null,
            city:         l.city         ?? null,
            state:        l.state        ?? null,
            rating:       l.rating       ?? null,
            review_count: l.reviewCount  ?? null,
            phone:        l.phone        ?? null,
            website:      l.website      ?? null,
          })),
          { onConflict: 'account_id,place_id', ignoreDuplicates: true },
        )

      if (companyErr) console.error('[maps/route] companies upsert:', companyErr.message)

      // Persist raw payloads for future enrichment / reprocessing
      const { error: rawErr } = await supabaseAdmin
        .from('scrape_results_raw')
        .insert(
          leads.map((l) => ({
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
      if (rawErr) console.error('[maps/route] scrape_results_raw insert:', rawErr.message)
    }

    await supabase
      .from('discovery_jobs')
      .insert({
        account_id:    ctx.accountId,
        name:          `${effectiveNiche}${city ? ` — ${city.trim()}` : ''}`,
        source:        'maps',
        niche:         effectiveNiche,
        city:          city.trim(),
        state:         typeof state === 'string' ? state.trim() : null,
        status:        'completed',
        results_count: leads.length,
      })

    logUsage({
      provider:     'google',
      service:      'maps-places-api',
      feature:      'lead-discovery',
      input_units:  keywords.length,     // one API call per keyword
      output_units: leads.length,
      status:       'success',
      metadata:     { industry: industryKey, keywords, city, state, rawCount },
    })

    return NextResponse.json({
      job: {
        id:              jobId,
        source:          'maps',
        status:          'completed',
        industry:        industryKey,
        keywords,
        niche:           effectiveNiche,
        city:            city.trim(),
        state:           state ?? null,
        maxResults:      max,
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
      { error: err instanceof Error ? err.message : 'Maps search failed.' },
      { status: 500 },
    )
  }
}
