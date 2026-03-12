'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, Download, SlidersHorizontal, Sparkles,
  Play, ChevronDown, ChevronUp, MapPin, Globe, Phone, Star,
  Loader2, CheckCircle2, AlertCircle, Zap, X,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { JobSource } from '@/lib/discovery/types'
import { cn }       from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
type Company = {
  id: string
  name: string
  website: string | null
  phone: string | null
  city: string | null
  state: string | null
  rating: number | null
  review_count: number | null
  opportunity_score: number | null
  opportunity_tier: 'hot' | 'warm' | 'cold' | null
  opportunity_reason: string | null
  recommended_offer: string | null
  recommended_next_step: string | null
  created_at: string
}

const TIER_COLORS: Record<string, string> = {
  hot:  'bg-red-500/20 text-red-400 border border-red-500/30',
  warm: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  cold: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

const SCORE_COLOR = (s: number | null) =>
  !s ? 'text-slate-500' : s >= 75 ? 'text-emerald-400' : s >= 45 ? 'text-amber-400' : 'text-slate-400'

// ── Source config ───────────────────────────────────────────────────────────
interface SourceDef { value: JobSource; label: string; icon: string; endpoint: string; badge?: 'soon' }

const SOURCES: SourceDef[] = [
  { value: 'google-places', label: 'Google Maps (Native)', icon: '🗺️', endpoint: '/api/discovery' },
  { value: 'apify',         label: 'Google Maps (Apify)',  icon: '⚡', endpoint: '/api/discovery' },
  { value: 'yelp',          label: 'Yelp (ScraperAPI)',    icon: '⭐', endpoint: '/api/discovery', badge: 'soon' },
  { value: 'manual',        label: 'Manual Entry',         icon: '✏️', endpoint: '',               badge: 'soon' },
]

const MAX_OPTIONS = [10, 25, 50, 100, 200]

// ── Discovery panel ─────────────────────────────────────────────────────────
type RunState = 'idle' | 'running' | 'done' | 'error'

function DiscoveryPanel({ onJobComplete }: { onJobComplete: () => void }) {
  const [open, setOpen]         = useState(true)
  const [source, setSource]     = useState<JobSource>('google-places')
  const [niche, setNiche]       = useState('')
  const [city, setCity]         = useState('')
  const [state, setState]       = useState('')
  const [maxResults, setMax]    = useState(50)
  const [runState, setRunState] = useState<RunState>('idle')
  const [count, setCount]       = useState<number | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const activeSource = SOURCES.find((s) => s.value === source) ?? SOURCES[0]
  const isComingSoon = activeSource.badge === 'soon'
  const canRun       = !isComingSoon && !!niche.trim() && runState !== 'running'

  async function handleRun() {
    if (!canRun) return
    setRunState('running'); setError(null); setCount(null); setProgress(0)
    const ticker = setInterval(() => setProgress((p) => Math.min(p + Math.random() * 15, 85)), 400)
    try {
      const res = await fetch(activeSource.endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ source, niche: niche.trim(), city: city.trim() || undefined, state: state.trim() || undefined, maxResults }),
      })
      clearInterval(ticker); setProgress(100)
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Discovery failed') }
      const data = await res.json()
      setCount(data.count ?? data.results_count ?? 0)
      setRunState('done')
      onJobComplete()   // refresh company list
    } catch (err) {
      clearInterval(ticker)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setRunState('error')
    }
  }

  function reset() { setRunState('idle'); setCount(null); setError(null); setProgress(0) }

  return (
    <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-white">Lead Discovery</div>
            <div className="text-xs text-slate-500">Scrape and import leads from external sources</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {runState === 'running' && <span className="flex items-center gap-1.5 text-xs text-blue-400"><Loader2 className="w-3 h-3 animate-spin" />Running…</span>}
          {runState === 'done' && count !== null && <span className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" />{count} leads saved</span>}
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#1e1e38] p-5 space-y-4">
          {/* Source */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wide">Source</label>
            <div className="flex gap-2 flex-wrap">
              {SOURCES.map((s) => (
                <button key={s.value} onClick={() => setSource(s.value)}
                  className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                    source === s.value ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' : 'text-slate-400 border-[#252540] bg-[#1a1a30] hover:text-slate-200 hover:border-[#32325a]')}>
                  <span>{s.icon}</span>{s.label}
                  {s.badge === 'soon' && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-700 text-slate-400 uppercase tracking-wide">Soon</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wide">Niche / Business Type <span className="text-red-400">*</span></label>
              <input type="text" placeholder="e.g. Roofing Contractors, HVAC, Dentists…" value={niche} onChange={(e) => setNiche(e.target.value)}
                className="w-full h-9 px-3 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wide">City</label>
              <input type="text" placeholder="Phoenix" value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full h-9 px-3 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wide">State</label>
              <input type="text" placeholder="AZ" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 uppercase" />
            </div>
          </div>

          {/* Max results + run */}
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wide">Max Results</label>
              <div className="flex gap-1">
                {MAX_OPTIONS.map((n) => (
                  <button key={n} onClick={() => setMax(n)}
                    className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                      maxResults === n ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 bg-[#1a1a30] border border-[#252540] hover:text-slate-300')}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {(runState === 'done' || runState === 'error') && (
                <Button variant="ghost" size="sm" onClick={reset}><X className="w-3.5 h-3.5" />Clear</Button>
              )}
              <Button variant="primary" size="md" onClick={handleRun} disabled={!canRun}>
                {runState === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {runState === 'running' ? 'Running…' : isComingSoon ? 'Coming Soon' : 'Run Discovery Job'}
              </Button>
            </div>
          </div>

          {runState === 'running' && (
            <div className="space-y-1.5">
              <Progress value={progress} barClassName="bg-indigo-500 transition-all duration-300" />
              <div className="flex items-center justify-between text-[10px] text-slate-600">
                <span>Scraping {niche} in {[city, state].filter(Boolean).join(', ') || 'all locations'}…</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {runState === 'error' && error && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-red-400">Discovery Failed</div>
                <div className="text-xs text-red-400/70 mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {runState === 'done' && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-emerald-400">
                <span className="font-semibold">{count}</span> companies saved to Supabase. See results in the table below.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
const TIER_OPTIONS = ['All', 'hot', 'warm', 'cold']

export default function ProspectingPage() {
  const [companies, setCompanies]   = useState<Company[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [tier, setTier]             = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  const loadCompanies = useCallback(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((data) => { setCompanies(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadCompanies() }, [loadCompanies])

  const filtered = companies.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.website ?? '').toLowerCase().includes(search.toLowerCase())
    const matchTier = tier === 'All' || c.opportunity_tier === tier
    return matchSearch && matchTier
  })

  const hotCount = companies.filter((c) => c.opportunity_tier === 'hot').length
  const avgScore = companies.length
    ? Math.round(companies.reduce((s, c) => s + (c.opportunity_score ?? 0), 0) / companies.length)
    : 0

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Companies', value: loading ? '—' : companies.length.toLocaleString(), color: 'text-white' },
          { label: 'Hot Leads',       value: loading ? '—' : hotCount.toString(),               color: 'text-red-400' },
          { label: 'Avg Opp Score',   value: loading ? '—' : avgScore.toString(),                color: 'text-indigo-400' },
          { label: 'Showing',         value: loading ? '—' : filtered.length.toString(),         color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111120] border border-[#1e1e38] rounded-xl px-5 py-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <DiscoveryPanel onJobComplete={loadCompanies} />

      {/* Search + filter bar */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input type="text" placeholder="Search name, city, or website…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
          </div>
          <Button variant={showFilters ? 'primary' : 'secondary'} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />Filters
          </Button>
          <Button variant="secondary" size="sm"><Sparkles className="w-3.5 h-3.5 text-indigo-400" />AI Prospect</Button>
          <Button variant="secondary" size="sm"><Download className="w-3.5 h-3.5" />Export</Button>
          <div className="ml-auto text-sm text-slate-500">
            <span className="text-white font-semibold">{filtered.length}</span> results
          </div>
        </div>
        {showFilters && (
          <div className="pt-3 border-t border-[#1e1e38] flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 w-10">Tier</span>
            {TIER_OPTIONS.map((t) => (
              <button key={t} onClick={() => setTier(t)}
                className={cn('px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors',
                  tier === t ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]')}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Companies table */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-600 text-sm">
            {companies.length === 0
              ? 'No companies yet. Run a discovery job above to get started.'
              : 'No results match your search.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-[#1e1e38]">
              <tr>
                {['Business Name', 'Location', 'Website', 'Phone', 'Rating', 'Reviews', 'Opp Score', 'Tier'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0f0f1e]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.015] transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-white">{c.name}</div>
                    {c.recommended_offer && (
                      <div className="text-[10px] text-slate-600 mt-0.5 max-w-[200px] truncate">{c.recommended_offer}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(c.city || c.state) ? (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-600" />
                        {[c.city, c.state].filter(Boolean).join(', ')}
                      </div>
                    ) : <span className="text-xs text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    {c.website ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                        <Globe className="w-3 h-3 flex-shrink-0 text-slate-600" />
                        <span className="truncate">{c.website.replace(/^https?:\/\//, '')}</span>
                      </div>
                    ) : <span className="text-xs text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.phone ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Phone className="w-3 h-3 text-slate-600" />{c.phone}
                      </div>
                    ) : <span className="text-xs text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.rating !== null ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400 font-semibold">{c.rating.toFixed(1)}</span>
                      </div>
                    ) : <span className="text-xs text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">
                    {c.review_count !== null ? c.review_count.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {c.opportunity_score !== null
                      ? <span className={cn('text-sm font-bold', SCORE_COLOR(c.opportunity_score))}>{c.opportunity_score}</span>
                      : <span className="text-xs text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.opportunity_tier ? (
                      <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase', TIER_COLORS[c.opportunity_tier])}>
                        {c.opportunity_tier}
                      </span>
                    ) : <span className="text-xs text-slate-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
