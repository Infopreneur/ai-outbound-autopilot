import { NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const ctx = await getAccountContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('account_id', ctx.accountId)
      .order('start_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err: any) {
    console.error('campaigns list error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
