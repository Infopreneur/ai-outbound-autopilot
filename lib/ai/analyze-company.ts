/**
 * AI-powered company analysis step.
 *
 * Calls the AI model with a structured prompt and returns a typed
 * CompanyAnalysisResult. Falls back to a safe default if the model
 * is unavailable or returns malformed JSON.
 */

import type { CompanyRecord, CompanyAnalysisResult } from '@/lib/types/lead-intelligence'
import { getAIClient } from '@/lib/ai/client'
import { buildCompanyAnalysisPrompt } from '@/lib/ai/prompts'

// ─── Safe JSON Parser ─────────────────────────────────────────────────────────

/**
 * Strip markdown code fences (` ```json ... ``` `) and parse JSON safely.
 * Returns null if parsing fails.
 */
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

function buildFallbackAnalysis(company: CompanyRecord): CompanyAnalysisResult {
  return {
    summary: `${company.name} is a ${company.industry ?? 'business'} based in ${[company.city, company.state].filter(Boolean).join(', ') || 'an unknown location'}. Based on available data, they may benefit from improved lead automation and outreach systems.`,
    painPoints: [
      'Manual follow-up process likely causing slow lead response',
      'Limited or unclear digital sales funnel',
      'Potential lack of automated nurture sequences',
    ],
    strengths: [
      'Established business presence',
      ...(company.website ? ['Has a web presence'] : []),
      ...(company.linkedin_url ? ['Active on LinkedIn'] : []),
    ],
    outreachAngle:
      'Lead response speed and automation — most businesses in this sector respond too slowly and lose deals.',
    urgencyLevel: 'medium',
    recommendedOffer: 'AI-powered lead intake and appointment booking — free 14-day pilot.',
    recommendedChannel: company.linkedin_url ? 'linkedin' : 'email',
  }
}

// ─── Validator ────────────────────────────────────────────────────────────────

/**
 * Light runtime check that the parsed object has the required shape.
 * Prevents partial/malformed AI responses from reaching the service layer.
 */
function isValidAnalysisResult(obj: unknown): obj is CompanyAnalysisResult {
  if (!obj || typeof obj !== 'object') return false
  const r = obj as Record<string, unknown>
  return (
    typeof r.summary === 'string' &&
    Array.isArray(r.painPoints) &&
    Array.isArray(r.strengths) &&
    typeof r.outreachAngle === 'string' &&
    ['low', 'medium', 'high'].includes(r.urgencyLevel as string) &&
    typeof r.recommendedOffer === 'string' &&
    ['email', 'linkedin', 'sms'].includes(r.recommendedChannel as string)
  )
}

// ─── Main Function ─────────────────────────────────────────────────────────────

/**
 * Analyse a single company record using the AI model.
 *
 * @param company - The company to analyse
 * @returns A structured CompanyAnalysisResult
 */
export async function analyzeCompany(
  company: CompanyRecord,
): Promise<CompanyAnalysisResult> {
  const prompt = buildCompanyAnalysisPrompt(company)
  const client = getAIClient()

  let rawResponse: string
  try {
    rawResponse = await client.complete(prompt)
  } catch (err) {
    console.error('[analyzeCompany] AI call failed:', err)
    return buildFallbackAnalysis(company)
  }

  const parsed = safeParseJSON<CompanyAnalysisResult>(rawResponse)

  if (!isValidAnalysisResult(parsed)) {
    console.warn(
      '[analyzeCompany] Invalid AI response shape — using fallback. Raw:',
      rawResponse.slice(0, 200),
    )
    return buildFallbackAnalysis(company)
  }

  return parsed
}
