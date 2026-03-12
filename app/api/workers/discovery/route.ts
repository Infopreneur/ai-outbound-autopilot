/**
 * GET /api/workers/discovery
 *
 * Cron worker — picks up the next pending job from `discovery_queue`,
 * runs the Google Places search, and upserts results to Supabase.
 *
 * Called every minute by Vercel Cron (vercel.json).
 * Safe to call manually for testing.
 */

import { NextResponse }      from 'next/server'
import { runMapsSource }     from '@/lib/discovery/sources/maps'
import { supabaseAdmin }     from '@/lib/supabase/server'
import { logUsage }          from '@/lib/usage/cost-tracker'

export const maxDuration = 60 // seconds — Vercel function timeout

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

  // Mark as running to prevent double-processing
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
      state:      job.state ?? undefined,
      maxResults: job.max_results ?? 60,
      industry:   job.industry    ?? undefined,
    })

    // ── Upsert companies ────────────────────────────────────────────────────
    if (leads.length > 0) {
      const { error: companyErr } = await supabaseAdmin
        .from('companies')
        .upsert(
          leads.map((l) => ({
            name:         l.name,
            place_id:     l.placeId      ?? null,
            city:         l.city         ?? null,
            state:        l.state        ?? null,
            rating:       l.rating       ?? null,
            review_count: l.reviewCount  ?? null,
            phone:        l.phone        ?? null,
            website:      l.website      ?? null,
          })),
          { onConflict: 'place_id', ignoreDuplicates: true },
        )

      if (companyErr) console.error('[worker/discovery] companies upsert:', companyErr.message)

      // ── Persist raw payloads ──────────────────────────────────────────────
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
      if (rawErr) console.error('[worker/discovery] scrape_results_raw insert:', rawErr.message)
    }

    // ── Log usage ───────────────────────────────────────────────────────────
    logUsage({
      provider:     'google',
      service:      'maps-places-api',
      feature:      'queue-discovery',
      input_units:  keywords.length,
      output_units: leads.length,
      status:       'success',
      metadata:     { job_id: job.id, keyword: job.keyword, city: job.city },
    })

    // ── Mark completed ──────────────────────────────────────────────────────
    await supabaseAdmin
      .from('discovery_queue')
      .update({
        status:        'completed',
        completed_at:  new Date().toISOString(),
        results_count: leads.length,
      })
      .eq('id', job.id)

    console.log(`[worker/discovery] ✅ Job ${job.id} done — ${leads.length} leads`)

    return NextResponse.json({
      job_id:  job.id,
      keyword: job.keyword,
      city:    job.city,
      leads:   leads.length,
      cost:    estimatedCost,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[worker/discovery] ❌ Job ${job.id} failed:`, message)

    await supabaseAdmin
      .from('discovery_queue')
      .update({ status: 'failed', error_message: message })
      .eq('id', job.id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
