/**
 * POST /api/report/access
 *
 * Records that a report share link was opened (optionally with an email).
 * Returns the report payload for display.
 *
 * Body: { token: string, email?: string }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''

  if (!token) {
    return NextResponse.json({ error: 'Missing token.' }, { status: 422 })
  }

  const { data: report, error } = await supabaseAdmin
    .from('reputation_reports')
    .select('*')
    .eq('share_token', token)
    .single()

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
  }

  if (email) {
    await supabaseAdmin.from('report_accesses').insert({
      report_id: report.id,
      share_token: token,
      email,
    })
  }

  return NextResponse.json(report)
}
