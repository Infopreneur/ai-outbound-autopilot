'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter }                  from 'next/navigation'
import Link                                            from 'next/link'
import {
  ArrowLeft, Sparkles, Zap, Database, FileBarChart2,
  Mail, MessageSquare, Linkedin, CheckCircle2,
  Loader2, Send, RotateCcw, Copy, ChevronDown, Star,
  Globe, Phone, MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { cn }     from '@/lib/utils'
import type { OfferId } from '@/lib/scoring/opportunity-score'

// ── Types ─────────────────────────────────────────────────────────────────────
type Company = {
  id: string
  name: string
  niche: string | null
  city: string | null
  state: string | null
  website: string | null
  phone: string | null
  rating: number | null
  review_count: number | null
  opportunity_tier: string | null
  opportunity_score: number | null
  top_offer: OfferId | null
  offer_fit_breakdown: Array<{ offerId: OfferId; offerName: string; fitScore: number; headline: string; primarySignal: string }> | null
}

type GeneratedMessage = {
  subjectLine: string
  messageBody: string
  cta: string
  channel: string
  angle: string
  offerId: string
}

type MessageAngle = 'pain' | 'opportunity' | 'social-proof'
type Channel      = 'email' | 'sms' | 'linkedin'

// ── Offer config ──────────────────────────────────────────────────────────────
const OFFERS: { id: OfferId; name: string; icon: React.ReactNode; color: string; bg: string; border: string; desc: string }[] = [
  {
    id: 'followup-automation', name: '24/7 Follow-Up Automation',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30',
    desc: 'Never miss a call or lead. Close 20–30% more deals automatically.',
  },
  {
    id: 'database-reactivation', name: 'Database Reactivation',
    icon: <Database className="w-4 h-4" />,
    color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30',
    desc: 'Extract hidden revenue from their existing customer database.',
  },
  {
    id: 'positioning-report', name: 'Online Positioning Report',
    icon: <FileBarChart2 className="w-4 h-4" />,
    color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30',
    desc: 'Custom audit showing how they rank vs competitors online.',
  },
]

const ANGLES: { id: MessageAngle; label: string; desc: string }[] = [
  { id: 'pain',         label: 'Pain',         desc: 'Lead with a specific gap or problem they have' },
  { id: 'opportunity',  label: 'Opportunity',   desc: 'Lead with quantified revenue they are missing' },
  { id: 'social-proof', label: 'Social Proof',  desc: 'Lead with a result from a similar business' },
]

const CHANNELS: { id: Channel; label: string; icon: React.ReactNode }[] = [
  { id: 'email',    label: 'Email',    icon: <Mail className="w-3.5 h-3.5" /> },
  { id: 'sms',      label: 'SMS',      icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-3.5 h-3.5" /> },
]

const TIER_COLORS: Record<string, string> = {
  hot:  'bg-red-500/20 text-red-400 border-red-500/30',
  warm: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cold: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────
function ComposeInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const preloadId    = searchParams.get('company')

  // Company selection
  const [search, setSearch]         = useState('')
  const [companies, setCompanies]   = useState<Company[]>([])
  const [showDropdown, setDropdown] = useState(false)
  const [selected, setSelected]     = useState<Company | null>(null)
  const [loadingComp, setLoadingComp] = useState(false)

  // Message config
  const [offerId,  setOfferId]  = useState<OfferId>('followup-automation')
  const [angle,    setAngle]    = useState<MessageAngle>('pain')
  const [channel,  setChannel]  = useState<Channel>('email')

  // Generation
  const [generating, setGenerating] = useState(false)
  const [message,    setMessage]    = useState<GeneratedMessage | null>(null)
  const [genError,   setGenError]   = useState<string | null>(null)

  // Saving
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Preload company from query param
  useEffect(() => {
    if (!preloadId) return
    fetch(`/api/companies/${preloadId}`)
      .then((r) => r.json())
      .then((c) => {
        setSelected(c)
        if (c.top_offer) setOfferId(c.top_offer)
      })
  }, [preloadId])

  // Search companies
  const searchCompanies = useCallback(async (q: string) => {
    if (!q.trim()) { setCompanies([]); return }
    setLoadingComp(true)
    const res  = await fetch(`/api/companies/list?search=${encodeURIComponent(q)}&pageSize=8`)
    const data = await res.json()
    setCompanies(data.companies ?? [])
    setLoadingComp(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchCompanies(search), 300)
    return () => clearTimeout(t)
  }, [search, searchCompanies])

  // When company selected, auto-pick their best offer
  function selectCompany(c: Company) {
    setSelected(c)
    setDropdown(false)
    setSearch('')
    setMessage(null)
    setSaved(false)
    if (c.top_offer) setOfferId(c.top_offer)
  }

  // Generate message
  async function generate() {
    if (!selected) return
    setGenerating(true)
    setGenError(null)
    setMessage(null)
    setSaved(false)

    const res = await fetch('/api/outreach/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: selected.id, offerId, angle, channel }),
    })
    const data = await res.json()
    if (!res.ok) { setGenError(data.error ?? 'Generation failed.'); setGenerating(false); return }
    setMessage(data)
    setGenerating(false)
  }

  // Save as draft / approve
  async function save(status: 'draft' | 'approved') {
    if (!selected || !message) return
    setSaving(true)

    await fetch('/api/outreach/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId:   selected.id,
        offer:       offerId,
        channel,
        subject:     message.subjectLine,
        messageBody: message.messageBody,
        angle,
        status,
      }),
    })

    setSaved(true)
    setSaving(false)
    if (status === 'approved') router.push('/outreach')
  }

  // Copy to clipboard
  function copy() {
    if (!message) return
    const text = channel === 'email'
      ? `Subject: ${message.subjectLine}\n\n${message.messageBody}`
      : message.messageBody
    navigator.clipboard.writeText(text)
  }

  // Current offer record
  const offerFitRec = selected?.offer_fit_breakdown?.find((o) => o.offerId === offerId)

  return (
    <div className="max-w-[1000px] space-y-5">
      {/* Back */}
      <Link href="/outreach" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Outreach
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Compose Outreach</h1>
          <p className="text-xs text-[var(--text-muted)]">Select a company → choose offer + angle → generate → approve</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Left panel: config ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Company selector */}
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">1. Select Company</div>

            {selected ? (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg-muted)] p-3">
                <Avatar name={selected.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{selected.name}</div>
                  <div className="truncate text-xs text-[var(--text-muted)]">
                    {[selected.niche, selected.city].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {selected.opportunity_tier && (
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase border', TIER_COLORS[selected.opportunity_tier])}>
                    {selected.opportunity_tier}
                  </span>
                )}
                <button onClick={() => { setSelected(null); setMessage(null) }} className="text-[var(--text-subtle)] hover:text-[var(--text-primary)]">
                  ×
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search companies…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setDropdown(true) }}
                  onFocus={() => setDropdown(true)}
                  className="h-9 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-secondary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-indigo-500/50"
                />
                {showDropdown && (search || companies.length > 0) && (
                  <div className="absolute left-0 right-0 top-10 z-20 max-h-60 overflow-y-auto rounded-xl border border-[var(--input-border)] bg-[var(--panel-bg)] shadow-xl">
                    {loadingComp && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-muted)]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
                      </div>
                    )}
                    {companies.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCompany(c)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--hover-bg)]"
                      >
                        <Avatar name={c.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm text-[var(--text-primary)]">{c.name}</div>
                          <div className="truncate text-xs text-[var(--text-subtle)]">{[c.niche, c.city].filter(Boolean).join(' · ')}</div>
                        </div>
                        {c.opportunity_tier && (
                          <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border', TIER_COLORS[c.opportunity_tier])}>
                            {c.opportunity_tier}
                          </span>
                        )}
                      </button>
                    ))}
                    {!loadingComp && companies.length === 0 && search && (
                      <div className="px-3 py-3 text-xs text-[var(--text-subtle)]">No companies found.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Company signals */}
            {selected && (
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {selected.rating !== null && (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-amber-400">{selected.rating.toFixed(1)}</span>
                    {selected.review_count !== null && <span className="text-[var(--text-subtle)]">({selected.review_count})</span>}
                  </div>
                )}
                {selected.website
                  ? <div className="flex items-center gap-1 text-xs text-emerald-500"><Globe className="w-3 h-3" /> Has website</div>
                  : <div className="flex items-center gap-1 text-xs text-red-500"><Globe className="w-3 h-3" /> No website</div>
                }
                {selected.phone && <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><Phone className="w-3 h-3" /> {selected.phone}</div>}
                {selected.city && <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><MapPin className="w-3 h-3" /> {selected.city}</div>}
              </div>
            )}
          </div>

          {/* Offer selector */}
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">2. Choose Offer</div>
            <div className="space-y-2">
              {OFFERS.map((o) => {
                const rec = selected?.offer_fit_breakdown?.find((r) => r.offerId === o.id)
                return (
                  <button
                    key={o.id}
                    onClick={() => setOfferId(o.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      offerId === o.id ? `${o.bg} ${o.border}` : 'bg-[var(--input-bg-muted)] border-[var(--input-border)] hover:border-indigo-400/30',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={offerId === o.id ? o.color : 'text-[var(--text-muted)]'}>{o.icon}</span>
                        <span className={cn('text-xs font-semibold', offerId === o.id ? o.color : 'text-[var(--text-secondary)]')}>{o.name}</span>
                      </div>
                      {rec && (
                        <span className={cn('text-[10px] font-bold', offerId === o.id ? o.color : 'text-[var(--text-subtle)]')}>
                          {rec.fitScore} fit
                        </span>
                      )}
                    </div>
                    {offerId === o.id && rec && (
                      <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">{rec.primarySignal}</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Angle + Channel */}
          <div className="space-y-4 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">3. Message Angle</div>
              <div className="space-y-1.5">
                {ANGLES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAngle(a.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg border text-xs transition-all',
                      angle === a.id
                        ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300'
                        : 'bg-[var(--input-bg-muted)] border-[var(--input-border)] text-[var(--text-secondary)] hover:border-indigo-400/30',
                    )}
                  >
                    <span className="font-semibold">{a.label}</span>
                    <span className="ml-2 text-[var(--text-subtle)]">{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">4. Channel</div>
              <div className="flex gap-2">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setChannel(ch.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-medium transition-all',
                      channel === ch.id
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-[var(--input-bg-muted)] border-[var(--input-border)] text-[var(--text-secondary)] hover:border-indigo-400/30',
                    )}
                  >
                    {ch.icon} {ch.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center"
            onClick={generate}
            disabled={!selected || generating}
          >
            {generating
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
              : <><Sparkles className="w-3.5 h-3.5" /> Generate Message</>
            }
          </Button>
        </div>

        {/* ── Right panel: generated message ────────────────────────────── */}
        <div className="lg:col-span-3">
          {!selected && !message && (
            <div className="flex min-h-[300px] h-full flex-col items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-10 text-[var(--text-subtle)] shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
              <Sparkles className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">Select a company to get started</p>
            </div>
          )}

          {selected && !message && !generating && !genError && (
            <div className="flex min-h-[300px] h-full flex-col items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-10 text-[var(--text-subtle)] shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
              <Sparkles className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm mb-1">Ready to generate</p>
              <p className="text-xs text-[var(--text-subtle)]">Configure your offer + angle, then click Generate</p>
              {offerFitRec && (
                <div className="mt-4 max-w-[280px] text-center">
                  <p className="text-xs text-indigo-400 italic">"{offerFitRec.headline}"</p>
                </div>
              )}
            </div>
          )}

          {generating && (
            <div className="flex min-h-[300px] h-full flex-col items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-10 text-[var(--text-muted)] shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-400" />
              <p className="text-sm">Claude is writing your message…</p>
            </div>
          )}

          {genError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-400">
              {genError}
            </div>
          )}

          {message && !generating && (
            <div className="overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--panel-border)] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Generated Message</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                    {message.angle} angle · {message.channel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={copy} title="Copy" className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={generate} title="Regenerate" className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Message body */}
              <div className="p-5 space-y-4">
                {channel === 'email' && message.subjectLine && (
                  <div>
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Subject Line</div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{message.subjectLine}</div>
                  </div>
                )}

                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Message</div>
                  <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">{message.messageBody}</div>
                </div>

                {message.cta && (
                  <div className="border-t border-[var(--panel-border)] pt-3">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">CTA</div>
                    <div className="text-sm text-indigo-300 italic">{message.cta}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {saved ? (
                <div className="flex items-center gap-2 border-t border-[var(--panel-border)] px-5 py-4 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Saved successfully
                </div>
              ) : (
                <div className="flex items-center gap-3 border-t border-[var(--panel-border)] px-5 py-4">
                  <Button variant="secondary" size="sm" onClick={() => save('draft')} disabled={saving}>
                    Save as Draft
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => save('approved')} disabled={saving}>
                    {saving
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                      : <><Send className="w-3.5 h-3.5" /> Approve for Sending</>
                    }
                  </Button>
                  <span className="ml-auto text-xs text-[var(--text-subtle)]">
                    Approved messages are queued for n8n delivery
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page wrapper (Suspense boundary for useSearchParams) ──────────────────────
export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-40 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      </div>
    }>
      <ComposeInner />
    </Suspense>
  )
}
