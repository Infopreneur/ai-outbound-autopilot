// ─── Primitives ───────────────────────────────────────────────────────────────

export type UrgencyLevel    = 'low' | 'medium' | 'high'
export type OutreachChannel = 'email' | 'linkedin' | 'sms'
export type LeadTier        = 'hot' | 'warm' | 'cold'
export type LeadStatus      = 'hot' | 'warm' | 'cold' | 'new'

// ─── Company Record (mirrors the Supabase `companies` table) ─────────────────

export interface CompanyRecord {
  id?: string
  name: string
  website?: string | null
  industry?: string | null
  city?: string | null
  state?: string | null
  employee_count?: number | null
  linkedin_url?: string | null
  phone?: string | null
  /** Stored summary from a previous analysis run */
  analysis_summary?: string | null
  fit_score?: number | null
  pain_score?: number | null
  reachability_score?: number | null
  timing_score?: number | null
  total_score?: number | null
  lead_status?: LeadStatus | null
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export interface PainPoint {
  category: string
  description: string
  severity: UrgencyLevel
}

export interface OutreachAngle {
  channel: OutreachChannel
  angle: string
  hook: string
}

/**
 * Structured result returned by the AI company analysis step.
 * All fields are required so downstream consumers can rely on them.
 */
export interface CompanyAnalysisResult {
  summary: string
  painPoints: string[]
  strengths: string[]
  outreachAngle: string
  urgencyLevel: UrgencyLevel
  recommendedOffer: string
  recommendedChannel: OutreachChannel
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface LeadScoreBreakdown {
  fitScore: number
  painScore: number
  reachabilityScore: number
  timingScore: number
  totalScore: number
  tier: LeadTier
}

// ─── Demo Context ─────────────────────────────────────────────────────────────

export interface DemoContext {
  /** One-line headline describing the demo scenario */
  headline: string
  /** 2–3 sentence narrative personalised to this company */
  scenario: string
  /** Bullet points to highlight during the demo */
  keyPoints: string[]
  /** Suggested demo flow / sequence of screens */
  suggestedFlow: string
}

// ─── Generated Message ────────────────────────────────────────────────────────

export interface GeneratedMessage {
  subjectLine: string
  messageBody: string
  cta: string
  channel: OutreachChannel
}

// ─── Full Payload (service output) ───────────────────────────────────────────

export interface CompanyIntelligencePayload {
  company: CompanyRecord
  analysis: CompanyAnalysisResult
  scores: LeadScoreBreakdown
  demoContext: DemoContext
  message: GeneratedMessage
  generatedAt: string
}
