/**
 * Prompt builders for each AI step in the intelligence pipeline.
 *
 * All prompts:
 *  - provide explicit context about the company
 *  - instruct the model to return **only** valid JSON (no markdown wrapper)
 *  - include the expected JSON schema so the model can self-check
 */

import type {
  CompanyRecord,
  CompanyAnalysisResult,
  DemoContext,
} from '@/lib/types/lead-intelligence'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function field(label: string, value: string | number | null | undefined): string {
  return `${label}: ${value ?? 'Not provided'}`
}

function companyBlock(company: CompanyRecord): string {
  return [
    field('Company Name', company.name),
    field('Website', company.website),
    field('Industry', company.industry),
    field('Location', [company.city, company.state].filter(Boolean).join(', ')),
    field('Employee Count', company.employee_count),
    field('LinkedIn', company.linkedin_url),
    field('Phone', company.phone),
  ].join('\n')
}

// ─── Company Analysis Prompt ─────────────────────────────────────────────────

export function buildCompanyAnalysisPrompt(company: CompanyRecord): string {
  return `You are a senior B2B sales intelligence analyst specialising in identifying growth opportunities for small and mid-market businesses.

COMPANY DATA:
${companyBlock(company)}

INSTRUCTIONS:
1. Analyse this business from the available lead data — infer context where data is sparse.
2. Identify the most likely marketing and sales pain points (slow follow-up, no automation, weak funnel, etc.).
3. Identify any likely website or funnel weaknesses based on industry norms.
4. Recommend the single strongest outreach angle that will resonate with this company.
5. Estimate urgency based on company size, industry maturity, and completeness of their digital presence.
6. Recommend the most effective outreach channel for this prospect.

RULES:
- Return ONLY a valid JSON object. No markdown. No explanation. No code fences.
- Use the exact schema below. Do not add or remove keys.

EXPECTED JSON SCHEMA:
{
  "summary": "2–3 sentence overview of the company and why they are a strong prospect.",
  "painPoints": ["string — specific, actionable pain point", "..."],
  "strengths": ["string — genuine strength worth acknowledging", "..."],
  "outreachAngle": "string — the single most compelling angle to open with.",
  "urgencyLevel": "low" | "medium" | "high",
  "recommendedOffer": "string — specific offer or CTA tailored to this company.",
  "recommendedChannel": "email" | "linkedin" | "sms"
}`
}

// ─── Demo Context Prompt ──────────────────────────────────────────────────────

export function buildDemoContextPrompt(
  company: CompanyRecord,
  analysis: CompanyAnalysisResult,
): string {
  return `You are a SaaS demo strategist. Your job is to craft a personalised demo scenario for a sales call.

COMPANY DATA:
${companyBlock(company)}

ANALYSIS SUMMARY:
${analysis.summary}

KEY PAIN POINTS:
${analysis.painPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

RECOMMENDED OFFER: ${analysis.recommendedOffer}

TASK — DEMO CONTEXT:
Write a short, personalised demo context for this prospect. The demo should map directly to their pain points.

RULES:
- Return ONLY a valid JSON object. No markdown. No explanation. No code fences.
- Use the exact schema below.

EXPECTED JSON SCHEMA:
{
  "headline": "string — one punchy sentence describing the demo (max 12 words).",
  "scenario": "string — 2–3 sentences narrating why this demo is relevant to THIS company.",
  "keyPoints": ["string — demo highlight 1", "string — demo highlight 2", "..."],
  "suggestedFlow": "string — brief description of the recommended demo sequence."
}`
}

// ─── Offer-Specific Outreach Prompts ─────────────────────────────────────────

export type MessageAngle = 'pain' | 'opportunity' | 'social-proof'
export type OfferId = 'followup-automation' | 'database-reactivation' | 'positioning-report'

const OFFER_DESCRIPTIONS: Record<OfferId, string> = {
  'followup-automation':    '24/7 Automated Follow-Up — never miss a call or lead, automatically follow up with every inquiry, close 20–30% more deals.',
  'database-reactivation':  'Database Reactivation System — extract the revenue hidden in their existing customer database. Reactivate past customers who already know, like, and trust them.',
  'positioning-report':     'Custom Online Positioning Report — a personalised audit showing exactly how they appear online vs competitors, what they are losing, and what to fix first.',
}

const ANGLE_INSTRUCTIONS: Record<MessageAngle, string> = {
  'pain':         'Lead with a specific pain point you can infer from their data (missed calls, low rating, few reviews, no website). Make them feel seen.',
  'opportunity':  'Lead with a quantified opportunity — estimated revenue they are leaving on the table, or a competitor advantage they could gain. Be specific with numbers.',
  'social-proof': 'Lead with a result you helped a similar business achieve. Reference the niche and the outcome. Make it concrete and credible.',
}

export function buildOfferMessagePrompt(
  company: CompanyRecord,
  offerId: OfferId,
  angle: MessageAngle,
  channel: 'email' | 'sms' | 'linkedin',
): string {
  const offerDesc   = OFFER_DESCRIPTIONS[offerId]
  const angleGuide  = ANGLE_INSTRUCTIONS[angle]

  const channelGuide =
    channel === 'sms'
      ? 'SMS — 160 characters max, conversational, no subject line, one clear ask.'
      : channel === 'linkedin'
      ? 'LinkedIn DM — brief, no pitch until rapport, personal and curious tone.'
      : 'Email — subject line + 4-6 sentence body, professional but conversational.'

  return `You are a world-class B2B copywriter who writes short, natural outreach messages that convert.

COMPANY DATA:
${companyBlock(company)}

OFFER TO SELL:
${offerDesc}

MESSAGE ANGLE: ${angle.toUpperCase()}
${angleGuide}

CHANNEL: ${channel.toUpperCase()}
${channelGuide}

RULES:
- Never be generic. Reference something specific about THIS company (their name, niche, city, rating, review count, or missing website).
- Do NOT pitch features. Focus on ONE outcome or pain.
- End with a single low-friction CTA — a question, not a demand.
- Use [First Name] as a placeholder for the owner's name where natural.
- Return ONLY valid JSON. No markdown. No explanation.

EXPECTED JSON SCHEMA:
{
  "subjectLine": "string (email only; omit for sms/linkedin — use empty string)",
  "messageBody": "string — the full message text",
  "cta": "string — the closing sentence / call-to-action only",
  "channel": "${channel}",
  "angle": "${angle}",
  "offerId": "${offerId}"
}`
}

// ─── Outreach Message Prompt ──────────────────────────────────────────────────

export function buildMessagePrompt(
  company: CompanyRecord,
  analysis: CompanyAnalysisResult,
  demoContext: DemoContext,
): string {
  return `You are an expert B2B copywriter who writes short, natural first-touch outreach messages that convert.

COMPANY DATA:
${companyBlock(company)}

OUTREACH ANGLE: ${analysis.outreachAngle}
URGENCY LEVEL: ${analysis.urgencyLevel}
RECOMMENDED CHANNEL: ${analysis.recommendedChannel}
DEMO HEADLINE: ${demoContext.headline}
RECOMMENDED OFFER: ${analysis.recommendedOffer}

OUTREACH MESSAGE — TASK:
Write a personalised first-touch outreach message for this prospect.

STYLE RULES:
- Short and conversational — NOT salesy, NOT spammy.
- Focus on ONE relevant pain point or insight about their business.
- Do NOT list features or describe the product at length.
- End with a single, low-friction CTA (15-min call, quick question, etc.).
- Use [First Name] and [Company] as placeholders where appropriate.
- Subject line: 6 words or fewer, curiosity-driven.
- Message body: 4–6 sentences max.

RULES:
- Return ONLY a valid JSON object. No markdown. No explanation. No code fences.
- Use the exact schema below.
- "channel" must match the RECOMMENDED CHANNEL above.

EXPECTED JSON SCHEMA:
{
  "subjectLine": "string",
  "messageBody": "string",
  "cta": "string — the closing call-to-action sentence only",
  "channel": "email" | "linkedin" | "sms"
}

OUTREACH MESSAGE:`
}
