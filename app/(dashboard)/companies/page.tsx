'use client'

import { useState, useEffect } from 'react'
import {
  Search, Building2, MapPin, Globe, Phone, Star,
  Loader2, TrendingUp, LayoutGrid, List,
} from 'lucide-react'
import { Avatar }   from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { cn }       from '@/lib/utils'

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
  hot:  'bg-red-500/20 text-red-400 border-red-500/30',
  warm: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cold: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const SCORE_COLOR = (s: number | null) =>
  !s ? 'text-slate-500' : s >= 75 ? 'text-emerald-400' : s >= 45 ? 'text-amber-400' : 'text-slate-400'

export default function CompaniesPage() {
  const [companies, setCompanies]   = useState<Company[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [tier, setTier]             = useState('All')
  const [view, setView]             = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((data) => { setCompanies(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = companies.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.website ?? '').toLowerCase().includes(search.toLowerCase())
    const matchTier = tier === 'All' || c.opportunity_tier === tier
    return matchSearch && matchTier
  })

  const hotCount  = companies.filter((c) => c.opportunity_tier === 'hot').length
  const avgScore  = companies.length
    ? Math.round(companies.reduce((s, c) => s + (c.opportunity_score ?? 0), 0) / companies.length)
    : 0
  const scored    = companies.filter((c) => c.opportunity_score !== null).length

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Companies', value: loading ? '—' : companies.length.toString(), color: 'text-white' },
          { label: 'Hot Leads',       value: loading ? '—' : hotCount.toString(),         color: 'text-red-400' },
          { label: 'Avg Opp Score',   value: loading ? '—' : avgScore.toString(),          color: 'text-indigo-400' },
          { label: 'Scored',          value: loading ? '—' : scored.toString(),            color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111120] border border-[#1e1e38] rounded-xl px-5 py-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search companies, cities, websites…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#1a1a30] border border-[#252540] rounded-lg p-1">
            <button onClick={() => setView('grid')} className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', view === 'grid' ? 'bg-indigo-600/30 text-indigo-400' : 'text-slate-500 hover:text-slate-300')}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setView('list')} className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', view === 'list' ? 'bg-indigo-600/30 text-indigo-400' : 'text-slate-500 hover:text-slate-300')}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-sm text-slate-500">
            <span className="text-white font-semibold">{filtered.length}</span> companies
          </div>
        </div>

        {/* Tier filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'hot', 'warm', 'cold'].map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                tier === t
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading companies…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-600 text-sm">
          {companies.length === 0
            ? 'No companies yet. Run a discovery job from the Prospecting page.'
            : 'No results match your filters.'}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5 hover:border-[#252548] hover:bg-[#13132a] transition-all duration-150 h-full">
              <div className="flex items-start justify-between mb-4">
                <Avatar name={c.name} size="lg" />
                {c.opportunity_tier && (
                  <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border', TIER_COLORS[c.opportunity_tier])}>
                    {c.opportunity_tier}
                  </span>
                )}
              </div>

              <div className="mb-3">
                <div className="text-sm font-bold text-white">{c.name}</div>
                {c.website && (
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{c.website.replace(/^https?:\/\//, '')}</div>
                )}
              </div>

              <div className="space-y-1.5 mb-4">
                {(c.city || c.state) && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />{[c.city, c.state].filter(Boolean).join(', ')}
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="w-3 h-3" />{c.phone}
                  </div>
                )}
                {c.rating !== null && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-amber-400 font-semibold">{c.rating.toFixed(1)}</span>
                    {c.review_count !== null && <span className="text-slate-600">· {c.review_count.toLocaleString()} reviews</span>}
                  </div>
                )}
              </div>

              {c.opportunity_score !== null && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Opp Score</span>
                    <span className={cn('font-semibold', SCORE_COLOR(c.opportunity_score))}>{c.opportunity_score}</span>
                  </div>
                  <Progress
                    value={c.opportunity_score}
                    barClassName={c.opportunity_score >= 75 ? 'bg-emerald-500' : c.opportunity_score >= 45 ? 'bg-amber-500' : 'bg-slate-500'}
                  />
                </div>
              )}

              {c.recommended_offer && (
                <p className="text-[10px] text-slate-600 mt-3 line-clamp-2">{c.recommended_offer}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-[#1e1e38]">
              <tr>
                {['Company', 'Location', 'Rating', 'Reviews', 'Phone', 'Opp Score', 'Tier', 'Next Step'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14142a]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size="sm" />
                      <div>
                        <div className="text-sm font-medium text-slate-100">{c.name}</div>
                        {c.website && <div className="text-xs text-slate-600 truncate max-w-[140px]">{c.website.replace(/^https?:\/\//, '')}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">
                    {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {c.rating !== null ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400 font-semibold">{c.rating.toFixed(1)}</span>
                      </div>
                    ) : <span className="text-xs text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 tabular-nums">
                    {c.review_count !== null ? c.review_count.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.opportunity_score !== null
                      ? <span className={cn('text-sm font-bold', SCORE_COLOR(c.opportunity_score))}>{c.opportunity_score}</span>
                      : <span className="text-xs text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.opportunity_tier ? (
                      <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border', TIER_COLORS[c.opportunity_tier])}>
                        {c.opportunity_tier}
                      </span>
                    ) : <span className="text-xs text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px]">
                    {c.recommended_next_step ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
