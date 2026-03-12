'use client'

import { useState } from 'react'
import {
  Search, Sparkles, Download, RefreshCw, SlidersHorizontal,
  Play, ChevronDown, ChevronUp, MapPin, Globe, Phone, Star,
  Loader2, CheckCircle2, AlertCircle, Zap, Database, X,
} from 'lucide-react'
import { LeadTable }  from '@/components/lead-table'
import { Button }     from '@/components/ui/button'
import { Progress }   from '@/components/ui/progress'
import { mockLeads }  from '@/lib/mock-data'
import type { NormalizedCompanyLead, DiscoveryJob, JobSource } from '@/lib/discovery/types'
import { cn }         from '@/lib/utils'

const industries  = ['All', 'SaaS', 'FinTech', 'MarTech', 'AI/ML', 'Cloud Infrastructure', 'HR Tech', 'eCommerce']
const statuses    = ['All', 'hot', 'warm', 'cold', 'contacted', 'qualified']
const scoreRanges = ['All', '90+', '75–89', '60–74', 'Below 60']

const SOURCES: { value: JobSource; label: string; icon: string }[] = [
  { value: 'apify',      label: 'Google Maps (Apify)', icon: '📍' },
  { value: 'scraperapi', label: 'Yelp (ScraperAPI)',   icon: '⭐' },
  { value: 'manual',     label: 'Manual Entry',        icon: '✏️' },
]

const MAX_OPTIONS = [10, 25, 50, 100, 200]

function DiscoveryLeadCard({ lead }: { lead: NormalizedCompanyLead }) {
  return (
    <div className="bg-[#1a1a30] border border-[#252540] rounded-lg p-4 hover:border-[#32325a] hover:bg-[#1e1e38] transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate">{lead.name}</div>
          {lead.niche && <div className="text-[11px] text-indigo-400 mt-0.5">{lead.niche}</div>}
        </div>
        {lead.rating !== undefined && (
          <div className="flex items-center gap-1 text-xs text-amber-400 flex-shrink-0">
            <Star className="w-3 h-3 fill-amber-400" />
            {lead.rating.toFixed(1)}
            {lead.reviewCount && <span className="text-slate-600">({lead.reviewCount})</span>}
          </div>
        )}
      </div>
      <div className="space-y-1">
        {(lead.city || lead.state) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3 h-3" />
            {[lead.city, lead.state].filter(Boolean).join(', ')}
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <Globe className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone className="w-3 h-3" />
            {lead.phone}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="primary" size="sm" className="flex-1 justify-center text-[11px]">Add to Prospecting</Button>
        <Button variant="ghost" size="sm"><Sparkles className="w-3 h-3 text-indigo-400" /></Button>
      </div>
    </div>
  )
}

type RunState = 'idle' | 'running' | 'done' | 'error'
interface RunResult { job: DiscoveryJob; leads: NormalizedCompanyLead[]; count: number }

function DiscoveryPanel() {
  const [open, setOpen]         = useState(true)
  const [source, setSource]     = useState<JobSource>('apify')
  const [niche, setNiche]       = useState('')
  const [city, setCity]         = useState('')
  const [state, setState]       = useState('')
  const [maxResults, setMax]    = useState(50)
  const [runState, setRunState] = useState<RunState>('idle')
  const [result, setResult]     = useState<RunResult | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  async function handleRun() {
    if (!niche.trim()) return
    setRunState('running'); setError(null); setResult(null); setProgress(0)
    const ticker = setInterval(() => setProgress((p) => Math.min(p + Math.random() * 15, 85)), 400)
    try {
      const res = await fetch('/api/discovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, niche: niche.trim(), city: city.trim() || undefined, state: state.trim() || undefined, maxResults }),
      })
      clearInterval(ticker); setProgress(100)
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Discovery failed') }
      setResult(await res.json()); setRunState('done')
    } catch (err) {
      clearInterval(ticker)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.'); setRunState('error')
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
            <div className="text-xs text-slate-500">Scrape and import leads from external sources</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {runState === 'running' && <span className="flex items-center gap-1.5 text-xs text-blue-400"><Loader2 className="w-3 h-3 animate-spin" />Running…</span>}
          {runState === 'done' && result && <span className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" />{result.count} leads found</span>}
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#1e1e38]">
          <div className="p-5 space-y-4">
            {/* Source */}
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wide">Source</label>
              <div className="flex gap-2 flex-wrap">
                {SOURCES.map((s) => (
                  <button key={s.value} onClick={() => setSource(s.value)}
                    className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                      source === s.value ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' : 'text-slate-400 border-[#252540] bg-[#1a1a30] hover:text-slate-200 hover:border-[#32325a]')}>
                    <span>{s.icon}</span>{s.label}
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
                <Button variant="primary" size="md" onClick={handleRun} disabled={!niche.trim() || runState === 'running'}>
                  {runState === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {runState === 'running' ? 'Running…' : 'Run Discovery Job'}
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
          </div>

          {runState === 'done' && result && (
            <div className="border-t border-[#1e1e38] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />Job completed
                  </div>
                  <span className="text-sm text-slate-400">
                    <span className="text-white font-semibold">{result.count}</span> leads found for{' '}
                    <span className="text-indigo-400">"{niche}"</span>
                    {(city || state) && <span className="text-slate-500"> in {[city, state].filter(Boolean).join(', ')}</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Est. cost: <span className="text-slate-300 font-semibold">${result.job.costEstimate.toFixed(3)}</span></span>
                  <Button variant="secondary" size="sm"><Download className="w-3.5 h-3.5" />Export All</Button>
                  <Button variant="primary" size="sm"><Database className="w-3.5 h-3.5" />Save to Pipeline</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {result.leads.map((lead) => <DiscoveryLeadCard key={lead.id} lead={lead} />)}
              </div>
              {result.leads.length === 0 && (
                <div className="text-center py-10 text-slate-600 text-sm">No leads returned. Try a different niche or location.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FilterGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-500 w-16">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${value === o ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540] hover:border-[#32325a]'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ProspectingPage() {
  const [search, setSearch]           = useState('')
  const [industry, setIndustry]       = useState('All')
  const [status, setStatus]           = useState('All')
  const [scoreFilter, setScoreFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = mockLeads.filter((lead) => {
    const matchSearch   = !search || lead.name.toLowerCase().includes(search.toLowerCase()) || lead.company.toLowerCase().includes(search.toLowerCase()) || lead.title.toLowerCase().includes(search.toLowerCase())
    const matchIndustry = industry === 'All' || lead.industry === industry
    const matchStatus   = status   === 'All' || lead.status   === status
    const matchScore    = scoreFilter === 'All' || (scoreFilter === '90+' && lead.score >= 90) || (scoreFilter === '75–89' && lead.score >= 75 && lead.score < 90) || (scoreFilter === '60–74' && lead.score >= 60 && lead.score < 75) || (scoreFilter === 'Below 60' && lead.score < 60)
    return matchSearch && matchIndustry && matchStatus && matchScore
  })

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Prospects', value: '12,847', color: 'text-white' },
          { label: 'Hot Leads',       value: mockLeads.filter((l) => l.status === 'hot').length.toString(), color: 'text-red-400' },
          { label: 'Avg AI Score',    value: Math.round(mockLeads.reduce((s, l) => s + l.score, 0) / mockLeads.length).toString(), color: 'text-indigo-400' },
          { label: 'New Today',       value: '48', color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111120] border border-[#1e1e38] rounded-xl px-5 py-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <DiscoveryPanel />

      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input type="text" placeholder="Search name, company, or title…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" />
          </div>
          <Button variant={showFilters ? 'primary' : 'secondary'} size="sm" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal className="w-3.5 h-3.5" />Filters</Button>
          <Button variant="secondary" size="sm"><Sparkles className="w-3.5 h-3.5 text-indigo-400" />AI Prospect</Button>
          <Button variant="secondary" size="sm"><RefreshCw className="w-3.5 h-3.5" />Enrich</Button>
          <Button variant="secondary" size="sm"><Download className="w-3.5 h-3.5" />Export</Button>
          <div className="ml-auto text-sm text-slate-500"><span className="text-white font-semibold">{filtered.length}</span> results</div>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#1e1e38] flex flex-wrap gap-4">
            <FilterGroup label="Industry" options={industries}  value={industry}    onChange={setIndustry} />
            <FilterGroup label="Status"   options={statuses}    value={status}      onChange={setStatus} />
            <FilterGroup label="AI Score" options={scoreRanges} value={scoreFilter} onChange={setScoreFilter} />
          </div>
        )}
      </div>

      <LeadTable leads={filtered} />
    </div>
  )
}
