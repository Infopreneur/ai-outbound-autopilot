/**
 * Company Analysis Service — orchestrates the full intelligence pipeline.
 *
 * Steps (run in sequence because each step depends on the previous output):
 *  1. analyzeCompany      → CompanyAnalysisResult
 *  2. computeLeadScore    → LeadScoreBreakdown
 *  3. generateDemoContext → DemoContext
 *  4. generateMessage     → GeneratedMessage
 *
 * Returns a complete CompanyIntelligencePayload ready to store or serve.
 */

import type {
  CompanyRecord,
  CompanyIntelligencePayload,
} from '@/lib/types/lead-intelligence'

import { analyzeCompany }       from '@/lib/ai/analyze-company'
import { generateDemoContext }  from '@/lib/ai/generate-demo-context'
import { generateMessage }      from '@/lib/ai/generate-message'
import { computeLeadScore }     from '@/lib/scoring/lead-score'

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Run the full intelligence pipeline for a company.
 *
 * Each AI step is awaited in sequence — parallelising is intentionally avoided
 * because later steps depend on the output of earlier ones.
 *
 * @throws If the company record is fundamentally invalid (no name, etc.)
 */
export async function runCompanyIntelligence(
  company: CompanyRecord,
): Promise<CompanyIntelligencePayload> {
  // ── Step 1: AI Analysis ───────────────────────────────────────────────────
  const analysis = await analyzeCompany(company)

  // ── Step 2: Deterministic Scoring ────────────────────────────────────────
  // Pass the analysis so pain/timing scores use the freshest AI output
  const scores = computeLeadScore(company, analysis)

  // ── Step 3: Demo Context ──────────────────────────────────────────────────
  const demoContext = await generateDemoContext(company, analysis)

  // ── Step 4: Outreach Message ──────────────────────────────────────────────
  const message = await generateMessage(company, analysis, demoContext)

  return {
    company,
    analysis,
    scores,
    demoContext,
    message,
    generatedAt: new Date().toISOString(),
  }
}
