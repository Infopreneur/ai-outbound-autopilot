'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, MapPin, Phone, Star,
  Loader2, LayoutGrid, List, ArrowUpDown,
  Sparkles, FileBarChart2, ChevronRight,
} from 'lucide-react'
import { Avatar }   from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { cn }       from '@/lib/utils'

type Company = {
  id: string
  name: string
  niche: string | null
  source: string | null
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
  strategy?: string | null
  deep_dive_note?: string | null
  source_url?: string | null
  converted_to_deal?: boolean | null
  created_at: string
}

type ApiResponse = {
  companies: Company[]
  total: number
  page: number
  pageSize: number
  pages: number
}

const TIER_COLORS: Record<string, string> = {
  hot:  'bg-red-500/20 text-red-400 border-red-500/30',
  warm: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cold: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const SCORE_COLOR = (s: number | null) =>
  !s ? 'text-slate-500' : s >= 75 ? 'text-emerald-400' : s >= 45 ? 'text-amber-400' : 'text-slate-400'

const SORT_OPTIONS = [
  { label: 'Highest Score', value: 'opportunity_score' },
  { label: 'Most Reviews',  value: 'review_count' },
  { label: 'Best Rating',   value: 'rating' },
  { label: 'Newest',        value: 'created_at' },
  { label: 'Name',          value: 'name' },
]

export default function CompaniesPage() {
  const [data, setData]         = useState<ApiResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [tier, setTier]         = useState('')
  const [niche, setNiche]       = useState('')
  const [source, setSource]     = useState('')
  const [sortBy, setSortBy]     = useState('opportunity_score')
  const [view, setView]         = useState<'grid' | 'list'>('grid')
  const [page, setPage]         = useState(1)
  const pageSize = 100

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)  params.set('search', search)
    if (tier)    params.set('tier', tier)
    if (niche)   params.set('niche', niche)
    if (source)  params.set('source', source)
    params.set('sortBy', sortBy)
    params.set('sortOrder', sortBy === 'name' ? 'asc' : 'desc')
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))

    try {
      const res = await fetch(`/api/companies/list?${params}`)
      const json = await res.json()
      setData(json)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [search, tier, niche, source, sortBy, page])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchCompanies() }, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setPage(1); fetchCompanies() }, [tier, niche, source, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCompanies() }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const companies = data?.companies ?? []
  const total     = data?.total ?? 0
  const pages     = data?.pages ?? 1

  const hotCount = useMemo(() => companies.filter((c) => c.opportunity_tier === 'hot').length, [companies])
  const avgScore = useMemo(() => companies.length
    ? Math.round(companies.reduce((s, c) => s + (c.opportunity_score ?? 0), 0) / companies.length)
    : 0, [companies])
  const scored = useMemo(() => companies.filter((c) => c.opportunity_score !== null).length, [companies])

  // Unique niches from current page (use for filter pill suggestions)
  const niches = useMemo(() =>
    [...new Set(companies.map((c) => c.niche).filter(Boolean) as string[])].sort()
  , [companies])

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Companies', value: loading ? '—' : total.toLocaleString(),     color: 'text-white' },
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
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search companies, cities…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 bg-[#1a1a30] border border-[#252540] rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-[#1a1a30] border border-[#252540] rounded-lg p-1">
            <button onClick={() => setView('grid')} className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', view === 'grid' ? 'bg-indigo-600/30 text-indigo-400' : 'text-slate-500 hover:text-slate-300')}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setView('list')} className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', view === 'list' ? 'bg-indigo-600/30 text-indigo-400' : 'text-slate-500 hover:text-slate-300')}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-sm text-slate-500">
            <span className="text-white font-semibold">{total.toLocaleString()}</span> companies
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tier */}
          {['', 'hot', 'warm', 'cold'].map((t) => (
            <button
              key={t || 'all-tier'}
              onClick={() => setTier(t)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                tier === t
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]',
              )}
            >
              {t || 'All tiers'}
            </button>
          ))}

          <div className="w-px h-4 bg-[#252540]" />

          {/* Source */}
          {['', 'google-native', 'apify'].map((s) => (
            <button
              key={s || 'all-source'}
              onClick={() => setSource(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                source === s
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]',
              )}
            >
              {s === '' ? 'All sources' : s === 'google-native' ? 'Google' : 'Apify'}
            </button>
          ))}

          {niches.length > 0 && (
            <>
              <div className="w-px h-4 bg-[#252540]" />
              {[...niches].slice(0, 8).map((n) => (
                <button
                  key={n}
                  onClick={() => setNiche(niche === n ? '' : n)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    niche === n
                      ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                      : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]',
                  )}
                >
                  {n}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading companies…
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-slate-600 text-sm">
          {total === 0
            ? 'No companies yet. Run a discovery job from the Prospecting page.'
            : 'No results match your filters.'}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {companies.map((c) => (
            <div key={c.id} className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5 hover:border-[#252548] hover:bg-[#13132a] transition-all duration-150 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <Link href={`/companies/${c.id}`}>
                  <Avatar name={c.name} size="lg" />
                </Link>
                {c.opportunity_tier && (
                  <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border', TIER_COLORS[c.opportunity_tier])}>
                    {c.opportunity_tier}
                  </span>
                )}
              </div>

              <div className="mb-3">
                <Link href={`/companies/${c.id}`} className="text-sm font-bold text-white hover:text-indigo-300 transition-colors">
                  {c.name}
                </Link>
                {c.website
                  ? <div className="text-xs text-slate-500 mt-0.5 truncate">{c.website.replace(/^https?:\/\//, '')}</div>
                  : <div className="text-xs text-red-500/70 mt-0.5">No website</div>
                }
              </div>

              <div className="space-y-1.5 mb-4 flex-1">
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
                {c.niche && (
                  <div className="text-[10px] text-slate-600 truncate">{c.niche}</div>
                )}
              </div>

              {c.opportunity_score !== null && (
                <div title={c.opportunity_reason ?? undefined} className="mb-3">
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

              {/* Action buttons */}
              <div className="pt-3 border-t border-[#1e1e38] flex items-center gap-2 mt-auto">
                <Link
                  href={`/outreach/compose?company=${c.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-600/30 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Generate Outreach
                </Link>
                <Link
                  href={`/companies/${c.id}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a30] border border-[#252540] text-slate-500 hover:text-slate-200 hover:border-[#353560] transition-colors"
                  title="View company details"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-[#1e1e38]">
              <tr>
                {['Company', 'Niche', 'Location', 'Rating', 'Reviews', 'Phone', 'Opp Score', 'Tier', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14142a]">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size="sm" />
                      <div>
                        <Link href={`/companies/${c.id}`} className="text-sm font-medium text-slate-100 hover:text-indigo-300 transition-colors">
                          {c.name}
                        </Link>
                        {c.website
                          ? <div className="text-xs text-slate-600 truncate max-w-[140px]">{c.website.replace(/^https?:\/\//, '')}</div>
                          : <div className="text-xs text-red-500/60">No website</div>
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{c.niche ?? '—'}</td>
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
                  <td className="px-4 py-3" title={c.opportunity_reason ?? undefined}>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/outreach/compose?company=${c.id}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold hover:bg-indigo-600/30 transition-colors whitespace-nowrap"
                      >
                        <Sparkles className="w-3 h-3" />
                        Compose
                      </Link>
                      <Link
                        href={`/reputation-report?company=${c.id}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-semibold hover:bg-sky-500/20 transition-colors whitespace-nowrap"
                        title="Generate positioning report"
                      >
                        <FileBarChart2 className="w-3 h-3" />
                        Report
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            Page {page} of {pages} · {total.toLocaleString()} total
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-1.5 rounded-lg text-xs bg-[#1a1a30] border border-[#252540] text-slate-400 disabled:opacity-30 hover:text-white disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-1.5 rounded-lg text-xs bg-[#1a1a30] border border-[#252540] text-slate-400 disabled:opacity-30 hover:text-white disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
