/**
 * Personalised first-touch outreach message generator.
 *
 * Combines company record, analysis result, and demo context to produce
 * a concise, non-spammy outreach message with a subject line and CTA.
 * The recommended channel from the analysis drives the tone and format.
 */

import type {
  CompanyRecord,
  CompanyAnalysisResult,
  DemoContext,
  GeneratedMessage,
} from '@/lib/types/lead-intelligence'
import { getAIClient } from '@/lib/ai/client'
import { buildMessagePrompt } from '@/lib/ai/prompts'

// ─── Safe JSON Parser ─────────────────────────────────────────────────────────

function safeParseJSON<T>(raw: string): T | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim()
    return JSON.parse(cleaned) as T
  } catch {
    return null
  }
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function buildFallbackMessage(
  company: CompanyRecord,
  analysis: CompanyAnalysisResult,
): GeneratedMessage {
  const channel = analysis.recommendedChannel
  const pain    = analysis.painPoints[0] ?? 'manual lead follow-up'

  const bodies: Record<typeof channel, string> = {
    email:
      `Hi [First Name],\n\nI was looking at ${company.name} and noticed that ${pain.toLowerCase()}.\n\n` +
      `We help ${company.industry ?? 'businesses'} like yours automate that entire process — from first contact to booked call.\n\n` +
      `Happy to show you how it works in 15 minutes.`,
    linkedin:
      `Hi [First Name] — came across ${company.name} and thought this might be relevant.\n\n` +
      `We help ${company.industry ?? 'teams'} automate their lead intake and booking. ` +
      `Worth a quick chat?`,
    sms:
      `Hi [First Name], this is [Your Name] from [Company]. ` +
      `We help ${company.industry ?? 'businesses'} automate lead follow-up. ` +
      `Would 15 mins this week work to show you how?`,
  }

  return {
    subjectLine: `Quick idea for ${company.name}`,
    messageBody: bodies[channel],
    cta: 'Would Tuesday or Wednesday work for a 15-minute call?',
    channel,
  }
}

// ─── Validator ────────────────────────────────────────────────────────────────

function isValidMessage(obj: unknown): obj is GeneratedMessage {
  if (!obj || typeof obj !== 'object') return false
  const r = obj as Record<string, unknown>
  return (
    typeof r.subjectLine === 'string' &&
    typeof r.messageBody === 'string' &&
    typeof r.cta === 'string' &&
    ['email', 'linkedin', 'sms'].includes(r.channel as string)
  )
}

// ─── Main Function ─────────────────────────────────────────────────────────────

/**
 * Generate a personalised first-touch outreach message.
 *
 * @param company     - The target company
 * @param analysis    - Result from analyzeCompany
 * @param demoContext - Result from generateDemoContext
 */
export async function generateMessage(
  company: CompanyRecord,
  analysis: CompanyAnalysisResult,
  demoContext: DemoContext,
): Promise<GeneratedMessage> {
  const prompt = buildMessagePrompt(company, analysis, demoContext)
  const client = getAIClient()

  // Marker helps the mock client route to the correct response template
  const markedPrompt = `OUTREACH MESSAGE\n${prompt}`

  let rawResponse: string
  try {
    rawResponse = await client.complete(markedPrompt)
  } catch (err) {
    console.error('[generateMessage] AI call failed:', err)
    return buildFallbackMessage(company, analysis)
  }

  const parsed = safeParseJSON<GeneratedMessage>(rawResponse)

  if (!isValidMessage(parsed)) {
    console.warn(
      '[generateMessage] Invalid AI response — using fallback. Raw:',
      rawResponse.slice(0, 200),
    )
    return buildFallbackMessage(company, analysis)
  }

  return parsed
}
