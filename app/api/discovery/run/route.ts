/**
 * POST /api/discovery/run
 *
 * Execute a full lead discovery job end-to-end:
 *  1. Validate params
 *  2. Run the appropriate connector (Apify, etc.)
 *  3. Return job record + normalized leads
 *
 * Request body:
 * {
 *   source:     "apify"          // JobSource
 *   niche:      "Roofing Contractors"
 *   city?:      "Phoenix"
 *   state?:     "AZ"
 *   maxResults?: 50
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { runDiscoveryJob }           from '@/lib/discovery/job-runner'
import { logUsage }                  from '@/lib/usage/cost-tracker'
import type { DiscoveryRunParams, JobSource } from '@/lib/discovery/types'

const VALID_SOURCES: JobSource[] = ['apify', 'maps', 'scraperapi', 'manual', 'csv']

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!b.niche || typeof b.niche !== 'string' || b.niche.trim() === '') {
    return NextResponse.json({ error: '"niche" is required and must be a non-empty string.' }, { status: 422 })
  }

  const source = (b.source as JobSource) ?? 'apify'
  if (!VALID_SOURCES.includes(source)) {
    return NextResponse.json(
      { error: `"source" must be one of: ${VALID_SOURCES.join(', ')}` },
      { status: 422 },
    )
  }

  const maxResults = Math.min(Number(b.maxResults ?? 50), 200)

  const params: DiscoveryRunParams = {
    source,
    niche:      b.niche.trim(),
    city:       typeof b.city  === 'string' ? b.city.trim()  : undefined,
    state:      typeof b.state === 'string' ? b.state.trim() : undefined,
    maxResults,
  }

  // ── Execute ───────────────────────────────────────────────────────────────
  try {
    const { job, leads } = await runDiscoveryJob(params)

    // Log usage for cost tracking
    logUsage({
      provider:     params.source === 'maps' ? 'google' : 'apify',
      service:      params.source === 'maps' ? 'maps-places-api' : 'google-maps-scraper',
      feature:      'lead-discovery',
      input_units:  0,
      output_units: leads.length,
      status:       job.status === 'completed' ? 'success' : 'error',
      metadata:     { jobId: job.id, niche: params.niche, source: params.source },
    })

    return NextResponse.json({ job, leads, count: leads.length }, { status: 200 })
  } catch (err) {
    console.error('[POST /api/discovery/run]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Discovery job failed.' },
      { status: 500 },
    )
  }
}
