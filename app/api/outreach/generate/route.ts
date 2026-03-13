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
import { supabaseAdmin }           from '@/lib/supabase/server'
import { getAIClient }             from '@/lib/ai/client'
import { buildOfferMessagePrompt } from '@/lib/ai/prompts'
import { logUsage }                from '@/lib/usage/cost-tracker'
import type { OfferId, MessageAngle } from '@/lib/ai/prompts'

const VALID_OFFERS: OfferId[]      = ['followup-automation', 'database-reactivation', 'positioning-report']
const VALID_ANGLES: MessageAngle[] = ['pain', 'opportunity', 'social-proof']
const VALID_CHANNELS               = ['email', 'sms', 'linkedin'] as const

export async function POST(req: Request) {
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
  const { data: company, error: companyErr } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', companyId)
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

  const prompt = buildOfferMessagePrompt(
    companyRecord,
    offerId as OfferId,
    angle as MessageAngle,
    channel as typeof VALID_CHANNELS[number],
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
    messageBody: parsed.messageBody ?? '',
    cta:         parsed.cta         ?? '',
  })
}
