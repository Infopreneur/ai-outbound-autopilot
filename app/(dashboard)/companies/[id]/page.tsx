'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Globe, MapPin, Phone, Star,
  Sparkles, Mail, Zap, Database, FileBarChart2,
  Loader2, ExternalLink, CheckCircle2, AlertCircle,
  TrendingUp, MessageSquare,
} from 'lucide-react'
import { Avatar }   from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button }   from '@/components/ui/button'
import { cn }       from '@/lib/utils'
import type { OfferId } from '@/lib/scoring/opportunity-score'

// ── Types ─────────────────────────────────────────────────────────────────────
type OfferRec = {
  offerId: OfferId
  offerName: string
  fitScore: number
  reason: string
  headline: string
  primarySignal: string
}

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
  lead_volume_score: number | null
  followup_gap_score: number | null
  local_visibility_score: number | null
  offer_fit_score: number | null
  top_offer: OfferId | null
  offer_fit_breakdown: OfferRec[] | null
  last_scored_at: string | null
  last_discovered_at: string | null
  created_at: string
}

// ── Offer config ──────────────────────────────────────────────────────────────
const OFFER_META: Record<OfferId, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  'followup-automation': {
    icon:   <Zap className="w-4 h-4" />,
    color:  'text-amber-400',
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  'database-reactivation': {
    icon:   <Database className="w-4 h-4" />,
    color:  'text-violet-400',
    bg:     'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
  'positioning-report': {
    icon:   <FileBarChart2 className="w-4 h-4" />,
    color:  'text-sky-400',
    bg:     'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
}

const TIER_COLORS: Record<string, string> = {
  hot:  'bg-red-500/20 text-red-400 border-red-500/30',
  warm: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cold: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const SCORE_COLOR = (s: number | null) =>
  !s ? 'text-slate-500' : s >= 75 ? 'text-emerald-400' : s >= 45 ? 'text-amber-400' : 'text-slate-400'

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const [company, setCompany]   = useState<Company | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/companies/${params.id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((data) => { if (data) setCompany(data) })
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return (
    <div className="flex items-center justify-center py-40 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading company…
    </div>
  )

  if (notFound || !company) return (
    <div className="max-w-[900px] space-y-4">
      <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Companies
      </Link>
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-10 text-center text-slate-500">
        Company not found.
      </div>
    </div>
  )

  const topOffer    = company.top_offer
  const offerRecs   = company.offer_fit_breakdown ?? []
  const topOfferRec = offerRecs.find((o) => o.offerId === topOffer) ?? offerRecs[0]
  const otherOffers = offerRecs.filter((o) => o.offerId !== topOffer)

  return (
    <div className="max-w-[1100px] space-y-5">
      {/* Back */}
      <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Companies
      </Link>

      {/* Header */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-5">
            <Avatar name={company.name} size="xl" />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                {company.opportunity_tier && (
                  <span className={cn('px-2.5 py-0.5 rounded-md text-xs font-bold uppercase border', TIER_COLORS[company.opportunity_tier])}>
                    {company.opportunity_tier}
                  </span>
                )}
                {company.niche && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {company.niche}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3">
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                    {company.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {!company.website && (
                  <span className="flex items-center gap-1.5 text-xs text-red-500/70">
                    <Globe className="w-3.5 h-3.5" /> No website
                  </span>
                )}
                {(company.city || company.state) && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {[company.city, company.state].filter(Boolean).join(', ')}
                  </span>
                )}
                {company.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Phone className="w-3.5 h-3.5" /> {company.phone}
                  </span>
                )}
                {company.rating !== null && (
                  <span className="flex items-center gap-1.5 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-amber-400 font-semibold">{company.rating.toFixed(1)}</span>
                    {company.review_count !== null && (
                      <span className="text-slate-600">· {company.review_count.toLocaleString()} reviews</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <Mail className="w-3.5 h-3.5" />
              Compose
            </Button>
            <Link href={`/outreach/compose?company=${company.id}`}>
              <Button variant="primary" size="sm">
                <Sparkles className="w-3.5 h-3.5" />
                Generate Outreach
              </Button>
            </Link>
          </div>
        </div>

        {/* Score bar */}
        {company.opportunity_score !== null && (
          <div className="mt-5 pt-5 border-t border-[#1e1e38]">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider">Opportunity Score</span>
              <span className={cn('text-sm font-bold', SCORE_COLOR(company.opportunity_score))}>
                {company.opportunity_score} / 100
              </span>
            </div>
            <Progress
              value={company.opportunity_score}
              barClassName={company.opportunity_score >= 75 ? 'bg-emerald-500' : company.opportunity_score >= 45 ? 'bg-amber-500' : 'bg-slate-500'}
              className="h-2"
            />
            {company.opportunity_reason && (
              <p className="text-xs text-slate-600 mt-2">{company.opportunity_reason}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Offer Intelligence */}
        <div className="lg:col-span-2 space-y-4">

          {/* Top recommended offer */}
          {topOfferRec && (() => {
            const meta = OFFER_META[topOfferRec.offerId]
            return (
              <div className={cn('rounded-xl border p-5', meta.bg, meta.border)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', meta.bg)}>
                      <span className={meta.color}>{meta.icon}</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Best Offer Match</div>
                      <div className={cn('text-sm font-bold', meta.color)}>{topOfferRec.offerName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-2xl font-bold', meta.color)}>{topOfferRec.fitScore}</div>
                    <div className="text-[10px] text-slate-600">fit score</div>
                  </div>
                </div>

                <p className="text-sm text-slate-200 font-medium mb-2">{topOfferRec.headline}</p>
                <div className="flex items-start gap-1.5 text-xs text-slate-400">
                  <CheckCircle2 className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', meta.color)} />
                  {topOfferRec.primarySignal}
                </div>

                <div className="mt-4">
                  <Progress
                    value={topOfferRec.fitScore}
                    barClassName={
                      topOfferRec.offerId === 'followup-automation'  ? 'bg-amber-500'  :
                      topOfferRec.offerId === 'database-reactivation' ? 'bg-violet-500' :
                      'bg-sky-500'
                    }
                  />
                </div>
              </div>
            )
          })()}

          {/* Other offers */}
          {otherOffers.length > 0 && (
            <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1e1e38]">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Other Offer Fits</div>
              </div>
              <div className="divide-y divide-[#14142a]">
                {otherOffers.map((o) => {
                  const meta = OFFER_META[o.offerId]
                  return (
                    <div key={o.offerId} className="flex items-center gap-4 px-5 py-4">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', meta.bg)}>
                        <span className={meta.color}>{meta.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-sm font-semibold', meta.color)}>{o.offerName}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{o.reason}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-white">{o.fitScore}</div>
                        <Progress
                          value={o.fitScore}
                          className="w-20 mt-1"
                          barClassName={
                            o.offerId === 'followup-automation'   ? 'bg-amber-500'  :
                            o.offerId === 'database-reactivation' ? 'bg-violet-500' :
                            'bg-sky-500'
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Score breakdown */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Score Breakdown</div>
            <div className="space-y-3">
              {[
                { label: 'Lead Volume',      value: company.lead_volume_score,      color: 'bg-blue-500',    max: 40 },
                { label: 'Follow-up Gap',    value: company.followup_gap_score,     color: 'bg-amber-500',   max: 65 },
                { label: 'Local Visibility', value: company.local_visibility_score, color: 'bg-emerald-500', max: 45 },
                { label: 'Offer Fit',        value: company.offer_fit_score,        color: 'bg-indigo-500',  max: 25 },
              ].map((sub) => (
                <div key={sub.label}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{sub.label}</span>
                    <span className="text-white font-semibold">{sub.value ?? '—'} / {sub.max}</span>
                  </div>
                  <Progress
                    value={((sub.value ?? 0) / sub.max) * 100}
                    barClassName={sub.color}
                  />
                </div>
              ))}
            </div>
            {company.recommended_next_step && (
              <div className="mt-4 pt-4 border-t border-[#1e1e38] flex items-start gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-400">{company.recommended_next_step}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Signals + Meta */}
        <div className="space-y-4">
          {/* Online presence signals */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Online Presence Signals</div>
            <div className="space-y-3">
              {[
                { label: 'Website',  value: company.website  ? '✓ Present'                    : '✗ Missing', ok: !!company.website  },
                { label: 'Phone',    value: company.phone    ? '✓ Listed'                     : '✗ Missing', ok: !!company.phone    },
                { label: 'Rating',   value: company.rating   ? `${company.rating.toFixed(1)}★` : '✗ No rating', ok: (company.rating ?? 0) >= 4.0 },
                { label: 'Reviews',  value: company.review_count !== null ? company.review_count.toLocaleString() : '—', ok: (company.review_count ?? 0) >= 50 },
                { label: 'Location', value: [company.city, company.state].filter(Boolean).join(', ') || '—', ok: !!(company.city && company.state) },
              ].map((sig) => (
                <div key={sig.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{sig.label}</span>
                  <span className={sig.ok ? 'text-emerald-400' : 'text-red-400'}>{sig.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">AI Insights</h3>
            </div>
            <div className="space-y-3">
              {[
                company.opportunity_reason ? { text: company.opportunity_reason, ok: true }  : null,
                !company.website            ? { text: 'No website detected — strong signal for digital gap offers', ok: false } : null,
                company.review_count && company.review_count >= 100
                  ? { text: `${company.review_count.toLocaleString()} reviews suggests active lead flow`, ok: true } : null,
                company.rating && company.rating < 4.0
                  ? { text: `${company.rating}★ rating — below average, reputation offer fits well`, ok: false } : null,
                company.phone ? { text: 'Phone listed — inbound calls are happening', ok: true } : null,
              ].filter(Boolean).slice(0, 5).map((item, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item!.ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <p className="text-xs text-slate-400 leading-relaxed">{item!.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <h3 className="text-sm font-semibold text-white">Record Info</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Source',      value: company.source      ?? '—' },
                { label: 'Niche',       value: company.niche       ?? '—' },
                { label: 'Discovered',  value: company.last_discovered_at ? new Date(company.last_discovered_at).toLocaleDateString() : '—' },
                { label: 'Last Scored', value: company.last_scored_at     ? new Date(company.last_scored_at).toLocaleDateString()     : '—' },
              ].map((m) => (
                <div key={m.label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{m.label}</span>
                  <span className="text-slate-300">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="mt-4 pt-4 border-t border-[#1e1e38] space-y-2">
              <Link href={`/reputation-report?company=${company.id}`} className="block">
                <Button variant="secondary" size="sm" className="w-full justify-center">
                  <FileBarChart2 className="w-3.5 h-3.5 text-sky-400" />
                  Generate Positioning Report
                </Button>
              </Link>
              <Link href={`/outreach/compose?company=${company.id}`} className="block">
                <Button variant="secondary" size="sm" className="w-full justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Generate Outreach
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
