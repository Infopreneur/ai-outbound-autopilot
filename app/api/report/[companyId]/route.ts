/**
 * GET /api/report/[companyId]
 *
 * Generates (or returns cached) an Online Positioning Report for a company.
 * Uses real data from the companies table + Claude AI for the action plan.
 * Results are cached in reputation_reports table keyed by company_id.
 */
import { NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'
import { getOrCreateReputationReport } from '@/lib/reports/reputation-report'

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  const { companyId } = await params
  const { searchParams } = new URL(req.url)
  const refresh          = searchParams.get('refresh') === 'true'
  try {
    const report = await getOrCreateReputationReport(companyId, ctx.accountId, supabase, refresh)
    return NextResponse.json(report)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate report.' },
      { status: 500 },
    )
  }
}
