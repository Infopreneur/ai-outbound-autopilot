/**
 * GET /api/workers/discovery
 *
 * Cron worker — picks up the next pending job from `discovery_queue`,
 * runs the Google Places search, scores + upserts results to Supabase.
 *
 * Called every 5 minutes by cron-job.org (free external cron).
 * Safe to call manually for testing.
 */

import { NextResponse }      from 'next/server'
import { runMapsSource }     from '@/lib/discovery/sources/maps'
import { supabaseAdmin }     from '@/lib/supabase/server'
import { logUsage }          from '@/lib/usage/cost-tracker'
import { scoreOpportunity }  from '@/lib/scoring/opportunity-score'

export const maxDuration = 60

export async function GET() {
  // ── Claim the next pending job ────────────────────────────────────────────
  const { data: job, error: fetchErr } = await supabaseAdmin
    .from('discovery_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (fetchErr || !job) {
    return NextResponse.json({ message: 'No pending jobs.' }, { status: 200 })
  }

  await supabaseAdmin
    .from('discovery_queue')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', job.id)

  console.log(`[worker/discovery] Running job ${job.id}: "${job.keyword}" in ${job.city}, ${job.state}`)

  try {
    const { leads, keywords, estimatedCost } = await runMapsSource({
      source:     'maps',
      niche:      job.keyword,
      city:       job.city,
      state:      job.state    ?? undefined,
      maxResults: job.max_results ?? 60,
      industry:   job.industry   ?? undefined,
    })

    if (leads.length > 0) {
      const now  = new Date().toISOString()
      const rows = leads.map((l) => {
        const s = scoreOpportunity({
          name:         l.name,
          niche:        job.keyword,
          website:      l.website      ?? null,
          phone:        l.phone        ?? null,
          city:         l.city         ?? null,
          state:        l.state        ?? null,
          rating:       l.rating       ?? null,
          review_count: l.reviewCount  ?? null,
        })
        return {
          name:                   l.name,
          place_id:               l.placeId      ?? null,
          city:                   l.city         ?? null,
          state:                  l.state        ?? null,
          rating:                 l.rating       ?? null,
          review_count:           l.reviewCount  ?? null,
          phone:                  l.phone        ?? null,
          website:                l.website      ?? null,
          niche:                  job.keyword,
          source:                 'google-native',
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

      const hotCount = rows.filter((r) => r.opportunity_tier === 'hot').length

      const { error: companyErr } = await supabaseAdmin
        .from('companies')
        .upsert(rows, { onConflict: 'place_id' })

      if (companyErr) {
        console.error('[worker/discovery] companies upsert:', companyErr.message)
      } else {
        console.log(`[worker/discovery] ✅ upsert OK — ${leads.length} leads, ${hotCount} hot`)
      }

      // Raw audit trail
      const { error: rawErr } = await supabaseAdmin
        .from('scrape_results_raw')
        .insert(leads.map((l) => ({
          source:      'maps',
          external_id: l.placeId ?? null,
          raw_payload: { name: l.name, place_id: l.placeId, address: l.address, phone: l.phone, website: l.website, rating: l.rating, review_count: l.reviewCount, city: l.city, state: l.state },
        })))
      if (rawErr) console.error('[worker/discovery] scrape_results_raw:', rawErr.message)
    }

    logUsage({
      provider: 'google', service: 'maps-places-api', feature: 'queue-discovery',
      input_units: keywords.length, output_units: leads.length,
      status: 'success', metadata: { job_id: job.id, keyword: job.keyword, city: job.city },
    })

    await supabaseAdmin
      .from('discovery_queue')
      .update({ status: 'completed', completed_at: new Date().toISOString(), results_count: leads.length })
      .eq('id', job.id)

    console.log(`[worker/discovery] ✅ Job ${job.id} done — ${leads.length} leads`)

    return NextResponse.json({ job_id: job.id, keyword: job.keyword, city: job.city, leads: leads.length, cost: estimatedCost })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[worker/discovery] ❌ Job ${job.id} failed:`, message)
    await supabaseAdmin.from('discovery_queue').update({ status: 'failed', error_message: message }).eq('id', job.id)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
