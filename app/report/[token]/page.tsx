'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileBarChart2, MapPin, Star, Globe, Phone, Loader2, ArrowLeft, Copy, Printer, CheckCircle2, Zap } from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

type Report = {
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
  generated_at: string
}

function scoreLabel(s: number): { label: string; color: string } {
  if (s >= 80) return { label: 'Excellent', color: 'text-emerald-400' }
  if (s >= 60) return { label: 'Good', color: 'text-blue-400' }
  if (s >= 40) return { label: 'Fair', color: 'text-amber-400' }
  return { label: 'Needs Work', color: 'text-red-400' }
}

function scoreBarColor(s: number): string {
  if (s >= 80) return 'bg-emerald-500'
  if (s >= 60) return 'bg-blue-500'
  if (s >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function SharedReportPage() {
  const { token } = useParams() as { token: string }
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [copied, setCopied] = useState(false)

  const gatingEnabled = process.env.NEXT_PUBLIC_REPORT_GATING === 'true'

  const shareUrl = useMemo(() => {
    if (!token) return ''
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/report/${token}`
  }, [token])

  useEffect(() => {
    if (!token) return

    const stored = localStorage.getItem(`report_access_${token}`)
    if (stored === 'unlocked') {
      setUnlocked(true)
    }

    if (!gatingEnabled || stored === 'unlocked') {
      fetchReport()
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, gatingEnabled])

  async function fetchReport() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/report/share/${token}`)
      if (!res.ok) throw new Error('Report not found')
      const data = await res.json()
      setReport(data)
      setUnlocked(true)
      localStorage.setItem(`report_access_${token}`, 'unlocked')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function unlockReport() {
    if (!token) return
    if (!email.trim()) {
      setError('Please enter an email to continue.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/report/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      })
      if (!res.ok) throw new Error('Unable to unlock report')
      const data = await res.json()
      setReport(data)
      setUnlocked(true)
      localStorage.setItem(`report_access_${token}`, 'unlocked')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function onCopyLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function onPrint() {
    window.print()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-40 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading report…
    </div>
  )

  if (error) return (
    <div className="max-w-[900px] mx-auto space-y-6 py-20 text-center">
      <div className="text-lg font-semibold text-white">Report not found</div>
      <p className="text-sm text-slate-500">This report link may be invalid or expired.</p>
      <Link href="/" className="text-sm text-sky-400 hover:underline">Go back to dashboard</Link>
    </div>
  )

  if (gatingEnabled && !unlocked) {
    return (
      <div className="max-w-[520px] mx-auto space-y-4 py-28">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">Unlock the report</div>
          <p className="text-sm text-slate-500 mt-2">Enter your email to view this positioning audit.</p>
        </div>
        <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-6">
          <label className="block text-xs font-semibold text-slate-500 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full h-10 px-3 bg-[#0f122a] border border-[#252540] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          />
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button variant="primary" className="flex-1" onClick={unlockReport}>
              Unlock report
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => router.push('/')}>Go back</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!report) return null

  const { label: scoreText, color: scoreColor } = scoreLabel(report.overall_score)

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }

          a::after {
            content: " (" attr(href) ")";
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="max-w-[960px] mx-auto space-y-5 py-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center">
          <FileBarChart2 className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Online Positioning Report</h1>
          <p className="text-xs text-slate-500">AI-generated audit for {report.company_name}</p>
        </div>
      </div>

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

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onCopyLink}>
            <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button variant="secondary" size="sm" onClick={onPrint}>
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>
        </div>
      </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="bg-[#0a0b18] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Score</div>
                <div className="text-2xl font-semibold text-white">{report.overall_score}</div>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${scoreColor} bg-white/5`}>{scoreText}</div>
            </div>
            <Progress className="mt-3" value={report.overall_score} max={100} barClassName={scoreBarColor(report.overall_score)} />
          </div>

          <div className="bg-[#0a0b18] rounded-xl p-4">
            <div className="text-xs text-slate-400">Visibility</div>
            <div className="mt-2 space-y-2 text-sm text-white">
              <div className="flex justify-between"><span>Visibility score</span><span className="font-semibold">{report.visibility_score}</span></div>
              <div className="flex justify-between"><span>Review velocity</span><span className="font-semibold">{report.review_velocity} / mo</span></div>
              <div className="flex justify-between"><span>Estimated revenue gap</span><span className="font-semibold">${report.lost_revenue_estimate.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-[#0a0b18] rounded-xl p-4">
            <div className="text-xs text-slate-400">Contact</div>
            <div className="mt-2 space-y-2 text-sm text-white">
              {report.company_website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <a href={report.company_website} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                    {report.company_website}
                  </a>
                </div>
              )}
              {report.company_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{report.company_phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Action Plan</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-400">
            {report.ai_action_plan.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Score Breakdown</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-400">
            {Object.entries(report.score_breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key.replace('_', ' ')}</span>
                <span className="font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-600">Generated: {new Date(report.generated_at).toLocaleString()}</div>
    </div>
    </>
  )
}

