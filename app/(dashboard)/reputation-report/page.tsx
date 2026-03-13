'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams }                            from 'next/navigation'
import Link                                           from 'next/link'
import {
  ArrowLeft, Search, Star, Globe, Phone, MapPin,
  FileBarChart2, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Loader2, RotateCcw, Sparkles, DollarSign,
  Eye, ChevronRight, Zap, Database,
} from 'lucide-react'
import { Avatar }   from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button }   from '@/components/ui/button'
import { cn }       from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
type Company = {
  id: string
  name: string
  niche: string | null
  city: string | null
  state: string | null
  rating: number | null
  review_count: number | null
  website: string | null
  phone: string | null
  opportunity_tier: string | null
  top_offer: string | null
}

type Report = {
  company_id: string
  company_name: string
  company_niche: string | null
  company_city: string | null
  company_state: string | null
  company_rating: number | null
  company_reviews: number | null
  company_website: string | null
  company_phone: string | null
  overall_score: number
  visibility_score: number
  review_velocity: number
  lost_revenue_estimate: number
  score_breakdown: Record<string, number>
  ai_action_plan: string[]
  share_token: string
  generated_at: string
}

const TIER_COLORS: Record<string, string> = {
  hot:  'bg-red-500/20 text-red-400 border-red-500/30',
  warm: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cold: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

function scoreLabel(s: number): { label: string; color: string } {
  if (s >= 80) return { label: 'Excellent',  color: 'text-emerald-400' }
  if (s >= 60) return { label: 'Good',       color: 'text-blue-400' }
  if (s >= 40) return { label: 'Fair',       color: 'text-amber-400' }
  return             { label: 'Needs Work',  color: 'text-red-400' }
}

function scoreBarColor(s: number): string {
  if (s >= 80) return 'bg-emerald-500'
  if (s >= 60) return 'bg-blue-500'
  if (s >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

// ── Inner component ───────────────────────────────────────────────────────────
function ReputationReportInner() {
  const searchParams = useSearchParams()
  const preloadId    = searchParams.get('company')

  const [search,     setSearch]     = useState('')
  const [companies,  setCompanies]  = useState<Company[]>([])
  const [showDrop,   setShowDrop]   = useState(false)
  const [selected,   setSelected]   = useState<Company | null>(null)
  const [loadingQ,   setLoadingQ]   = useState(false)
  const [report,     setReport]     = useState<Report | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState<string | null>(null)
  const [copied,     setCopied]     = useState(false)

  // Preload from query param
  useEffect(() => {
    if (!preloadId) return
    fetch(`/api/companies/${preloadId}`)
      .then((r) => r.json())
      .then((c) => { setSelected(c); generateReport(c.id) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadId])

  // Search companies
  const searchCompanies = useCallback(async (q: string) => {
    if (!q.trim()) { setCompanies([]); return }
    setLoadingQ(true)
    const res  = await fetch(`/api/companies/list?search=${encodeURIComponent(q)}&pageSize=8`)
    const data = await res.json()
    setCompanies(data.companies ?? [])
    setLoadingQ(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchCompanies(search), 300)
    return () => clearTimeout(t)
  }, [search, searchCompanies])

  async function generateReport(companyId: string, refresh = false) {
    setGenerating(true)
    setGenError(null)
    setReport(null)
    const url = `/api/report/${companyId}${refresh ? '?refresh=true' : ''}`
    const res = await fetch(url)
    if (!res.ok) { setGenError('Failed to generate report.'); setGenerating(false); return }
    const data = await res.json()
    setReport(data)
    setGenerating(false)
  }

  function selectCompany(c: Company) {
    setSelected(c)
    setShowDrop(false)
    setSearch('')
    setReport(null)
    generateReport(c.id)
  }

  return (
    <div className="max-w-[960px] space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center">
          <FileBarChart2 className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Online Positioning Report</h1>
          <p className="text-xs text-slate-500">AI-generated audit showing reputation gaps vs competitors</p>
        </div>
      </div>

      {/* Company selector */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Select Business</div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            {selected ? (
              <div className="flex items-center gap-3 h-10 px-3 bg-[#1a1a30] border border-[#252540] rounded-lg">
                <Avatar name={selected.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white truncate">{selected.name}</span>
                  {selected.city && <span className="text-xs text-slate-500 ml-2">{selected.city}</span>}
                </div>
                {selected.opportunity_tier && (
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase border', TIER_COLORS[selected.opportunity_tier])}>
                    {selected.opportunity_tier}
                  </span>
                )}
                <button onClick={() => { setSelected(null); setReport(null) }} className="text-slate-600 hover:text-slate-400 ml-1">×</button>
              </div>
            ) : (
              <>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search a company from your database…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowDrop(true) }}
                  onFocus={() => setShowDrop(true)}
                  className="w-full h-10 pl-9 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-sky-500/50"
                />
                {showDrop && (search || companies.length > 0) && (
                  <div className="absolute top-11 left-0 right-0 bg-[#111120] border border-[#252540] rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                    {loadingQ && <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…</div>}
                    {companies.map((c) => (
                      <button key={c.id} onClick={() => selectCompany(c)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left">
                        <Avatar name={c.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-200 truncate">{c.name}</div>
                          <div className="text-xs text-slate-600 truncate">{[c.niche, c.city].filter(Boolean).join(' · ')}</div>
                        </div>
                        {c.rating && <span className="text-xs text-amber-400 flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400" />{c.rating.toFixed(1)}</span>}
                      </button>
                    ))}
                    {!loadingQ && companies.length === 0 && search && (
                      <div className="px-3 py-3 text-xs text-slate-600">No companies found.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          {selected && (
            <Button variant="secondary" size="sm" onClick={() => generateReport(selected.id, true)} disabled={generating}>
              <RotateCcw className="w-3.5 h-3.5" /> Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {generating && (
        <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-16 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <div className="text-sm text-slate-400">Generating positioning report with AI…</div>
          <div className="text-xs text-slate-600">Analyzing ratings, visibility, and revenue gaps</div>
        </div>
      )}

      {/* Error */}
      {genError && !generating && (
        <div className="bg-[#111120] border border-red-500/20 rounded-xl p-6 text-center text-red-400 text-sm">{genError}</div>
      )}

      {/* Empty state */}
      {!selected && !generating && !report && (
        <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-16 flex flex-col items-center gap-3 text-slate-600">
          <FileBarChart2 className="w-10 h-10 opacity-30" />
          <p className="text-sm">Select a business to generate their positioning report</p>
          <p className="text-xs text-slate-700">The report shows reputation score, visibility gaps, revenue impact, and AI recommendations</p>
        </div>
      )}

      {/* ── REPORT ──────────────────────────────────────────────────────────── */}
      {report && !generating && (() => {
        const { label: scoreText, color: scoreColor } = scoreLabel(report.overall_score)
        return (
          <div className="space-y-4">
            {/* Company header + overall score */}
            <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Avatar name={report.company_name} size="xl" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{report.company_name}</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-400">
                      {report.company_niche && <span>{report.company_niche}</span>}
                      {(report.company_city || report.company_state) && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[report.company_city, report.company_state].filter(Boolean).join(', ')}</span>
                      )}
                      {report.company_rating && (
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-amber-400">{report.company_rating.toFixed(1)}</span></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overall score ring */}
                <div className="text-center">
                  <div className={cn('text-5xl font-black', scoreColor)}>{report.overall_score}</div>
                  <div className={cn('text-sm font-semibold mt-1', scoreColor)}>{scoreText}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Reputation Score / 100</div>
                </div>
              </div>

              {/* Score bar */}
              <div className="mt-5 pt-5 border-t border-[#1e1e38]">
                <Progress value={report.overall_score} barClassName={scoreBarColor(report.overall_score)} className="h-3" />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>0 — Invisible</span>
                  <span>50 — Average</span>
                  <span>100 — Dominant</span>
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon:  <Star className="w-4 h-4" />,
                  label: 'Star Rating',
                  value: report.company_rating ? `${report.company_rating.toFixed(1)}★` : 'None',
                  sub:   report.company_rating && report.company_rating >= 4.5 ? 'Above average' : report.company_rating && report.company_rating >= 4.0 ? 'Room to improve' : 'Below average',
                  ok:    (report.company_rating ?? 0) >= 4.2,
                  color: 'text-amber-400', bg: 'bg-amber-500/10',
                },
                {
                  icon:  <Eye className="w-4 h-4" />,
                  label: 'Review Count',
                  value: (report.company_reviews ?? 0).toLocaleString(),
                  sub:   `${report.review_velocity}/mo velocity`,
                  ok:    (report.company_reviews ?? 0) >= 50,
                  color: 'text-indigo-400', bg: 'bg-indigo-500/10',
                },
                {
                  icon:  <TrendingUp className="w-4 h-4" />,
                  label: 'Visibility Score',
                  value: `${report.visibility_score}%`,
                  sub:   'vs local average',
                  ok:    report.visibility_score >= 60,
                  color: 'text-emerald-400', bg: 'bg-emerald-500/10',
                },
                {
                  icon:  <DollarSign className="w-4 h-4" />,
                  label: 'Est. Lost Revenue',
                  value: report.lost_revenue_estimate > 0 ? `$${report.lost_revenue_estimate.toLocaleString()}/mo` : '$0',
                  sub:   'due to rating gap',
                  ok:    report.lost_revenue_estimate === 0,
                  color: report.lost_revenue_estimate > 0 ? 'text-red-400' : 'text-emerald-400',
                  bg:    report.lost_revenue_estimate > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
                },
              ].map((m) => (
                <div key={m.label} className="bg-[#111120] border border-[#1e1e38] rounded-xl p-4">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', m.bg)}>
                    <span className={m.color}>{m.icon}</span>
                  </div>
                  <div className={cn('text-2xl font-bold', m.color)}>{m.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Online presence audit */}
              <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1e1e38]">
                  <div className="text-sm font-semibold text-white">Online Presence Audit</div>
                </div>
                <div className="divide-y divide-[#14142a]">
                  {[
                    {
                      item: 'Google Rating',
                      status: report.company_rating
                        ? (report.company_rating >= 4.5 ? 'excellent' : report.company_rating >= 4.0 ? 'good' : 'poor')
                        : 'missing',
                      detail: report.company_rating ? `${report.company_rating.toFixed(1)}★` : 'No rating',
                    },
                    {
                      item: 'Review Volume',
                      status: (report.company_reviews ?? 0) >= 100 ? 'excellent' : (report.company_reviews ?? 0) >= 30 ? 'good' : 'poor',
                      detail: `${(report.company_reviews ?? 0).toLocaleString()} reviews`,
                    },
                    {
                      item: 'Website',
                      status: report.company_website ? 'good' : 'missing',
                      detail: report.company_website ? report.company_website.replace(/^https?:\/\//, '') : 'Not found',
                    },
                    {
                      item: 'Phone Listed',
                      status: report.company_phone ? 'good' : 'missing',
                      detail: report.company_phone ?? 'Not listed',
                    },
                    {
                      item: 'Review Velocity',
                      status: report.review_velocity >= 5 ? 'excellent' : report.review_velocity >= 2 ? 'good' : 'poor',
                      detail: `~${report.review_velocity} reviews/month`,
                    },
                  ].map((row) => {
                    const icon =
                      row.status === 'excellent' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                      row.status === 'good'      ? <CheckCircle2 className="w-4 h-4 text-blue-400" />    :
                      row.status === 'poor'      ? <AlertTriangle className="w-4 h-4 text-amber-400" />   :
                                                   <AlertTriangle className="w-4 h-4 text-red-400" />
                    const textColor =
                      row.status === 'excellent' ? 'text-emerald-400' :
                      row.status === 'good'      ? 'text-blue-400'    :
                      row.status === 'poor'      ? 'text-amber-400'   : 'text-red-400'

                    return (
                      <div key={row.item} className="flex items-center gap-3 px-5 py-3">
                        {icon}
                        <div className="flex-1">
                          <div className="text-xs font-medium text-slate-300">{row.item}</div>
                          <div className={cn('text-[10px]', textColor)}>{row.detail}</div>
                        </div>
                        <span className={cn('text-[10px] font-semibold uppercase', textColor)}>{row.status}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Score breakdown */}
              <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
                <div className="text-sm font-semibold text-white mb-4">Score Breakdown</div>
                <div className="space-y-3">
                  {[
                    { label: 'Rating Score',    key: 'rating',      max: 40 },
                    { label: 'Review Volume',   key: 'reviews',     max: 30 },
                    { label: 'Digital Presence', key: 'presence',   max: 20 },
                    { label: 'Profile Complete', key: 'completeness', max: 10 },
                  ].map((sub) => {
                    const val = report.score_breakdown[sub.key] ?? 0
                    const pct = (val / sub.max) * 100
                    return (
                      <div key={sub.key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">{sub.label}</span>
                          <span className="text-white font-semibold">{val} / {sub.max}</span>
                        </div>
                        <Progress value={pct} barClassName={scoreBarColor(pct)} />
                      </div>
                    )
                  })}
                </div>

                {report.lost_revenue_estimate > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#1e1e38] p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <TrendingDown className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-red-400">Revenue Impact</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Estimated <span className="text-red-400 font-semibold">${report.lost_revenue_estimate.toLocaleString()}/month</span> in
                          lost revenue due to below-average rating. Improving to 4.5★ could recover this.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Action Plan */}
            <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1e1e38]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-sm font-semibold text-white">AI Action Plan</div>
                <span className="text-xs text-slate-500">— personalised to {report.company_name}</span>
              </div>
              <div className="divide-y divide-[#14142a]">
                {report.ai_action_plan.map((action, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-indigo-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{action}</p>
                    <ChevronRight className="w-4 h-4 text-slate-700 mt-0.5 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Next steps CTA */}
            <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/20 border border-indigo-500/20 rounded-xl p-5">
              <div className="text-sm font-semibold text-white mb-1">What happens next?</div>
              <p className="text-xs text-slate-400 mb-4">
                Use this report to open the conversation. The right offer depends on their biggest gap.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link href={`/outreach/compose?company=${report.company_id}`}>
                  <Button variant="primary" size="sm">
                    <Sparkles className="w-3.5 h-3.5" /> Generate Outreach
                  </Button>
                </Link>
                <Link href={`/companies/${report.company_id}`}>
                  <Button variant="secondary" size="sm">
                    View Company Intel
                  </Button>
                </Link>
              </div>

              <div className="mt-4 pt-4 border-t border-indigo-500/20">
                <div className="text-xs text-slate-500 mb-2">Share this report</div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/report/${report.share_token}`}
                    className="flex-1 h-9 px-3 bg-[#0f122a] border border-[#252540] rounded-lg text-xs text-slate-200"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${typeof window !== 'undefined' ? window.location.origin : ''}/report/${report.share_token}`,
                      )
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-700 text-right">
              Generated {new Date(report.generated_at).toLocaleString()}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
export default function ReputationReportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-40 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      </div>
    }>
      <ReputationReportInner />
    </Suspense>
  )
}
