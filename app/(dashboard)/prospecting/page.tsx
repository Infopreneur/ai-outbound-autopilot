'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  niche: string | null
  source: string | null
  rating: number | null
  review_count: number | null
  opportunity_score: number | null
  opportunity_tier: 'hot' | 'warm' | 'cold' | null
  opportunity_reason: string | null
  recommended_offer: string | null
  recommended_next_step: string | null
  scored_reason: Record<string, unknown> | null
  created_at: string
}

type DiscoveryResult = {
  count: number
  insertedCount: number
  updatedCount: number
  hotCount: number
  topScored?: { name: string; city: string | null; rating: number | null }[]
}

const TIER_COLORS: Record<string, string> = {
  hot:  'bg-red-500/20 text-red-400 border border-red-500/30',
  warm: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  cold: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

const SCORE_COLOR = (s: number | null) =>
  !s ? 'text-slate-500' : s >= 75 ? 'text-emerald-400' : s >= 45 ? 'text-amber-400' : 'text-slate-400'

// ── CSV export ──────────────────────────────────────────────────────────────
function exportCSV(companies: Company[]) {
  const headers = ['Name', 'Niche', 'City', 'State', 'Website', 'Phone', 'Rating', 'Reviews', 'Score', 'Tier', 'Recommended Offer', 'Next Step', 'Source']
  const rows = companies.map((c) => [
    c.name,
    c.niche ?? '',
    c.city ?? '',
    c.state ?? '',
    c.website ?? '',
    c.phone ?? '',
    c.rating?.toString() ?? '',
    c.review_count?.toString() ?? '',
    c.opportunity_score?.toString() ?? '',
    c.opportunity_tier ?? '',
    c.recommended_offer ?? '',
    c.recommended_next_step ?? '',
    c.source ?? '',
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))

  const csv  = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

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
  const [open, setOpen]           = useState(true)
  const [source, setSource]       = useState<JobSource>('google-places')
  const [niche, setNiche]         = useState('')
  const [city, setCity]           = useState('')
  const [stateVal, setStateVal]   = useState('')
  const [maxResults, setMax]      = useState(50)
  const [runState, setRunState]   = useState<RunState>('idle')
  const [result, setResult]       = useState<DiscoveryResult | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [progress, setProgress]   = useState(0)

  const activeSource = SOURCES.find((s) => s.value === source) ?? SOURCES[0]
  const isComingSoon = activeSource.badge === 'soon'
  const canRun       = !isComingSoon && !!niche.trim() && runState !== 'running'

  async function handleRun() {
    if (!canRun) return
    setRunState('running'); setError(null); setResult(null); setProgress(0)
    const ticker = setInterval(() => setProgress((p) => Math.min(p + Math.random() * 15, 85)), 400)
    try {
      const res = await fetch(activeSource.endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, niche: niche.trim(), city: city.trim() || undefined, state: stateVal.trim() || undefined, maxResults }),
      })
      clearInterval(ticker); setProgress(100)
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Discovery failed') }
      const data = await res.json()
      setResult({ count: data.count ?? 0, insertedCount: data.insertedCount ?? 0, updatedCount: data.updatedCount ?? 0, hotCount: data.hotCount ?? 0, topScored: data.topScored })
      setRunState('done')
      onJobComplete()
    } catch (err) {
      clearInterval(ticker)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setRunState('error')
    }
  }

  function reset() { setRunState('idle'); setResult(null); setError(null); setProgress(0) }

  return (
    <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-white">Lead Discovery</div>
            <div className="text-xs text-slate-500">Scrape, score, and save leads automatically</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {runState === 'running' && <span className="flex items-center gap-1.5 text-xs text-blue-400"><Loader2 className="w-3 h-3 animate-spin" />Running…</span>}
          {runState === 'done' && result && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              {result.insertedCount} new · {result.updatedCount} updated
            </span>
          )}
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
                  {s.badge === 'soon' && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-700 text-slate-400 uppercase">Soon</span>}
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
              <input type="text" placeholder="AZ" maxLength={2} value={stateVal} onChange={(e) => setStateVal(e.target.value.toUpperCase())}
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
                <span>Scraping {niche} in {[city, stateVal].filter(Boolean).join(', ') || 'all locations'}…</span>
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

          {runState === 'done' && result && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-emerald-400">
                  <span className="font-semibold">{result.count}</span> companies found —{' '}
                  <span className="font-semibold">{result.insertedCount}</span> new,{' '}
                  <span className="font-semibold">{result.updatedCount}</span> updated
                  {result.hotCount > 0 && (
                    <span className="ml-2 text-red-400 font-semibold">· 🔥 {result.hotCount} hot leads</span>
                  )}
                </span>
              </div>
              {result.topScored && result.topScored.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {result.topScored.map((t, i) => (
                    <span key={i} className="text-[10px] bg-[#1a1a30] border border-[#252540] rounded px-2 py-1 text-slate-400">
                      {t.name}{t.city ? ` · ${t.city}` : ''}{t.rating ? ` · ⭐${t.rating}` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: 'Highest Score', value: 'opportunity_score', order: 'desc' },
  { label: 'Most Reviews',  value: 'review_count',      order: 'desc' },
  { label: 'Best Rating',   value: 'rating',             order: 'desc' },
  { label: 'Newest First',  value: 'created_at',         order: 'desc' },
]

export default function ProspectingPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [tier, setTier]           = useState('')
  const [niche, setNiche]         = useState('')
  const [source, setSource]       = useState('')
  const [sortIdx, setSortIdx]     = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const sort = SORT_OPTIONS[sortIdx]

  // Unique niches from loaded data (for filter pills)
  const niches = useMemo(() =>
    [...new Set(companies.map((c) => c.niche).filter(Boolean) as string[])].sort(),
    [companies],
  )

  const loadCompanies = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      sortBy:    sort.value,
      sortOrder: sort.order,
      pageSize:  '200',
    })
    if (search) params.set('search', search)
    if (tier)   params.set('tier', tier)
    if (niche)  params.set('niche', niche)
    if (source) params.set('source', source)

    fetch(`/api/companies/list?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCompanies(Array.isArray(data.companies) ? data.companies : [])
        setTotal(data.total ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search, tier, niche, source, sort.value, sort.order])

  useEffect(() => {
    const t = setTimeout(loadCompanies, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [loadCompanies, search])

  const hotCount = companies.filter((c) => c.opportunity_tier === 'hot').length
  const avgScore = companies.length
    ? Math.round(companies.reduce((s, c) => s + (c.opportunity_score ?? 0), 0) / companies.length)
    : 0

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total in DB',    value: loading ? '—' : total.toLocaleString(),            color: 'text-white' },
          { label: 'Hot Leads',      value: loading ? '—' : hotCount.toString(),               color: 'text-red-400' },
          { label: 'Avg Opp Score',  value: loading ? '—' : avgScore.toString(),               color: 'text-indigo-400' },
          { label: 'Showing',        value: loading ? '—' : companies.length.toString(),       color: 'text-emerald-400' },
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
            <input type="text" placeholder="Search name, city, or website…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
          </div>

          {/* Sort selector */}
          <div className="flex gap-1">
            {SORT_OPTIONS.map((s, i) => (
              <button key={s.value} onClick={() => setSortIdx(i)}
                className={cn('px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                  sortIdx === i ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 bg-[#1a1a30] border border-[#252540] hover:text-slate-300')}>
                {s.label}
              </button>
            ))}
          </div>

          <Button variant={showFilters ? 'primary' : 'secondary'} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />Filters{(tier || niche || source) ? ' ●' : ''}
          </Button>
          <Button variant="secondary" size="sm"><Sparkles className="w-3.5 h-3.5 text-indigo-400" />AI Prospect</Button>
          <Button variant="secondary" size="sm" onClick={() => exportCSV(companies)}>
            <Download className="w-3.5 h-3.5" />Export CSV
          </Button>
          <div className="ml-auto text-sm text-slate-500">
            <span className="text-white font-semibold">{companies.length}</span> of <span className="text-slate-400">{total.toLocaleString()}</span>
          </div>
        </div>

        {showFilters && (
          <div className="pt-3 border-t border-[#1e1e38] space-y-2">
            {/* Tier */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-600 uppercase w-12">Tier</span>
              {['', 'hot', 'warm', 'cold'].map((t) => (
                <button key={t} onClick={() => setTier(t)}
                  className={cn('px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors',
                    tier === t ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]')}>
                  {t || 'All'}
                </button>
              ))}
            </div>

            {/* Source */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-600 uppercase w-12">Source</span>
              {['', 'google-native', 'apify'].map((s) => (
                <button key={s} onClick={() => setSource(s)}
                  className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    source === s ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]')}>
                  {s || 'All'}
                </button>
              ))}
            </div>

            {/* Niche (dynamic from data) */}
            {niches.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold text-slate-600 uppercase w-12">Niche</span>
                <button onClick={() => setNiche('')}
                  className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    !niche ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]')}>
                  All
                </button>
                {niches.map((n) => (
                  <button key={n} onClick={() => setNiche(niche === n ? '' : n)}
                    className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                      niche === n ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]')}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Companies table */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading…
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16 text-slate-600 text-sm">
            {total === 0
              ? 'No companies yet. Run a discovery job above to get started.'
              : 'No results match your filters.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-[#1e1e38]">
              <tr>
                {['Business Name', 'Niche', 'Location', 'Website', 'Phone', 'Rating', 'Reviews', 'Score', 'Tier'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0f0f1e]">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.015] transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-white">{c.name}</div>
                    {c.recommended_offer && (
                      <div className="text-[10px] text-slate-600 mt-0.5 max-w-[200px] truncate" title={c.recommended_offer}>
                        {c.recommended_offer}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-indigo-400">{c.niche ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {(c.city || c.state) ? (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-600" />
                        {[c.city, c.state].filter(Boolean).join(', ')}
                      </div>
                    ) : <span className="text-xs text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-[150px]">
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 truncate transition-colors">
                        <Globe className="w-3 h-3 flex-shrink-0 text-slate-600" />
                        <span className="truncate">{c.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ) : <span className="text-xs text-red-400/60">No website</span>}
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
                    {c.opportunity_score !== null ? (
                      <span
                        className={cn('text-sm font-bold cursor-help', SCORE_COLOR(c.opportunity_score))}
                        title={c.opportunity_reason ?? undefined}
                      >
                        {c.opportunity_score}
                      </span>
                    ) : <span className="text-xs text-slate-700">—</span>}
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
