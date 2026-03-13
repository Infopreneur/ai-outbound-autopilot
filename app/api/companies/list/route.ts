import { NextRequest, NextResponse } from 'next/server'
import { getAccountContext }         from '@/lib/auth/server'
import { getUserSupabaseClient }     from '@/lib/supabase/user-server'

const VALID_SORT = new Set(['created_at', 'opportunity_score', 'review_count', 'rating', 'name'])

export async function GET(req: NextRequest) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const p = req.nextUrl.searchParams
  const supabase = getUserSupabaseClient(ctx.accessToken)

  const search   = p.get('search')   ?? ''
  const niche    = p.get('niche')    ?? ''
  const city     = p.get('city')     ?? ''
  const state    = p.get('state')    ?? ''
  const source   = p.get('source')   ?? ''
  const tier     = p.get('tier')     ?? ''
  const strategy = p.get('strategy') ?? ''
  const minScore = parseInt(p.get('minScore') ?? '0') || 0
  const sortBy   = VALID_SORT.has(p.get('sortBy') ?? '') ? (p.get('sortBy') as string) : 'created_at'
  const ascending = p.get('sortOrder') === 'asc'
  const page     = Math.max(1, parseInt(p.get('page')     ?? '1')   || 1)
  const pageSize = Math.min(500, Math.max(10, parseInt(p.get('pageSize') ?? '100') || 100))

  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' })
    .eq('account_id', ctx.accountId)

  if (search)   query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,website.ilike.%${search}%`)
  if (niche)    query = query.ilike('niche', `%${niche}%`)
  if (city)     query = query.ilike('city', `%${city}%`)
  if (state)    query = query.eq('state', state.toUpperCase())
  if (source)   query = query.eq('source', source)
  if (tier)     query = query.eq('opportunity_tier', tier)
  if (strategy) query = query.eq('strategy', strategy)
  if (minScore) query = query.gte('opportunity_score', minScore)

  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  const { data, error, count } = await query
    .order(sortBy, { ascending, nullsFirst: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    companies: data ?? [],
    total:     count ?? 0,
    page,
    pageSize,
    pages:     Math.ceil((count ?? 0) / pageSize),
  })
}
