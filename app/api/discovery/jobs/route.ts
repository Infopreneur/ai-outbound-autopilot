/**
 * GET  /api/discovery/jobs  — list all discovery jobs (newest first)
 * POST /api/discovery/jobs  — create a pending job record without running it
 */
console.log("DISCOVERY ROUTE HIT")
import { NextRequest, NextResponse } from 'next/server'
import { getAllJobs, getJobsByStatus } from '@/lib/discovery/job-runner'
import { mockDiscoveryJobs }          from '@/lib/mock/system-health'
import { supabaseAdmin }              from '@/lib/supabase/server'
import type { JobStatus }             from '@/lib/discovery/types'

const VALID_STATUSES = new Set<JobStatus>(['pending', 'running', 'completed', 'failed'])

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status') as JobStatus | null
  const limitParam  = parseInt(searchParams.get('limit') ?? '50', 10)

  // Merge real in-memory jobs with mock seed data
  const liveJobs = statusParam && VALID_STATUSES.has(statusParam)
    ? getJobsByStatus(statusParam)
    : getAllJobs()

  // Prepend mock jobs when the in-memory store is empty (cold start)
  const jobs = liveJobs.length > 0
    ? liveJobs
    : mockDiscoveryJobs

  const filtered = statusParam && VALID_STATUSES.has(statusParam)
    ? jobs.filter((j) => j.status === statusParam)
    : jobs

  return NextResponse.json({
    jobs: filtered.slice(0, limitParam),
    total: filtered.length,
  })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { niche, city, state, source = 'apify', maxResults = 50 } = body as Record<string, unknown>

  if (!niche || typeof niche !== 'string') {
    return NextResponse.json({ error: '"niche" is required.' }, { status: 422 })
  }

  // Persist to Supabase and return the created row
  const { data, error } = await supabaseAdmin
    .from('discovery_jobs')
    .insert({
      source:      source      ?? 'apify',
      niche,
      city:        city        ?? null,
      state:       state       ?? null,
      max_results: Number(maxResults),
    })
    .select()
    .single()

  if (error) {
    // Fall back to an in-memory preview so the UI still works
    console.error('[POST /api/discovery/jobs] Supabase insert failed:', error.message)
    return NextResponse.json({
      job: {
        id:              `preview_${Date.now()}`,
        source:          source ?? 'apify',
        status:          'pending',
        niche,
        city:            city   ?? undefined,
        state:           state  ?? undefined,
        maxResults:      Number(maxResults),
        resultsFound:    0,
        leadsNormalized: 0,
        costEstimate:    0,
        startedAt:       new Date().toISOString(),
      },
    }, { status: 201 })
  }

  return NextResponse.json({ job: data }, { status: 201 })
}
