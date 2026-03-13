/**
 * GET /api/n8n/queue
 *
 * Called by n8n on a schedule. Returns the next batch of approved messages
 * ready to send. Atomically marks them as "queued" so they won't be
 * double-fetched on the next poll.
 *
 * Query params:
 *   limit    — max messages to return (default 20, max 100)
 *   channel  — filter by channel (email | sms | linkedin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit   = Math.min(Number(searchParams.get('limit')   ?? 20), 100)
  const channel = searchParams.get('channel')
  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return NextResponse.json({ error: '"accountId" is required.' }, { status: 422 })
  }

  // Fetch approved messages
  let query = supabaseAdmin
    .from('outreach_messages')
    .select(`
      id, company_id, offer, channel, subject, body, sequence_step, angle, scheduled_at,
      companies ( id, name, phone, website, city, state, niche, rating, review_count, top_offer )
    `)
    .eq('account_id', accountId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (channel) query = query.eq('channel', channel)

  const { data: messages, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!messages || messages.length === 0)
    return NextResponse.json({ messages: [], count: 0 })

  // Mark as queued atomically
  const ids = messages.map((m) => m.id)
  await supabaseAdmin
    .from('outreach_messages')
    .update({ status: 'queued' })
    .eq('account_id', accountId)
    .in('id', ids)

  return NextResponse.json({ messages, count: messages.length })
}
