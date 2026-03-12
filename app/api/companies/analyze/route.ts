/**
 * POST /api/companies/analyze
 *
 * Accepts a company payload, runs the full intelligence pipeline, and
 * returns analysis, score breakdown, demo context, and a generated message.
 *
 * Request body: CompanyRecord (see lib/validators/company.ts for schema)
 *
 * Response: CompanyIntelligencePayload
 *
 * Example:
 *   POST /api/companies/analyze
 *   {
 *     "name": "Apex Roofing",
 *     "website": "https://apexroofing.com",
 *     "industry": "Home Services",
 *     "city": "Phoenix",
 *     "state": "AZ",
 *     "employee_count": 12,
 *     "phone": "+16025551234"
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateCompany }           from '@/lib/validators/company'
import { runCompanyIntelligence }    from '@/lib/services/company-analysis-service'

export async function POST(request: NextRequest) {
  // ── Parse request body ──────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 },
    )
  }

  // ── Validate payload ────────────────────────────────────────────────────
  const validation = validateCompany(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed.', details: validation.error },
      { status: 422 },
    )
  }

  // ── Run intelligence pipeline ───────────────────────────────────────────
  try {
    const payload = await runCompanyIntelligence(validation.data)

    return NextResponse.json(payload, { status: 200 })
  } catch (err) {
    console.error('[POST /api/companies/analyze] Pipeline error:', err)
    return NextResponse.json(
      { error: 'Intelligence pipeline failed. Check server logs.' },
      { status: 500 },
    )
  }
}
