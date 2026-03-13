import { NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'

export async function POST(req: Request) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  const body = await req.json()
  const { leads } = body

  if (!Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: '"leads" must be a non-empty array.' }, { status: 422 })
  }

  const rows = leads.map((lead: Record<string, unknown>) => ({
    account_id:    ctx.accountId,
    name:         lead.name         ?? null,
    city:         lead.city         ?? null,
    state:        lead.state        ?? null,
    website:      lead.website      ?? null,
    phone:        lead.phone        ?? null,
    rating:       lead.rating       ?? null,
    review_count: lead.reviewCount  ?? lead.review_count ?? null,
    place_id:     lead.placeId      ?? lead.place_id     ?? null,
  }))

  const { error } = await supabase
    .from('companies')
    .upsert(rows, { onConflict: 'account_id,place_id', ignoreDuplicates: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ saved: rows.length })
}
