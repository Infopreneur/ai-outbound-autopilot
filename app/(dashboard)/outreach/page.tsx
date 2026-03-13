'use client'

import { useState, useEffect } from 'react'
import {
  Play,
  Pause,
  Mail,
  Linkedin,
  Layers,
  Plus,
  MoreHorizontal,
  Send,
  Eye,
  MessageSquare,
  Calendar,
  TrendingUp,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// types
export type CampaignStatus = 'active' | 'paused' | 'draft' | 'completed'
export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  channel: 'email' | 'linkedin' | 'multi-channel'
  leads: number
  sent: number
  opened: number
  replied: number
  meetings: number
  open_rate: number
  reply_rate: number
  start_date: string
}

const channelIcon: Record<string, React.ReactNode> = {
  email:          <Mail className="w-3.5 h-3.5" />,
  linkedin:       <Linkedin className="w-3.5 h-3.5" />,
  'multi-channel': <Layers className="w-3.5 h-3.5" />,
}

const sequenceSteps = [
  { day: 'Day 1',  type: 'Email',    subject: 'Quick question about {{pain_point}}', openRate: 58, replyRate: 0 },
  { day: 'Day 3',  type: 'LinkedIn', subject: 'Connection request + note',            openRate: 0,  replyRate: 22 },
  { day: 'Day 6',  type: 'Email',    subject: 'Following up — {{company}} + AI',      openRate: 41, replyRate: 0 },
  { day: 'Day 10', type: 'Email',    subject: 'One last thought on {{company}}',      openRate: 34, replyRate: 0 },
  { day: 'Day 14', type: 'LinkedIn', subject: 'Final touch — value add share',        openRate: 0,  replyRate: 14 },
]

export default function OutreachPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  // ensure we don't crash before data arrives
  const activeCampaign = selectedCampaign || {
    id: '', name: '', status: 'draft' as CampaignStatus, channel: 'email' as const,
    leads: 0, sent: 0, opened: 0, replied: 0, meetings: 0,
    open_rate: 0, reply_rate: 0, start_date: ''
  }
  const [statusFilter, setStatusFilter] = useState<string>('All')

  useEffect(() => {
    fetch('/api/outreach/campaigns')
      .then((r) => r.json())
      .then((data: Campaign[]) => {
        setCampaigns(data)
        if (data.length > 0) setSelectedCampaign(data[0])
      })
      .catch((e) => console.error('fetch campaigns', e))
  }, [])

  const filtered = campaigns.filter(
    (c) => statusFilter === 'All' || c.status === statusFilter,
  )

  const totalSent    = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalReplies = campaigns.reduce((s, c) => s + c.replied, 0)
  const totalMtgs    = campaigns.reduce((s, c) => s + c.meetings, 0)
  const avgOpenRate  = totalSent > 0 ? campaigns.reduce((sum, c) => sum + c.open_rate * c.sent, 0) / totalSent : 0

  return (
    <div className="max-w-[1400px] space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Emails Sent',    value: totalSent.toLocaleString(),    icon: <Send className="w-4 h-4" />,           color: 'text-blue-400   bg-blue-500/10' },
          { label: 'Avg Open Rate',  value: `${avgOpenRate.toFixed(1)}%`,    icon: <Eye className="w-4 h-4" />,            color: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Total Replies',  value: totalReplies.toString(),        icon: <MessageSquare className="w-4 h-4" />, color: 'text-violet-400 bg-violet-500/10' },
          { label: 'Meetings Booked', value: totalMtgs.toString(),          icon: <Calendar className="w-4 h-4" />,      color: 'text-emerald-400 bg-emerald-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-bg-muted)_95%,white_5%)_0%,var(--panel-bg)_100%)] px-5 py-4 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
              <div className="text-xs text-[var(--text-muted)]">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Campaign List */}
        <div className="xl:col-span-2 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            {(['All', 'active', 'paused', 'draft', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-[var(--panel-bg)] border border-[var(--panel-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {s}
              </button>
            ))}
            <Button variant="primary" size="sm" className="ml-auto">
              <Plus className="w-3.5 h-3.5" />
              New Campaign
            </Button>
          </div>

          {/* Campaign table */}
          <div className="overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-bg-muted)_96%,white_4%)_0%,var(--panel-bg)_100%)] shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
            <table className="w-full">
              <thead className="border-b border-[var(--panel-border)]">
                <tr>
                  {['Campaign', 'Status', 'Channel', 'Sent', 'Open Rate', 'Reply Rate', 'Meetings', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border)]">
                {filtered.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign)}
                    className={`cursor-pointer transition-colors ${
                      activeCampaign.id === campaign.id
                        ? 'bg-indigo-500/5'
                        : 'hover:bg-[var(--hover-bg)]'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{campaign.name}</div>
                      <div className="text-xs text-[var(--text-subtle)]">{campaign.leads} prospects</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={campaign.status as CampaignStatus}>{campaign.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <span className="text-[var(--text-subtle)]">{channelIcon[campaign.channel]}</span>
                        <span className="capitalize">{campaign.channel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-secondary)]">{campaign.sent}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <Progress value={campaign.open_rate} max={100} barClassName="bg-indigo-500" />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{campaign.open_rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <Progress value={campaign.reply_rate} max={100} barClassName="bg-violet-500" />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{campaign.reply_rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${campaign.meetings > 0 ? 'text-emerald-400' : 'text-[var(--text-subtle)]'}`}>
                        {campaign.meetings}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                          title={campaign.status === 'active' ? 'Pause' : 'Resume'}
                        >
                          {campaign.status === 'active' ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Sequence builder preview */}
        <div className="space-y-4">
          {/* Selected campaign details */}
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{activeCampaign.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={activeCampaign.status as CampaignStatus}>{activeCampaign.status}</Badge>
                  <span className="text-xs text-[var(--text-subtle)]">Started {activeCampaign.start_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Sent',    value: activeCampaign.sent },
                { label: 'Opened',  value: activeCampaign.opened },
                { label: 'Replied', value: activeCampaign.replied },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg-muted)] p-3 text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)]">{s.value}</div>
                  <div className="text-[10px] text-[var(--text-subtle)]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Funnel */}
            {activeCampaign.sent > 0 && (
              <div className="space-y-2">
                {[
                  { label: 'Open rate',  value: activeCampaign.open_rate,  color: 'bg-indigo-500' },
                  { label: 'Reply rate', value: activeCampaign.reply_rate, color: 'bg-violet-500' },
                  { label: 'Meeting rate', value: activeCampaign.meetings ? (activeCampaign.meetings / activeCampaign.sent * 100) : 0, color: 'bg-emerald-500' },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                      <span>{m.label}</span>
                      <span className="font-semibold text-[var(--text-primary)]">{m.value.toFixed(1)}%</span>
                    </div>
                    <Progress value={m.value} barClassName={m.color} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sequence Steps */}
          <div className="overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] px-5 py-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sequence</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">5 steps</span>
              </div>
            </div>
            <div className="divide-y divide-[var(--panel-border)]">
              {sequenceSteps.map((step, i) => (
                <div key={i} className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--hover-bg)]">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      step.type === 'Email' ? 'bg-blue-500/15 text-blue-400' : 'bg-indigo-500/15 text-indigo-400'
                    }`}>
                      {step.type === 'Email' ? <Mail className="w-3.5 h-3.5" /> : <Linkedin className="w-3.5 h-3.5" />}
                    </div>
                    {i < sequenceSteps.length - 1 && (
                      <div className="mt-1.5 w-px flex-1 bg-[var(--panel-border)]" style={{ minHeight: '16px' }} />
                    )}
                  </div>
                  <div className="min-w-0 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">{step.day}</span>
                      <span className={`text-[10px] font-medium ${step.type === 'Email' ? 'text-blue-400' : 'text-indigo-400'}`}>
                        {step.type}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{step.subject}</div>
                    {(step.openRate > 0 || step.replyRate > 0) && (
                      <div className="flex items-center gap-3 mt-1">
                        {step.openRate > 0 && (
                          <span className="text-[10px] text-[var(--text-subtle)]">
                            <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" />{step.openRate}% open
                          </span>
                        )}
                        {step.replyRate > 0 && (
                          <span className="text-[10px] text-[var(--text-subtle)]">
                            <MessageSquare className="w-2.5 h-2.5 inline mr-0.5" />{step.replyRate}% reply
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--panel-border)] px-5 py-3">
              <Button variant="secondary" size="sm" className="w-full justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI Optimize Sequence
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
