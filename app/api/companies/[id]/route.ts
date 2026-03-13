import { NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  const { id } = await params
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .eq('account_id', ctx.accountId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Company not found.' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// allow patching the company record for prospect edits
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  const { id } = await params
  const body = await req.json()
  const allowed: Record<string, unknown> = {}
  const fields = [
    'name','website','phone','city','state','rating','review_count',
    'opportunity_score','opportunity_tier','opportunity_reason',
    'recommended_offer','recommended_next_step',
    'strategy','deep_dive_note','source_url','converted_to_deal',
  ]
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      allowed[f] = body[f]
    }
  }
  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 422 })
  }
  const { data, error } = await supabase
    .from('companies')
    .update(allowed)
    .eq('id', id)
    .eq('account_id', ctx.accountId)
    .select()
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ company: data })
}
