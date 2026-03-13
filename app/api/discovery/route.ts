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
 *   industry?:   "roofing"
 * }
 */
console.log("DISCOVERY ROOT ROUTE HIT")
import { NextResponse }                      from 'next/server'
import { getAccountContext }                 from '@/lib/auth/server'
import { requireAnyRole }                    from '@/lib/auth/permissions'
import { runGooglePlacesDiscovery }           from '@/lib/discovery/google-places'
import { runApifySource }                     from '@/lib/discovery/sources/apify'
import { logUsage }                           from '@/lib/usage/cost-tracker'
import { supabaseAdmin }                      from '@/lib/supabase/server'
import { getUserSupabaseClient }              from '@/lib/supabase/user-server'
import { scoreOpportunity }                   from '@/lib/scoring/opportunity-score'
import type { NormalizedCompanyLead }         from '@/lib/discovery/types'
import type { DiscoveryRunParams, JobSource } from '@/lib/discovery/types'

const VALID_SOURCES: JobSource[] = ['google-places', 'apify', 'maps', 'yelp', 'manual']

// ── Shared helper: score + build upsert rows ──────────────────────────────────
function buildScoredRows(leads: NormalizedCompanyLead[], niche: string, source: string) {
  const now = new Date().toISOString()
  return leads.map((l) => {
    const s = scoreOpportunity({
      name:         l.name,
      niche,
      website:      l.website      ?? null,
      phone:        l.phone        ?? null,
      city:         l.city         ?? null,
      state:        l.state        ?? null,
      rating:       l.rating       ?? null,
      review_count: l.reviewCount  ?? null,
    })
    return {
      name:                   l.name,
      website:                l.website      ?? null,
      phone:                  l.phone        ?? null,
      city:                   l.city         ?? null,
      state:                  l.state        ?? null,
      place_id:               l.placeId      ?? null,
      rating:                 l.rating       ?? null,
      review_count:           l.reviewCount  ?? null,
      niche,
      source,
      // ── scores ─────────────────────────────────────────────────────
      opportunity_score:      s.totalScore,
      opportunity_tier:       s.tier,
      opportunity_reason:     s.reason,
      recommended_offer:      s.recommendedOffer,
      recommended_next_step:  s.recommendedNextStep,
      lead_volume_score:      s.leadVolumeScore,
      followup_gap_score:     s.followupGapScore,
      local_visibility_score: s.localVisibilityScore,
      offer_fit_score:        s.offerFitScore,
      scored_reason: {
        lead_volume:      s.leadVolumeScore,
        followup_gap:     s.followupGapScore,
        local_visibility: s.localVisibilityScore,
        offer_fit:        s.offerFitScore,
        total:            s.totalScore,
        reason:           s.reason,
      },
      top_offer:              s.topOffer,
      offer_fit_breakdown:    s.offerRecommendations,
      last_scored_at:         now,
      last_discovered_at:     now,
    }
  })
}

// ── Count how many place_ids already exist ────────────────────────────────────
async function countExisting(
  accountId: string,
  placeIds: (string | null)[],
  supabase: ReturnType<typeof getUserSupabaseClient>,
): Promise<number> {
  const ids = placeIds.filter(Boolean) as string[]
  if (ids.length === 0) return 0
  const { count } = await supabase
    .from('companies')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .in('place_id', ids)
  return count ?? 0
}

export async function POST(req: Request) {
  console.log('🎯 POST /api/discovery HIT')

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
    city:       typeof city     === 'string' ? city.trim()  : undefined,
    state:      typeof state    === 'string' ? state.trim() : undefined,
    maxResults: Math.min(Number(maxResults ?? 20), 200),
    industry:   typeof industry === 'string' ? industry     : undefined,
  }

  try {
    switch (source) {

      case 'google-places':
      case 'maps': {
        const startedAt   = new Date().toISOString()
        const result      = await runGooglePlacesDiscovery(params)
        const completedAt = new Date().toISOString()

        let insertedCount = 0
        let updatedCount  = 0
        let hotCount      = 0

        if (result.leads.length > 0) {
          const rows = buildScoredRows(result.leads, params.niche, 'google-native')
            .map((row) => ({ ...row, account_id: ctx.accountId }))
          hotCount = rows.filter((r) => r.opportunity_tier === 'hot').length

          // Count pre-existing to calculate inserted vs updated
          const existing = await countExisting(ctx.accountId, result.leads.map((l) => l.placeId ?? null), supabase)
          insertedCount  = result.leads.length - existing
          updatedCount   = existing

          console.log(`[discovery/route] upserting ${rows.length} companies (${insertedCount} new, ${updatedCount} updated)…`)

          const { error: companyErr } = await supabase
            .from('companies')
            .upsert(rows, { onConflict: 'account_id,place_id' })

          if (companyErr) {
            console.error('[discovery/route] ❌ companies upsert FAILED', companyErr.message)
          } else {
            console.log(`[discovery/route] ✅ upsert OK — ${insertedCount} new, ${updatedCount} updated, ${hotCount} hot`)
          }

          // Raw audit trail
          const { error: rawErr } = await supabaseAdmin
            .from('scrape_results_raw')
            .insert(result.leads.map((l) => ({
              source:      'maps',
              external_id: l.placeId ?? null,
              raw_payload: { name: l.name, place_id: l.placeId, address: l.address, phone: l.phone, website: l.website, rating: l.rating, review_count: l.reviewCount, city: l.city, state: l.state },
            })))
          if (rawErr) console.error('[discovery/route] scrape_results_raw:', rawErr.message)
        }

        // discovery_jobs record
        await supabase.from('discovery_jobs').insert({
          account_id:    ctx.accountId,
          name:          `${params.niche}${params.city ? ` — ${params.city}` : ''}`,
          source:        'google-native',
          niche:         params.niche,
          city:          params.city  ?? null,
          state:         params.state ?? null,
          status:        'completed',
          results_count: result.leads.length,
        })

        logUsage({
          provider: 'google', service: 'maps-places-api', feature: 'lead-discovery',
          input_units: result.keywords.length, output_units: result.leads.length,
          status: 'success', metadata: { source, city, state, usedFallback: result.usedFallback },
        })

        const topScored = [...result.leads]
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 3)
          .map((l) => ({ name: l.name, city: l.city, rating: l.rating }))

        return NextResponse.json({
          count:         result.leads.length,
          insertedCount,
          updatedCount,
          hotCount,
          topScored,
          job: {
            id: result.jobId, source, status: 'completed',
            niche: params.niche, city: params.city ?? null, state: params.state ?? null,
            costEstimate: result.estimatedCost, keywords: result.keywords,
            usedFallback: result.usedFallback, startedAt, completedAt,
          },
        })
      }

      case 'apify': {
        const result = await runApifySource(params)

        let insertedCount = 0
        let updatedCount  = 0
        let hotCount      = 0

        if (result.leads.length > 0) {
          const rows = buildScoredRows(result.leads, params.niche, 'apify')
            .map((row) => ({ ...row, account_id: ctx.accountId }))
          hotCount = rows.filter((r) => r.opportunity_tier === 'hot').length

          const existing = await countExisting(ctx.accountId, result.leads.map((l) => l.placeId ?? null), supabase)
          insertedCount  = result.leads.length - existing
          updatedCount   = existing

          const { error: companyErr } = await supabase
            .from('companies')
            .upsert(rows, { onConflict: 'account_id,place_id' })
          if (companyErr) console.error('[apify] companies upsert:', companyErr.message)
          else console.log(`[apify] ✅ upsert OK — ${insertedCount} new, ${updatedCount} updated`)
        }

        logUsage({
          provider: 'apify', service: 'google-maps-scraper', feature: 'lead-discovery',
          input_units: 0, output_units: result.leads.length,
          status: 'success', metadata: { source, city, state },
        })

        return NextResponse.json({
          count:         result.leads.length,
          insertedCount,
          updatedCount,
          hotCount,
          job: {
            id: result.runId, source, status: 'completed',
            niche: params.niche, city: params.city ?? null, state: params.state ?? null,
            costEstimate: result.estimatedCost,
            startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
          },
        })
      }

      case 'yelp':
        return NextResponse.json({ error: 'Yelp (ScraperAPI) discovery is not yet implemented.' }, { status: 501 })

      case 'manual':
        return NextResponse.json({ error: 'Manual entry does not use the discovery API.' }, { status: 400 })

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
