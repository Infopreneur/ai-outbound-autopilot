import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select(
      'id, name, website, phone, city, state, rating, review_count, ' +
      'opportunity_score, opportunity_tier, opportunity_reason, ' +
      'recommended_offer, recommended_next_step, strategy, deep_dive_note, source_url, converted_to_deal, created_at',
    )
    .order('opportunity_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
