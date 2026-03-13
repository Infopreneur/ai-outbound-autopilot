/**
 * GET  /api/outreach/messages  — list messages (with filters)
 * POST /api/outreach/messages  — save a message (draft or approved)
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status    = searchParams.get('status')     // draft | approved | queued | sent
  const companyId = searchParams.get('companyId')
  const offerId   = searchParams.get('offerId')
  const limit     = Math.min(Number(searchParams.get('limit') ?? 100), 500)

  let query = supabaseAdmin
    .from('outreach_messages')
    .select(`
      *,
      companies ( id, name, city, state, niche, opportunity_tier )
    `)
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
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }

  const {
    companyId, offer, channel, subject, messageBody,
    status = 'draft', sequenceStep = 1, scheduledAt,
    angle,
  } = body

  if (!companyId || !offer || !channel || !messageBody)
    return NextResponse.json({ error: 'companyId, offer, channel, and messageBody are required.' }, { status: 422 })

  const { data, error } = await supabaseAdmin
    .from('outreach_messages')
    .insert({
      company_id:    companyId,
      offer,
      channel,
      subject:       subject       ?? null,
      body:          messageBody,
      status,
      sequence_step: sequenceStep,
      scheduled_at:  scheduledAt   ?? null,
      angle:         angle         ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
