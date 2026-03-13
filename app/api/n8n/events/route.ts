/**
 * POST /api/n8n/events
 *
 * Receives delivery/engagement events from n8n after sending messages.
 * n8n calls this webhook to report: sent, opened, clicked, replied, bounced.
 *
 * Body: {
 *   messageId:  string        — outreach_messages.id
 *   companyId:  string        — companies.id
 *   eventType:  'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed'
 *   metadata?:  object        — any extra data (email, timestamp, etc.)
 * }
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const VALID_EVENTS = ['sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed'] as const
type EventType = typeof VALID_EVENTS[number]

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }

  const { messageId, companyId, eventType, metadata } = body

  if (!messageId || typeof messageId !== 'string')
    return NextResponse.json({ error: '"messageId" required.' }, { status: 422 })
  if (!companyId || typeof companyId !== 'string')
    return NextResponse.json({ error: '"companyId" required.' }, { status: 422 })
  if (!VALID_EVENTS.includes(eventType as EventType))
    return NextResponse.json({ error: `"eventType" must be one of: ${VALID_EVENTS.join(', ')}` }, { status: 422 })

  // Insert event
  const { error: eventErr } = await supabaseAdmin
    .from('outreach_events')
    .insert({
      message_id:  messageId,
      company_id:  companyId,
      event_type:  eventType,
      metadata:    metadata ?? null,
      occurred_at: new Date().toISOString(),
    })

  if (eventErr) {
    console.error('[n8n/events] insert error:', eventErr.message)
    return NextResponse.json({ error: eventErr.message }, { status: 500 })
  }

  // Update message status based on event
  const statusMap: Partial<Record<EventType, string>> = {
    sent:         'sent',
    bounced:      'failed',
    unsubscribed: 'failed',
  }
  const newStatus = statusMap[eventType as EventType]

  if (newStatus) {
    const update: Record<string, unknown> = { status: newStatus }
    if (eventType === 'sent') update.sent_at = new Date().toISOString()

    await supabaseAdmin
      .from('outreach_messages')
      .update(update)
      .eq('id', messageId)
  }

  // Advance sequence if replied — mark sequence as won
  if (eventType === 'replied') {
    const { data: msg } = await supabaseAdmin
      .from('outreach_messages')
      .select('company_id')
      .eq('id', messageId)
      .single()

    if (msg) {
      await supabaseAdmin
        .from('outreach_sequences')
        .update({ status: 'replied' })
        .eq('company_id', msg.company_id)
        .eq('status', 'active')
    }
  }

  return NextResponse.json({ ok: true, eventType, messageId })
}
