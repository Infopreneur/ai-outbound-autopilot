/**
 * GET  /api/outreach/messages  — list messages (with filters)
 * POST /api/outreach/messages  — save a message (draft or approved)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAccountContext }         from '@/lib/auth/server'
import { getUserSupabaseClient }     from '@/lib/supabase/user-server'

export async function GET(req: NextRequest) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  const { searchParams } = new URL(req.url)
  const status    = searchParams.get('status')     // draft | approved | queued | sent
  const companyId = searchParams.get('companyId')
  const offerId   = searchParams.get('offerId')
  const limit     = Math.min(Number(searchParams.get('limit') ?? 100), 500)

  let query = supabase
    .from('outreach_messages')
    .select(`
      *,
      companies ( id, name, city, state, niche, opportunity_tier )
    `)
    .eq('account_id', ctx.accountId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status)    query = query.eq('status', status)
  if (companyId) query = query.eq('company_id', companyId)
  if (offerId)   query = query.eq('offer', offerId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ messages: data ?? [] })
}

export async function POST(req: Request) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }

  const {
    companyId, offer, channel, subject, messageBody,
    status = 'draft', sequenceStep = 1, scheduledAt,
    angle, reportUrl,
  } = body

  if (!companyId || !offer || !channel || !messageBody)
    return NextResponse.json({ error: 'companyId, offer, channel, and messageBody are required.' }, { status: 422 })

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('account_id', ctx.accountId)
    .maybeSingle()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Company not found.' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('outreach_messages')
    .insert({
      account_id:    ctx.accountId,
      company_id:    companyId,
      offer,
      channel,
      subject:       subject       ?? null,
      body:          messageBody,
      status,
      sequence_step: sequenceStep,
      scheduled_at:  scheduledAt   ?? null,
      angle:         angle         ?? null,
      // report_url:    reportUrl     ?? null, // TODO: add column migration
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
