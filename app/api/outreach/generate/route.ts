/**
 * POST /api/outreach/generate
 *
 * Generates an offer-specific, angle-specific outreach message for a company
 * using Claude. Returns the message but does NOT save it — caller must POST
 * to /api/outreach/messages to save.
 *
 * Body: { companyId, offerId, angle, channel }
 */
import { NextResponse }            from 'next/server'
import { getAccountContext }       from '@/lib/auth/server'
import { getOrCreateReputationReport } from '@/lib/reports/reputation-report'
import { getUserSupabaseClient }   from '@/lib/supabase/user-server'
import { getAIClient }             from '@/lib/ai/client'
import { buildOfferMessagePrompt } from '@/lib/ai/prompts'
import { logUsage }                from '@/lib/usage/cost-tracker'
import type { OfferId, MessageAngle } from '@/lib/ai/prompts'

const VALID_OFFERS: OfferId[]      = ['followup-automation', 'database-reactivation', 'positioning-report']
const VALID_ANGLES: MessageAngle[] = ['pain', 'opportunity', 'social-proof']
const VALID_CHANNELS               = ['email', 'sms', 'linkedin'] as const

export async function POST(req: Request) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getUserSupabaseClient(ctx.accessToken)

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }

  const { companyId, offerId, angle, channel } = body

  if (!companyId || typeof companyId !== 'string')
    return NextResponse.json({ error: '"companyId" is required.' }, { status: 422 })
  if (!VALID_OFFERS.includes(offerId as OfferId))
    return NextResponse.json({ error: `"offerId" must be one of: ${VALID_OFFERS.join(', ')}` }, { status: 422 })
  if (!VALID_ANGLES.includes(angle as MessageAngle))
    return NextResponse.json({ error: `"angle" must be one of: ${VALID_ANGLES.join(', ')}` }, { status: 422 })
  if (!VALID_CHANNELS.includes(channel as typeof VALID_CHANNELS[number]))
    return NextResponse.json({ error: `"channel" must be one of: ${VALID_CHANNELS.join(', ')}` }, { status: 422 })

  // Fetch company
  const { data: company, error: companyErr } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .eq('account_id', ctx.accountId)
    .single()

  if (companyErr || !company)
    return NextResponse.json({ error: 'Company not found.' }, { status: 404 })

  const companyRecord = {
    name:           company.name,
    website:        company.website       ?? null,
    industry:       company.niche         ?? null,
    city:           company.city          ?? null,
    state:          company.state         ?? null,
    phone:          company.phone         ?? null,
    employee_count: null,
    linkedin_url:   null,
  }

  // For positioning-report, generate the report to get the share URL
  let reportUrl: string | undefined
  if (offerId === 'positioning-report') {
    try {
      const reportData = await getOrCreateReputationReport(companyId, ctx.accountId, supabase, false)
      const origin = new URL(req.url).origin
      reportUrl = `${origin}/report/${reportData.share_token}`
    } catch (err) {
      console.warn('[outreach/generate] Failed to generate report for URL:', err)
      // Continue without URL — message will still be generated
    }
  }

  const prompt = buildOfferMessagePrompt(
    companyRecord,
    offerId as OfferId,
    angle as MessageAngle,
    channel as typeof VALID_CHANNELS[number],
    reportUrl,
  )

  let parsed: Record<string, string>
  try {
    const raw = await getAIClient().complete(prompt)
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error('[outreach/generate]', err)
    return NextResponse.json({ error: 'AI generation failed.' }, { status: 500 })
  }

  logUsage({
    provider: 'anthropic', service: 'claude-sonnet-4-6', feature: 'outreach-generate',
    input_units: 0, output_units: 0, status: 'success',
    metadata: { companyId, offerId, angle, channel },
  })

  return NextResponse.json({
    companyId,
    company:     { id: company.id, name: company.name, niche: company.niche, city: company.city },
    offerId,
    angle,
    channel,
    subjectLine: parsed.subjectLine ?? '',
    messageBody: reportUrl ? (parsed.messageBody ?? '').replace('[REPORT_URL]', reportUrl) : parsed.messageBody ?? '',
    cta:         parsed.cta         ?? '',
    reportUrl:   reportUrl          ?? null,
  })
}
