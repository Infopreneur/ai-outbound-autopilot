'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Download, SlidersHorizontal, Sparkles,
  Play, ChevronDown, ChevronUp, MapPin, Globe, Phone, Star,
  Loader2, CheckCircle2, AlertCircle, Zap, X, Edit2, ArrowRight, Save,
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
  strategy: string | null
  deep_dive_note: string | null
  source_url: string | null
  converted_to_deal: boolean | null
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

const STRATEGY_COLORS: Record<string, string> = {
  'Ad spender':      'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  'Expansion':       'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'Hiring':          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'Multi-location':  'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
}

const STRATEGIES = ['Ad spender', 'Expansion', 'Hiring', 'Multi-location']

const SCORE_COLOR = (s: number | null) =>
  !s ? 'text-slate-500' : s >= 75 ? 'text-emerald-400' : s >= 45 ? 'text-amber-400' : 'text-slate-400'

// ── CSV export ──────────────────────────────────────────────────────────────
function exportCSV(companies: Company[]) {
  const headers = ['Name', 'Niche', 'City', 'State', 'Website', 'Phone', 'Rating', 'Reviews', 'Score', 'Tier', 'Strategy', 'Side Note', 'Source URL', 'Recommended Offer', 'Next Step', 'Source']
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
    c.strategy ?? '',
    c.deep_dive_note ?? '',
    c.source_url ?? '',
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

function getCurrentOwnerName() {
  if (typeof window === 'undefined') return 'Alex Kim'
  try {
    const saved = window.localStorage.getItem('userAccount')
    if (!saved) return 'Alex Kim'
    const parsed = JSON.parse(saved) as { name?: unknown }
    return typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Alex Kim'
  } catch {
    return 'Alex Kim'
  }
}

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
    <div className="overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-bg-muted)_96%,white_4%)_0%,var(--panel-bg)_100%)] shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-[var(--hover-bg)]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Lead Discovery</div>
            <div className="text-xs text-[var(--text-muted)]">Scrape, score, and save leads automatically</div>
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
          {open ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-[var(--panel-border)] p-5">
          {/* Source */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Source</label>
            <div className="flex gap-2 flex-wrap">
              {SOURCES.map((s) => (
                <button key={s.value} onClick={() => setSource(s.value)}
                  className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                    source === s.value ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' : 'border-[var(--input-border)] bg-[var(--input-bg-muted)] text-[var(--text-secondary)] hover:border-indigo-400/30 hover:text-[var(--text-primary)]')}>
                  <span>{s.icon}</span>{s.label}
                  {s.badge === 'soon' && <span className="rounded bg-[var(--hover-bg)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--text-subtle)]">Soon</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Niche / Business Type <span className="text-red-400">*</span></label>
              <input type="text" placeholder="e.g. Roofing Contractors, HVAC, Dentists…" value={niche} onChange={(e) => setNiche(e.target.value)}
                className="h-9 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-secondary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">City</label>
              <input type="text" placeholder="Phoenix" value={city} onChange={(e) => setCity(e.target.value)}
                className="h-9 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-secondary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-indigo-500/50" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">State</label>
              <input type="text" placeholder="AZ" maxLength={2} value={stateVal} onChange={(e) => setStateVal(e.target.value.toUpperCase())}
                className="h-9 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm uppercase text-[var(--text-secondary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-indigo-500/50" />
            </div>
          </div>

          {/* Max results + run */}
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Max Results</label>
              <div className="flex gap-1">
                {MAX_OPTIONS.map((n) => (
                  <button key={n} onClick={() => setMax(n)}
                    className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      maxResults === n ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'border border-[var(--input-border)] bg-[var(--input-bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)]')}>
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
              <div className="flex items-center justify-between text-[10px] text-[var(--text-subtle)]">
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
                    <span key={i} className="rounded border border-[var(--input-border)] bg-[var(--input-bg-muted)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">
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

// ── Prospect Edit Modal ──────────────────────────────────────────────────────
function ProspectEditModal({
  company,
  onClose,
  onSaved,
  onConverted,
}: {
  company: Company
  onClose: () => void
  onSaved: (updated: Company) => void
  onConverted: (updated: Company, dealId: string) => void
}) {
  const [strategy, setStrategy]       = useState(company.strategy ?? '')
  const [sourceUrl, setSourceUrl]     = useState(company.source_url ?? '')
  const [deepDiveNote, setDeepDiveNote] = useState(company.deep_dive_note ?? '')
  const [convertOnSave, setConvertOnSave] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [converting, setConverting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  async function saveProspect(extra: Record<string, unknown> = {}) {
    const res = await fetch(`/api/companies/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategy: strategy || null,
        source_url: sourceUrl || null,
        deep_dive_note: deepDiveNote || null,
        ...extra,
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error ?? 'Save failed')
    }
    const { company: updated } = await res.json()
    return updated as Company
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const updated = await saveProspect()
      onSaved(updated)
      if (convertOnSave) {
        const convertRes = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: company.id,
            owner: getCurrentOwnerName(),
            deepDiveNote: deepDiveNote || null,
          }),
        })
        if (!convertRes.ok) {
          const d = await convertRes.json()
          throw new Error(d.error ?? 'Convert failed')
        }
        const { deal } = await convertRes.json()
        onConverted({ ...updated, converted_to_deal: true }, deal.id)
        return
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleConvert() {
    setConverting(true); setError(null)
    try {
      const updated = await saveProspect()
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          owner: getCurrentOwnerName(),
          deepDiveNote: deepDiveNote || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Convert failed') }
      const { deal } = await res.json()
      onConverted({ ...updated, converted_to_deal: true }, deal.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Convert failed')
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--panel-border)] p-5">
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)]">{company.name}</div>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">{[company.city, company.state].filter(Boolean).join(', ') || company.website || 'No location'}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-subtle)] transition-colors hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Strategy */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Strategy</label>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setStrategy('')}
                className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  !strategy ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'border border-[var(--input-border)] bg-[var(--input-bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)]')}>
                None
              </button>
              {STRATEGIES.map((s) => (
                <button key={s} onClick={() => setStrategy(strategy === s ? '' : s)}
                  className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    strategy === s
                      ? (STRATEGY_COLORS[s] ?? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30')
                      : 'border border-[var(--input-border)] bg-[var(--input-bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)]')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Source URL */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Source URL</label>
            <input type="url" placeholder="https://facebook.com/ads/… or job posting link…"
              value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
              className="h-9 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-secondary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
          </div>

          {/* Deep dive note */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Side Note / Hook</label>
            <textarea
              placeholder={`e.g. "Saw their 'Free Roof Inspection' Facebook ad — high spend signal"`}
              value={deepDiveNote} onChange={(e) => setDeepDiveNote(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-secondary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={convertOnSave}
              onChange={(e) => setConvertOnSave(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-indigo-500 focus:ring-indigo-500"
            />
            Convert to deal on save
          </label>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--panel-border)] p-5">
          <button
            onClick={handleConvert}
            disabled={converting || saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
            {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Convert to Deal
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        </div>
      </div>
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
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [tier, setTier]           = useState('')
  const [niche, setNiche]         = useState('')
  const [source, setSource]       = useState('')
  const [strategy, setStrategy]   = useState('')
  const [sortIdx, setSortIdx]     = useState(0)
  const [editCompany, setEditCompany] = useState<Company | null>(null)

  const sort = SORT_OPTIONS[sortIdx]

  // Unique niches from loaded data (for filter pills)
  const niches = useMemo(() =>
    [...new Set(companies.map((c) => c.niche).filter(Boolean) as string[])].sort(),
    [companies],
  )

  // Strategy breakdown for stats
  const strategyBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      if (c.strategy) counts[c.strategy] = (counts[c.strategy] ?? 0) + 1
    }
    return counts
  }, [companies])

  const loadCompanies = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      sortBy:    sort.value,
      sortOrder: sort.order,
      pageSize:  '200',
    })
    if (search)   params.set('search', search)
    if (tier)     params.set('tier', tier)
    if (niche)    params.set('niche', niche)
    if (source)   params.set('source', source)
    if (strategy) params.set('strategy', strategy)

    fetch(`/api/companies/list?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCompanies(Array.isArray(data.companies) ? data.companies : [])
        setTotal(data.total ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search, tier, niche, source, strategy, sort.value, sort.order])

  useEffect(() => {
    const t = setTimeout(loadCompanies, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [loadCompanies, search])

  function handleProspectSaved(updated: Company) {
    setCompanies((prev) => prev.map((c) => c.id === updated.id ? updated : c))
  }

  function handleProspectConverted(updated: Company, dealId: string) {
    setCompanies((prev) => prev.map((c) => c.id === updated.id ? updated : c))
    setEditCompany(null)
    router.push(`/pipeline?deal=${dealId}`)
  }

  const hotCount = companies.filter((c) => c.opportunity_tier === 'hot').length
  const avgScore = companies.length
    ? Math.round(companies.reduce((s, c) => s + (c.opportunity_score ?? 0), 0) / companies.length)
    : 0
  const convertedCount = companies.filter((c) => c.converted_to_deal).length

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total in DB',    value: loading ? '—' : total.toLocaleString(),            color: 'text-[var(--text-primary)]' },
          { label: 'Hot Leads',      value: loading ? '—' : hotCount.toString(),               color: 'text-red-400' },
          { label: 'Avg Opp Score',  value: loading ? '—' : avgScore.toString(),               color: 'text-indigo-400' },
          { label: 'Converted',      value: loading ? '—' : convertedCount.toString(),         color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[var(--panel-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-bg-muted)_95%,white_5%)_0%,var(--panel-bg)_100%)] px-5 py-4 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Strategy breakdown (only if there are tagged prospects) */}
      {Object.keys(strategyBreakdown).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(strategyBreakdown).map(([s, count]) => (
            <button key={s} onClick={() => setStrategy(strategy === s ? '' : s)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                strategy === s
                  ? (STRATEGY_COLORS[s] ?? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30')
                  : 'bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]')}>
              {s}
              <span className="rounded bg-[var(--hover-bg)] px-1 tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      )}

      <DiscoveryPanel onJobComplete={loadCompanies} />

      {/* Search + filter bar */}
      <div className="space-y-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input type="text" placeholder="Search name, city, or website…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] pl-9 pr-4 text-sm text-[var(--text-secondary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
          </div>

          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="h-9 min-w-[110px] rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-indigo-500/50"
          >
            <option value="">Tier</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="h-9 min-w-[140px] rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-indigo-500/50"
          >
            <option value="">Niche</option>
            {niches.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-9 min-w-[125px] rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-indigo-500/50"
          >
            <option value="">Source</option>
            <option value="google-native">Google Native</option>
            <option value="apify">Apify</option>
          </select>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="h-9 min-w-[140px] rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-indigo-500/50"
          >
            <option value="">Strategy</option>
            {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={String(sortIdx)}
            onChange={(e) => setSortIdx(Number(e.target.value))}
            className="h-9 min-w-[145px] rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-indigo-500/50"
          >
            {SORT_OPTIONS.map((s, i) => <option key={s.value} value={i}>{s.label}</option>)}
          </select>

          <Button variant="secondary" size="sm">
            <SlidersHorizontal className="w-3.5 h-3.5" />Smart Filters
          </Button>
          <Button variant="secondary" size="sm"><Sparkles className="w-3.5 h-3.5 text-indigo-400" />AI Prospect</Button>
          <Button variant="secondary" size="sm" onClick={() => exportCSV(companies)}>
            <Download className="w-3.5 h-3.5" />Export CSV
          </Button>
          <div className="ml-auto text-sm text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-primary)]">{companies.length}</span> of <span className="text-[var(--text-muted)]">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Companies table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-bg-muted)_96%,white_4%)_0%,var(--panel-bg)_100%)] shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading…
          </div>
        ) : companies.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--text-subtle)]">
            {total === 0
              ? 'No companies yet. Run a discovery job above to get started.'
              : 'No results match your filters.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-[var(--panel-border)]">
              <tr>
                {['Business Name', 'Niche', 'Location', 'Rating', 'Score', 'Tier', 'Strategy', 'Side Note', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--panel-border)]">
              {companies.map((c) => (
                <tr key={c.id} className={cn('transition-colors hover:bg-[var(--hover-bg)]', c.converted_to_deal && 'opacity-50')}>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{c.name}</div>
                    {c.website && (
                      <a href={c.website} target="_blank" rel="noopener noreferrer"
                        className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-[var(--text-subtle)] transition-colors hover:text-indigo-500">
                        <Globe className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{c.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                    {c.phone && (
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--text-subtle)]">
                        <Phone className="w-2.5 h-2.5" />{c.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-indigo-400">{c.niche ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {(c.city || c.state) ? (
                      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <MapPin className="h-3 w-3 text-[var(--text-subtle)]" />
                        {[c.city, c.state].filter(Boolean).join(', ')}
                      </div>
                    ) : <span className="text-xs text-[var(--text-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.rating !== null ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400 font-semibold">{c.rating.toFixed(1)}</span>
                        {c.review_count !== null && (
                          <span className="text-[10px] text-[var(--text-subtle)]">· {c.review_count.toLocaleString()}</span>
                        )}
                      </div>
                    ) : <span className="text-xs text-[var(--text-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.opportunity_score !== null ? (
                      <span
                        className={cn('text-sm font-bold cursor-help', SCORE_COLOR(c.opportunity_score))}
                        title={c.opportunity_reason ?? undefined}
                      >
                        {c.opportunity_score}
                      </span>
                    ) : <span className="text-xs text-[var(--text-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.opportunity_tier ? (
                      <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase', TIER_COLORS[c.opportunity_tier])}>
                        {c.opportunity_tier}
                      </span>
                    ) : <span className="text-xs text-[var(--text-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.strategy ? (
                      <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap',
                        STRATEGY_COLORS[c.strategy] ?? 'bg-slate-500/20 text-slate-400 border border-slate-500/30')}>
                        {c.strategy}
                      </span>
                    ) : <span className="text-xs text-[var(--text-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    {c.deep_dive_note ? (
                      <span className="line-clamp-2 text-[10px] text-[var(--text-muted)]" title={c.deep_dive_note}>
                        {c.deep_dive_note}
                      </span>
                    ) : <span className="text-xs text-[var(--text-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.converted_to_deal ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                        <CheckCircle2 className="w-3 h-3" />Converted
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setEditCompany(c)}
                          className="flex items-center gap-1 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] transition-colors hover:border-indigo-400/30 hover:text-[var(--text-primary)]">
                          <Edit2 className="w-2.5 h-2.5" />Edit
                        </button>
                        <button onClick={async () => {
                          const res = await fetch('/api/deals', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              companyId: c.id,
                              owner: getCurrentOwnerName(),
                              deepDiveNote: c.deep_dive_note ?? null,
                            }),
                          })
                          if (!res.ok) return
                          const { deal } = await res.json()
                          handleProspectConverted({ ...c, converted_to_deal: true }, deal.id)
                        }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                          <ArrowRight className="w-2.5 h-2.5" />Convert
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editCompany && (
        <ProspectEditModal
          company={editCompany}
          onClose={() => setEditCompany(null)}
          onSaved={handleProspectSaved}
          onConverted={handleProspectConverted}
        />
      )}
    </div>
  )
}
