/**
 * GET /api/companies/[id]/intelligence
 *
 * Returns a pre-computed intelligence payload for a company by ID.
 *
 * When Supabase is connected, this should:
 *   1. Fetch the company row from `companies` table
 *   2. Return stored intelligence fields, or run the pipeline on-demand
 *      if the record hasn't been analysed yet.
 *
 * For now: returns in-memory mock data for known IDs so the feature
 * is immediately testable without a database connection.
 *
 * Example:
 *   GET /api/companies/1/intelligence
 */

import { NextRequest, NextResponse } from 'next/server'
import type { CompanyIntelligencePayload } from '@/lib/types/lead-intelligence'

// ─── Mock Intelligence Store ──────────────────────────────────────────────────
// Replace with Supabase queries once the DB is wired up.

const MOCK_INTELLIGENCE: Record<string, CompanyIntelligencePayload> = {
  '1': {
    company: {
      id: '1',
      name: 'TechCorp Inc.',
      website: 'https://techcorp.com',
      industry: 'SaaS',
      city: 'San Francisco',
      state: 'CA',
      employee_count: 320,
      linkedin_url: 'https://linkedin.com/company/techcorp',
      phone: '+14155550123',
      lead_status: 'hot',
    },
    analysis: {
      summary:
        'TechCorp Inc. is a mid-sized SaaS company in San Francisco experiencing rapid growth. They likely have a strong product but may lack automated outbound processes to convert outbound leads at scale.',
      painPoints: [
        'Manual SDR follow-up causing slow lead response times',
        'No automated nurture sequence post-demo',
        'High cost-per-lead with manual outreach at current team size',
        'Potential poor follow-up cadence losing warm leads',
      ],
      strengths: [
        'Established SaaS product with clear value proposition',
        'Active LinkedIn presence and online visibility',
        'Funded and scaling — budget likely available',
      ],
      outreachAngle:
        'Speed-to-lead: at 320 employees they are big enough to have an SDR team but still manual enough to lose leads to faster competitors.',
      urgencyLevel: 'high',
      recommendedOffer: 'AI outbound automation pilot — 30-day free trial with dedicated onboarding.',
      recommendedChannel: 'linkedin',
    },
    scores: {
      fitScore: 45,
      painScore: 35,
      reachabilityScore: 30,
      timingScore: 20,
      totalScore: 130,
      tier: 'hot',
    },
    demoContext: {
      headline: 'Show how TechCorp can scale outbound without adding headcount.',
      scenario:
        'TechCorp has the team and budget to grow outbound but is bottlenecked by manual SDR capacity. ' +
        'This demo shows how AI agents handle prospecting, personalised outreach, and follow-up at scale — freeing reps to focus on closing.',
      keyPoints: [
        'AI-written, personalised sequences for each ICP segment',
        'Automated multi-touch follow-up across email and LinkedIn',
        'Real-time lead scoring and prioritisation',
        'CRM sync — all activity logged automatically',
        'Book meetings on autopilot — no SDR involvement until call',
      ],
      suggestedFlow:
        'ICP definition → AI prospect list → personalised sequence → multi-touch follow-up → meeting booked → CRM synced.',
    },
    message: {
      subjectLine: 'Quick idea for TechCorp outbound',
      messageBody:
        'Hi [First Name],\n\nI noticed TechCorp has been scaling quickly — congrats on the growth.\n\n' +
        'One thing we see at this stage is outbound volume hitting a ceiling because the SDR team can only do so much manually.\n\n' +
        "We've helped similar SaaS teams 3x their outbound pipeline by automating prospecting and follow-up with AI — without adding headcount.",
      cta: 'Worth a 20-minute call this week to see if it maps to where you are?',
      channel: 'linkedin',
    },
    generatedAt: '2025-03-10T09:00:00Z',
  },

  '2': {
    company: {
      id: '2',
      name: 'GrowthHQ',
      website: 'https://growthhq.io',
      industry: 'MarTech',
      city: 'New York',
      state: 'NY',
      employee_count: 85,
      linkedin_url: 'https://linkedin.com/company/growthhq',
      phone: '+16465550198',
      lead_status: 'warm',
    },
    analysis: {
      summary:
        'GrowthHQ is a MarTech company helping B2B revenue teams. At 85 employees they are past early-stage but still scrappy enough that automation ROI is highly compelling.',
      painPoints: [
        'Manual outreach limiting pipeline capacity',
        'No automated demo follow-up — losing warm prospects',
        'Revenue team spending significant time on non-revenue tasks',
      ],
      strengths: [
        'Clear B2B focus and established customer base',
        'Strong LinkedIn presence',
        'Experienced revenue team — easy to talk to',
      ],
      outreachAngle:
        'Revenue efficiency: their team is doing valuable work manually that AI could automate, freeing them to close more.',
      urgencyLevel: 'medium',
      recommendedOffer: 'Done-for-you AI outreach setup — first campaign free.',
      recommendedChannel: 'email',
    },
    scores: {
      fitScore: 40,
      painScore: 30,
      reachabilityScore: 30,
      timingScore: 10,
      totalScore: 110,
      tier: 'hot',
    },
    demoContext: {
      headline: 'Show how GrowthHQ can book more demos without more reps.',
      scenario:
        'GrowthHQ\'s revenue team is constrained by manual outreach capacity. ' +
        'This demo illustrates how AI-powered sequences and automated follow-up can double demo bookings without adding headcount.',
      keyPoints: [
        'AI-personalised sequences based on prospect profile',
        'Automated post-demo follow-up to recover ghosted prospects',
        'LinkedIn + email multi-touch without manual effort',
        'Full CRM integration with existing tools',
      ],
      suggestedFlow:
        'Prospect list import → AI sequence generation → automated sends → reply detection → meeting scheduling → CRM sync.',
    },
    message: {
      subjectLine: 'More demos, same team size',
      messageBody:
        'Hi [First Name],\n\nI was looking at GrowthHQ and noticed your team is doing really well in the MarTech space.\n\n' +
        'The constraint we typically see at your stage is demo capacity — reps can only book so many calls when outreach is manual.\n\n' +
        'We can automate the prospecting-to-booked-call flow so your team only shows up to calls, not to fill a pipeline.',
      cta: 'Would Tuesday work for a 15-minute walk-through?',
      channel: 'email',
    },
    generatedAt: '2025-03-10T10:30:00Z',
  },
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // TODO: Replace with Supabase query:
  //   const { data, error } = await supabase
  //     .from('companies')
  //     .select('*')
  //     .eq('id', id)
  //     .single()
  //
  // If data.total_score is null, run runCompanyIntelligence(data) and
  // persist the result before returning.

  const payload = MOCK_INTELLIGENCE[id]

  if (!payload) {
    return NextResponse.json(
      { error: `No intelligence data found for company ID "${id}".` },
      { status: 404 },
    )
  }

  return NextResponse.json(payload, { status: 200 })
}
