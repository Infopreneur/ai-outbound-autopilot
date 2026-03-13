import { NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'

export async function GET() {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  const { data, error } = await supabase
    .from('companies')
    .select(
      'id, name, website, phone, city, state, rating, review_count, ' +
      'opportunity_score, opportunity_tier, opportunity_reason, ' +
      'recommended_offer, recommended_next_step, strategy, deep_dive_note, source_url, converted_to_deal, created_at',
    )
    .eq('account_id', ctx.accountId)
    .order('opportunity_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
