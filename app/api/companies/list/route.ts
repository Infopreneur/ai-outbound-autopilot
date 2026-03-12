import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
