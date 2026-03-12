import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { leads } = body

  if (!Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: '"leads" must be a non-empty array.' }, { status: 422 })
  }

  const rows = leads.map((lead: Record<string, unknown>) => ({
    name:         lead.name         ?? null,
    city:         lead.city         ?? null,
    state:        lead.state        ?? null,
    website:      lead.website      ?? null,
    phone:        lead.phone        ?? null,
    rating:       lead.rating       ?? null,
    review_count: lead.reviewCount  ?? lead.review_count ?? null,
    place_id:     lead.placeId      ?? lead.place_id     ?? null,
  }))

  const { error } = await supabaseAdmin
    .from('companies')
    .upsert(rows, { onConflict: 'place_id', ignoreDuplicates: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ saved: rows.length })
}
