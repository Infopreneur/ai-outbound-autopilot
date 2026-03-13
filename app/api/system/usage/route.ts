/**
 * GET /api/system/usage
 *
 * Returns aggregated API usage and cost metrics for the System Health dashboard.
 * Falls back to mock data when the in-memory log is empty (cold start).
 *
 * Query params:
 *   ?period=today | month | all   (default: today)
 *   ?limit=N                      (default: 50)
 */

import { NextRequest, NextResponse }                      from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getLogsToday, getLogsThisMonth, getRecentLogs,
         getSpendToday, getSpendThisMonth, getAiCallsToday } from '@/lib/usage/cost-tracker'
import { getJobsByStatus }                                from '@/lib/discovery/job-runner'
import { mockSystemHealthMetrics }                        from '@/lib/mock/system-health'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? 'today'
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  const liveLogsToday = getLogsToday()
  const useMock = liveLogsToday.length === 0

  if (useMock) {
    // No live data yet — return mock metrics (already includes email/sms counts)
    return NextResponse.json({
      source: 'mock',
      ...mockSystemHealthMetrics,
      recentApiActivity: mockSystemHealthMetrics.recentApiActivity.slice(0, limit),
      recentScraperJobs: mockSystemHealthMetrics.recentScraperJobs.slice(0, limit),
    })
  }

  // Real aggregated metrics
  const logs =
    period === 'month' ? getLogsThisMonth() :
    period === 'all'   ? getRecentLogs(limit) :
    liveLogsToday

  const running = getJobsByStatus('running').length
  const pending = getJobsByStatus('pending').length
  const failed  = getJobsByStatus('failed').length

  const completedJobs  = getJobsByStatus('completed')
  const totalLeads     = completedJobs.reduce((s, j) => s + j.leadsNormalized, 0)
  const totalJobsCost  = completedJobs.reduce((s, j) => s + j.costEstimate, 0)
  const avgCostPerLead = totalLeads > 0 ? totalJobsCost / totalLeads : 0

  // email / sms counts
  const { count: emailCount } = await supabaseAdmin
    .from('outreach_messages')
    .select('id', { head: true, count: 'exact' })
    .eq('status', 'sent')
    .eq('channel', 'email')
  const { count: smsCount } = await supabaseAdmin
    .from('outreach_messages')
    .select('id', { head: true, count: 'exact' })
    .eq('status', 'sent')
    .eq('channel', 'sms')

  return NextResponse.json({
    source:            'live',
    apiSpendToday:     parseFloat(getSpendToday().toFixed(4)),
    apiSpendMonth:     parseFloat(getSpendThisMonth().toFixed(4)),
    totalAiCallsToday: getAiCallsToday(),
    totalEmailSentToday: emailCount ?? 0,
    totalSmsSentToday: smsCount ?? 0,
    scraperJobsRunning: running,
    queueDepth:        pending,
    failedJobs:        failed,
    avgCostPerLead:    parseFloat(avgCostPerLead.toFixed(4)),
    recentApiActivity: logs.slice(0, limit),
    recentScraperJobs: [...getJobsByStatus('running'), ...getJobsByStatus('completed')]
      .slice(0, limit),
  })
}
