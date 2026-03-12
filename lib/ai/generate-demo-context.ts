/**
 * Demo context generator.
 *
 * Given a company record and its analysis result, produces a short
 * personalised narrative that the demo builder can use to frame a
 * customised product demonstration.
 *
 * Example headline output:
 *   "Show how an AI receptionist qualifies and books roofing leads automatically."
 *   "Show how a real estate team responds to buyer inquiries and schedules showings."
 */

import type {
  CompanyRecord,
  CompanyAnalysisResult,
  DemoContext,
} from '@/lib/types/lead-intelligence'
import { getAIClient } from '@/lib/ai/client'
import { buildDemoContextPrompt } from '@/lib/ai/prompts'

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

function buildFallbackDemoContext(
  company: CompanyRecord,
  analysis: CompanyAnalysisResult,
): DemoContext {
  const industry = company.industry ?? 'their industry'
  return {
    headline: `Show how ${company.name} can automate lead response and booking.`,
    scenario: `${company.name} operates in ${industry} and likely handles inbound leads manually. ` +
      `This demo will show how an AI-powered intake system eliminates that bottleneck, ` +
      `responding to every lead instantly and booking qualified calls without staff involvement.`,
    keyPoints: [
      'Instant AI response to every inbound inquiry — 24/7',
      'Automatic lead qualification using custom criteria',
      'Frictionless calendar booking without human hand-off',
      'Automated follow-up sequences triggered by lead behaviour',
      `Personalised for ${industry} workflows`,
    ],
    suggestedFlow:
      'Landing page → AI chat/SMS widget → qualification questions → calendar embed → confirmation + automated nurture.',
  }
}

// ─── Validator ────────────────────────────────────────────────────────────────

function isValidDemoContext(obj: unknown): obj is DemoContext {
  if (!obj || typeof obj !== 'object') return false
  const r = obj as Record<string, unknown>
  return (
    typeof r.headline === 'string' &&
    typeof r.scenario === 'string' &&
    Array.isArray(r.keyPoints) &&
    typeof r.suggestedFlow === 'string'
  )
}

// ─── Main Function ─────────────────────────────────────────────────────────────

/**
 * Generate a personalised demo context for a company.
 *
 * @param company  - The target company
 * @param analysis - Result from the prior analyzeCompany step
 */
export async function generateDemoContext(
  company: CompanyRecord,
  analysis: CompanyAnalysisResult,
): Promise<DemoContext> {
  const prompt = buildDemoContextPrompt(company, analysis)
  const client = getAIClient()

  // Inject a marker so the mock client can identify this prompt type
  const markedPrompt = `DEMO CONTEXT\n${prompt}`

  let rawResponse: string
  try {
    rawResponse = await client.complete(markedPrompt)
  } catch (err) {
    console.error('[generateDemoContext] AI call failed:', err)
    return buildFallbackDemoContext(company, analysis)
  }

  const parsed = safeParseJSON<DemoContext>(rawResponse)

  if (!isValidDemoContext(parsed)) {
    console.warn(
      '[generateDemoContext] Invalid AI response — using fallback. Raw:',
      rawResponse.slice(0, 200),
    )
    return buildFallbackDemoContext(company, analysis)
  }

  return parsed
}
