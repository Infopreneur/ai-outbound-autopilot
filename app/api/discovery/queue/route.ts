/**
 * POST /api/discovery/queue
 *
 * Bulk-seed the discovery_queue table.
 *
 * Request body:
 * {
 *   industry:    "hvac"
 *   keywords:    ["HVAC contractor", "air conditioning repair", "AC service"]
 *   cities:      ["Phoenix", "Mesa", "Scottsdale"]
 *   state:       "AZ"
 *   maxResults?: 60   ← per job (default 60)
 * }
 *
 * Creates one row per keyword × city combination.
 * Skips pairs already queued (conflict on keyword + city + state).
 *
 * GET /api/discovery/queue
 * Returns queue status summary.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { industry, keywords, cities, state, maxResults = 60 } = body

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return NextResponse.json({ error: '"keywords" must be a non-empty array.' }, { status: 422 })
  }
  if (!Array.isArray(cities) || cities.length === 0) {
    return NextResponse.json({ error: '"cities" must be a non-empty array.' }, { status: 422 })
  }

  const rows = (keywords as string[]).flatMap((keyword) =>
    (cities as string[]).map((city) => ({
      industry:    typeof industry === 'string' ? industry : null,
      keyword,
      city,
      state:       typeof state === 'string' ? state : null,
      max_results: Number(maxResults),
      status:      'pending',
    })),
  )

  const { data, error } = await supabaseAdmin
    .from('discovery_queue')
    .upsert(rows, { onConflict: 'keyword,city,state', ignoreDuplicates: true })
    .select('id')

  if (error) {
    console.error('[POST /api/discovery/queue]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    queued:  rows.length,
    jobs:    keywords.length,
    cities:  cities.length,
    message: `${rows.length} jobs queued (${keywords.length} keywords × ${cities.length} cities)`,
  }, { status: 201 })
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('discovery_queue')
    .select('status')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    total:     data?.length ?? 0,
    pending:   counts.pending   ?? 0,
    running:   counts.running   ?? 0,
    completed: counts.completed ?? 0,
    failed:    counts.failed    ?? 0,
  })
}
