/**
 * GET  /api/discovery/jobs  — list all discovery jobs (newest first)
 * POST /api/discovery/jobs  — create a pending job record without running it
 */
console.log("DISCOVERY ROUTE HIT")
import { NextRequest, NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { requireAnyRole } from '@/lib/auth/permissions'
import { getAllJobs, getJobsByStatus } from '@/lib/discovery/job-runner'
import { mockDiscoveryJobs }          from '@/lib/mock/system-health'
import { getUserSupabaseClient }      from '@/lib/supabase/user-server'
import type { JobStatus }             from '@/lib/discovery/types'

const VALID_STATUSES = new Set<JobStatus>(['pending', 'running', 'completed', 'failed'])

export async function GET(request: NextRequest) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status') as JobStatus | null
  const limitParam  = parseInt(searchParams.get('limit') ?? '50', 10)

  let query = supabase
    .from('discovery_jobs')
    .select('*', { count: 'exact' })
    .eq('account_id', ctx.accountId)
    .order('created_at', { ascending: false })
    .limit(limitParam)

  if (statusParam && VALID_STATUSES.has(statusParam)) {
    query = query.eq('status', statusParam)
  }

  const { data, error, count } = await query
  if (error) {
    const liveJobs = statusParam && VALID_STATUSES.has(statusParam)
      ? getJobsByStatus(statusParam)
      : getAllJobs()
    const jobs = liveJobs.length > 0 ? liveJobs : mockDiscoveryJobs
    const filtered = statusParam && VALID_STATUSES.has(statusParam)
      ? jobs.filter((j) => j.status === statusParam)
      : jobs

    return NextResponse.json({
      jobs: filtered.slice(0, limitParam),
      total: filtered.length,
    })
  }

  return NextResponse.json({
    jobs: data ?? [],
    total: count ?? (data?.length ?? 0),
  })
}

export async function POST(request: NextRequest) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    requireAnyRole(ctx, ['admin'])
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = getUserSupabaseClient(ctx.accessToken)

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
  const { data, error } = await supabase
    .from('discovery_jobs')
    .insert({
      account_id:   ctx.accountId,
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
