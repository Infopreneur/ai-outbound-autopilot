'use client'

import { useState } from 'react'
import {
  DollarSign,
  Cpu,
  AlertTriangle,
  List,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  Database,
  Bot,
  Zap,
} from 'lucide-react'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { mockSystemHealthMetrics } from '@/lib/mock/system-health'
import type { ApiUsageLog, DiscoveryJob } from '@/lib/discovery/types'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(n: number): string {
  if (n === 0) return '$0.00'
  if (n < 0.01) return `$${n.toFixed(5)}`
  return `$${n.toFixed(4)}`
}

function formatTimeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)   return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  return `${Math.round(diff / 3600)}h ago`
}

function jobDuration(job: DiscoveryJob): string | null {
  if (!job.completedAt) return null
  const ms = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
  const s  = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon,
  iconClass,
  trend,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  iconClass?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconClass ?? 'bg-indigo-500/15 text-indigo-400')}>
          {icon}
        </div>
        {trend && (
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', {
            'bg-emerald-500/10 text-emerald-400': trend === 'up',
            'bg-red-500/10 text-red-400':         trend === 'down',
            'bg-slate-500/10 text-slate-400':     trend === 'neutral',
          })}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
      {sub && <div className="text-[10px] text-slate-700 mt-0.5">{sub}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    error:     'bg-red-500/15 text-red-400 border-red-500/25',
    timeout:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
    running:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    failed:    'bg-red-500/15 text-red-400 border-red-500/25',
    pending:   'bg-slate-500/15 text-slate-400 border-slate-500/25',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize', map[status] ?? map.pending)}>
      {status === 'running' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
      {status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5" />}
      {(status === 'error' || status === 'failed') && <XCircle className="w-2.5 h-2.5" />}
      {status === 'timeout' && <Clock className="w-2.5 h-2.5" />}
      {status === 'pending' && <Clock className="w-2.5 h-2.5" />}
      {status === 'success' && <CheckCircle2 className="w-2.5 h-2.5" />}
      {status}
    </span>
  )
}

function ProviderBadge({ provider }: { provider: string }) {
  const map: Record<string, string> = {
    anthropic: 'bg-violet-500/15 text-violet-400',
    openai:    'bg-emerald-500/15 text-emerald-400',
    apify:     'bg-orange-500/15 text-orange-400',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide', map[provider] ?? 'bg-slate-500/15 text-slate-400')}>
      {provider}
    </span>
  )
}

// ─── API Activity Table ───────────────────────────────────────────────────────

function ApiActivityTable({ logs }: { logs: ApiUsageLog[] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? logs : logs.slice(0, 8)

  return (
    <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e38]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Recent API Activity</h3>
          <span className="text-xs text-slate-600 bg-[#1a1a30] border border-[#252540] px-2 py-0.5 rounded-full">
            {logs.length} calls
          </span>
        </div>
        <div className="text-xs text-slate-500">
          Total:{' '}
          <span className="text-white font-semibold">
            {formatUSD(logs.reduce((s, l) => s + l.estimated_cost, 0))}
          </span>
        </div>
      </div>

      <table className="w-full">
        <thead className="border-b border-[#1e1e38]">
          <tr>
            {['Time', 'Provider', 'Service', 'Feature', 'Input', 'Output', 'Cost', 'Status'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#0f0f1e]">
          {visible.map((log) => (
            <tr key={log.id} className="hover:bg-white/[0.015] transition-colors group">
              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatTimeAgo(log.created_at)}</td>
              <td className="px-4 py-3"><ProviderBadge provider={log.provider} /></td>
              <td className="px-4 py-3 text-xs text-slate-400 max-w-[140px] truncate">{log.service}</td>
              <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{log.feature}</td>
              <td className="px-4 py-3 text-xs text-slate-500 tabular-nums text-right">
                {log.input_units > 0 ? log.input_units.toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 tabular-nums text-right">
                {log.output_units.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-300 tabular-nums whitespace-nowrap">
                {formatUSD(log.estimated_cost)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={log.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length > 8 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-slate-500 hover:text-slate-300 border-t border-[#1e1e38] transition-colors hover:bg-white/[0.02]"
        >
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAll && 'rotate-180')} />
          {showAll ? 'Show less' : `Show ${logs.length - 8} more`}
        </button>
      )}
    </div>
  )
}

// ─── Scraper Jobs Table ───────────────────────────────────────────────────────

function ScraperJobsTable({ jobs }: { jobs: DiscoveryJob[] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? jobs : jobs.slice(0, 6)

  return (
    <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e38]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Scraper Jobs</h3>
          <span className="text-xs text-slate-600 bg-[#1a1a30] border border-[#252540] px-2 py-0.5 rounded-full">
            {jobs.length} jobs
          </span>
          {jobs.some((j) => j.status === 'running') && (
            <span className="flex items-center gap-1 text-[10px] text-blue-400 font-medium">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              {jobs.filter((j) => j.status === 'running').length} running
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Leads found:{' '}
          <span className="text-white font-semibold">
            {jobs.reduce((s, j) => s + j.leadsNormalized, 0).toLocaleString()}
          </span>
        </div>
      </div>

      <table className="w-full">
        <thead className="border-b border-[#1e1e38]">
          <tr>
            {['Started', 'Niche', 'Location', 'Results', 'Cost', 'Duration', 'Status'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#0f0f1e]">
          {visible.map((job) => {
            const dur = jobDuration(job)
            const pct = job.maxResults > 0 ? (job.resultsFound / job.maxResults) * 100 : 0

            return (
              <tr key={job.id} className="hover:bg-white/[0.015] transition-colors group">
                <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatTimeAgo(job.startedAt)}</td>
                <td className="px-4 py-3">
                  <div className="text-xs font-medium text-slate-200">{job.niche}</div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {[job.city, job.state].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16">
                      <Progress
                        value={pct}
                        barClassName={
                          job.status === 'completed' ? 'bg-emerald-500' :
                          job.status === 'running'   ? 'bg-blue-500 animate-pulse' :
                          job.status === 'failed'    ? 'bg-red-500' :
                          'bg-slate-500'
                        }
                      />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
                      {job.resultsFound}/{job.maxResults}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-300 tabular-nums">
                  {job.costEstimate > 0 ? formatUSD(job.costEstimate) : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">
                  {job.status === 'running' ? (
                    <span className="flex items-center gap-1 text-blue-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Running…
                    </span>
                  ) : dur ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <StatusBadge status={job.status} />
                    {job.error && (
                      <div className="text-[10px] text-red-500 mt-0.5 max-w-[180px] truncate" title={job.error}>
                        {job.error}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {jobs.length > 6 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-slate-500 hover:text-slate-300 border-t border-[#1e1e38] transition-colors hover:bg-white/[0.02]"
        >
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAll && 'rotate-180')} />
          {showAll ? 'Show less' : `Show ${jobs.length - 6} more`}
        </button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
  const [refreshing, setRefreshing] = useState(false)
  const m = mockSystemHealthMetrics

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  const totalApiCalls  = m.recentApiActivity.length
  const successRate    = totalApiCalls > 0
    ? Math.round(m.recentApiActivity.filter((l) => l.status === 'success').length / totalApiCalls * 100)
    : 100

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">System Health</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time API usage, scraper jobs, and cost monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All systems operational
          </div>
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Row 1 — Spend & AI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="API Spend Today"
          value={`$${m.apiSpendToday.toFixed(4)}`}
          sub="Across all providers"
          icon={<DollarSign className="w-4 h-4" />}
          iconClass="bg-indigo-500/15 text-indigo-400"
          trend="up"
        />
        <MetricCard
          label="API Spend This Month"
          value={`$${m.apiSpendMonth.toFixed(2)}`}
          sub={`$${(m.apiSpendMonth / new Date().getDate()).toFixed(2)}/day avg`}
          icon={<DollarSign className="w-4 h-4" />}
          iconClass="bg-violet-500/15 text-violet-400"
          trend="neutral"
        />
        <MetricCard
          label="AI Calls Today"
          value={m.totalAiCallsToday.toString()}
          sub={`${successRate}% success rate`}
          icon={<Bot className="w-4 h-4" />}
          iconClass="bg-blue-500/15 text-blue-400"
          trend="up"
        />
        <MetricCard
          label="Avg Cost / Lead"
          value={`$${m.avgCostPerLead.toFixed(4)}`}
          sub="Discovery + enrichment"
          icon={<Activity className="w-4 h-4" />}
          iconClass="bg-emerald-500/15 text-emerald-400"
          trend="down"
        />
      </div>

      {/* KPI Row 2 — Jobs */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Scraper Jobs Running"
          value={m.scraperJobsRunning.toString()}
          sub="Active actors"
          icon={<Cpu className="w-4 h-4" />}
          iconClass={m.scraperJobsRunning > 0 ? 'bg-blue-500/15 text-blue-400' : 'bg-slate-500/15 text-slate-500'}
          trend={m.scraperJobsRunning > 0 ? 'neutral' : undefined}
        />
        <MetricCard
          label="Queue Depth"
          value={m.queueDepth.toString()}
          sub="Jobs pending"
          icon={<List className="w-4 h-4" />}
          iconClass="bg-amber-500/15 text-amber-400"
          trend={m.queueDepth > 5 ? 'up' : 'neutral'}
        />
        <MetricCard
          label="Failed Jobs"
          value={m.failedJobs.toString()}
          sub="Needs attention"
          icon={<AlertTriangle className="w-4 h-4" />}
          iconClass={m.failedJobs > 0 ? 'bg-red-500/15 text-red-400' : 'bg-slate-500/15 text-slate-500'}
          trend={m.failedJobs > 0 ? 'down' : undefined}
        />
      </div>

      {/* Cost Efficiency Funnel */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white">Estimated Cost Per Lead — Funnel View</h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Track unit economics at each stage to stay profitable as you scale
            </p>
          </div>
          <span className="text-[10px] text-slate-600 bg-[#1a1a30] border border-[#252540] px-2 py-1 rounded-md font-mono">
            Live estimates
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Cost per Lead */}
          <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-lg p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Stage 1</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums mb-1">
                {formatUSD(m.avgCostPerLead)}
              </div>
              <div className="text-xs font-semibold text-indigo-300 mb-2">Cost per Lead</div>
              <div className="text-[11px] text-slate-600 leading-relaxed">
                Total scraping + enrichment cost divided by all leads discovered. Optimize by improving actor efficiency and batching AI calls.
              </div>
              <div className="mt-3 pt-3 border-t border-[#1e1e38] flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Conversion to next stage</span>
                <span className="text-[10px] font-bold text-indigo-400">28%</span>
              </div>
            </div>
          </div>

          {/* Cost per Qualified Lead */}
          <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-lg p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Stage 2</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums mb-1">
                {formatUSD(m.avgCostPerQualifiedLead)}
              </div>
              <div className="text-xs font-semibold text-amber-300 mb-2">Cost per Qualified Lead</div>
              <div className="text-[11px] text-slate-600 leading-relaxed">
                Accounts for leads that pass AI scoring (warm/hot tier). Reduce by tightening niche targeting and ICP filters before scraping.
              </div>
              <div className="mt-3 pt-3 border-t border-[#1e1e38] flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Conversion to next stage</span>
                <span className="text-[10px] font-bold text-amber-400">12%</span>
              </div>
            </div>
          </div>

          {/* Cost per Meeting Booked */}
          <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-lg p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Stage 3</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums mb-1">
                {formatUSD(m.avgCostPerMeetingBooked)}
              </div>
              <div className="text-xs font-semibold text-emerald-300 mb-2">Cost per Meeting Booked</div>
              <div className="text-[11px] text-slate-600 leading-relaxed">
                The true north-star unit metric. Reduce by improving message personalization, reply rate, and follow-up sequence conversion.
              </div>
              <div className="mt-3 pt-3 border-t border-[#1e1e38] flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Target benchmark</span>
                <span className="text-[10px] font-bold text-emerald-400">{'< $0.50'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Funnel connector bar */}
        <div className="mt-4 flex items-center gap-1">
          <div className="flex-1 h-1.5 rounded-full bg-indigo-500/40" />
          <div className="flex-1 h-1.5 rounded-full bg-amber-500/30" />
          <div className="flex-1 h-1.5 rounded-full bg-emerald-500/20" />
        </div>
        <div className="flex justify-between mt-1.5 px-0.5">
          <span className="text-[10px] text-slate-700">Discovery</span>
          <span className="text-[10px] text-slate-700">Qualification</span>
          <span className="text-[10px] text-slate-700">Booking</span>
        </div>
      </div>

      {/* Cost breakdown mini-chart */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Provider Cost Breakdown — Today</h3>
        <div className="space-y-3">
          {[
            {
              provider: 'Anthropic',
              cost: m.recentApiActivity.filter((l) => l.provider === 'anthropic').reduce((s, l) => s + l.estimated_cost, 0),
              color: 'bg-violet-500',
              total: m.apiSpendToday,
            },
            {
              provider: 'Apify',
              cost: m.recentApiActivity.filter((l) => l.provider === 'apify').reduce((s, l) => s + l.estimated_cost, 0),
              color: 'bg-orange-500',
              total: m.apiSpendToday,
            },
            {
              provider: 'OpenAI',
              cost: m.recentApiActivity.filter((l) => l.provider === 'openai').reduce((s, l) => s + l.estimated_cost, 0),
              color: 'bg-emerald-500',
              total: m.apiSpendToday,
            },
          ].map(({ provider, cost, color, total }) => {
            const pct = total > 0 ? Math.round((cost / total) * 100) : 0
            return (
              <div key={provider} className="flex items-center gap-4">
                <div className="w-20 text-xs text-slate-400 font-medium">{provider}</div>
                <div className="flex-1">
                  <Progress value={pct} barClassName={color} />
                </div>
                <div className="w-20 text-right">
                  <span className="text-xs font-semibold text-white">{formatUSD(cost)}</span>
                  <span className="text-[10px] text-slate-600 ml-1.5">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tables */}
      <ApiActivityTable  logs={m.recentApiActivity} />
      <ScraperJobsTable  jobs={m.recentScraperJobs} />
    </div>
  )
}
