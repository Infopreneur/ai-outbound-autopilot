/**
 * PATCH /api/outreach/messages/[id]  — update status (approve, queue, etc.)
 * DELETE /api/outreach/messages/[id] — delete a message
 */
import { NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }

  const allowed = ['status', 'subject', 'body', 'scheduled_at']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 422 })

  const { data, error } = await supabase
    .from('outreach_messages')
    .update(update)
    .eq('id', id)
    .eq('account_id', ctx.accountId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  const { id } = await params
  const { error } = await supabase
    .from('outreach_messages')
    .delete()
    .eq('id', id)
    .eq('account_id', ctx.accountId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: id })
}
