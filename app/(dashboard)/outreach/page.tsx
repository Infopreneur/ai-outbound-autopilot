'use client'

import { useState } from 'react'
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
import { mockCampaigns } from '@/lib/mock-data'
import type { CampaignStatus } from '@/lib/mock-data'

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
  const [selectedCampaign, setSelectedCampaign] = useState(mockCampaigns[0])
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const filtered = mockCampaigns.filter(
    (c) => statusFilter === 'All' || c.status === statusFilter,
  )

  const totalSent    = mockCampaigns.reduce((s, c) => s + c.sent, 0)
  const totalReplies = mockCampaigns.reduce((s, c) => s + c.replied, 0)
  const totalMtgs    = mockCampaigns.reduce((s, c) => s + c.meetings, 0)

  return (
    <div className="max-w-[1400px] space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Emails Sent',    value: totalSent.toLocaleString(),    icon: <Send className="w-4 h-4" />,           color: 'text-blue-400   bg-blue-500/10' },
          { label: 'Avg Open Rate',  value: '52.6%',                       icon: <Eye className="w-4 h-4" />,            color: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Total Replies',  value: totalReplies.toString(),        icon: <MessageSquare className="w-4 h-4" />, color: 'text-violet-400 bg-violet-500/10' },
          { label: 'Meetings Booked', value: totalMtgs.toString(),          icon: <Calendar className="w-4 h-4" />,      color: 'text-emerald-400 bg-emerald-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111120] border border-[#1e1e38] rounded-xl px-5 py-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
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
                    : 'text-slate-500 hover:text-slate-300 bg-[#111120] border border-[#1e1e38]'
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
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#1e1e38]">
                <tr>
                  {['Campaign', 'Status', 'Channel', 'Sent', 'Open Rate', 'Reply Rate', 'Meetings', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14142a]">
                {filtered.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign)}
                    className={`cursor-pointer transition-colors ${
                      selectedCampaign.id === campaign.id
                        ? 'bg-indigo-500/5'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-100">{campaign.name}</div>
                      <div className="text-xs text-slate-600">{campaign.leads} prospects</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={campaign.status as CampaignStatus}>{campaign.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="text-slate-600">{channelIcon[campaign.channel]}</span>
                        <span className="capitalize">{campaign.channel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-medium">{campaign.sent}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <Progress value={campaign.openRate} max={100} barClassName="bg-indigo-500" />
                        </div>
                        <span className="text-xs text-slate-400">{campaign.openRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <Progress value={campaign.replyRate} max={100} barClassName="bg-violet-500" />
                        </div>
                        <span className="text-xs text-slate-400">{campaign.replyRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${campaign.meetings > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {campaign.meetings}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
                          title={campaign.status === 'active' ? 'Pause' : 'Resume'}
                        >
                          {campaign.status === 'active' ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
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
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedCampaign.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedCampaign.status as CampaignStatus}>{selectedCampaign.status}</Badge>
                  <span className="text-xs text-slate-600">Started {selectedCampaign.startDate}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Sent',    value: selectedCampaign.sent },
                { label: 'Opened',  value: selectedCampaign.opened },
                { label: 'Replied', value: selectedCampaign.replied },
              ].map((s) => (
                <div key={s.label} className="bg-[#1a1a30] border border-[#252540] rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{s.value}</div>
                  <div className="text-[10px] text-slate-600">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Funnel */}
            {selectedCampaign.sent > 0 && (
              <div className="space-y-2">
                {[
                  { label: 'Open rate',  value: selectedCampaign.openRate,  color: 'bg-indigo-500' },
                  { label: 'Reply rate', value: selectedCampaign.replyRate, color: 'bg-violet-500' },
                  { label: 'Meeting rate', value: selectedCampaign.meetings ? (selectedCampaign.meetings / selectedCampaign.sent * 100) : 0, color: 'bg-emerald-500' },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{m.label}</span>
                      <span className="text-white font-semibold">{m.value.toFixed(1)}%</span>
                    </div>
                    <Progress value={m.value} barClassName={m.color} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sequence Steps */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e38]">
              <h3 className="text-sm font-semibold text-white">Sequence</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">5 steps</span>
              </div>
            </div>
            <div className="divide-y divide-[#14142a]">
              {sequenceSteps.map((step, i) => (
                <div key={i} className="flex gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      step.type === 'Email' ? 'bg-blue-500/15 text-blue-400' : 'bg-indigo-500/15 text-indigo-400'
                    }`}>
                      {step.type === 'Email' ? <Mail className="w-3.5 h-3.5" /> : <Linkedin className="w-3.5 h-3.5" />}
                    </div>
                    {i < sequenceSteps.length - 1 && (
                      <div className="w-px flex-1 bg-[#1e1e38] mt-1.5" style={{ minHeight: '16px' }} />
                    )}
                  </div>
                  <div className="min-w-0 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-600 uppercase">{step.day}</span>
                      <span className={`text-[10px] font-medium ${step.type === 'Email' ? 'text-blue-400' : 'text-indigo-400'}`}>
                        {step.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">{step.subject}</div>
                    {(step.openRate > 0 || step.replyRate > 0) && (
                      <div className="flex items-center gap-3 mt-1">
                        {step.openRate > 0 && (
                          <span className="text-[10px] text-slate-600">
                            <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" />{step.openRate}% open
                          </span>
                        )}
                        {step.replyRate > 0 && (
                          <span className="text-[10px] text-slate-600">
                            <MessageSquare className="w-2.5 h-2.5 inline mr-0.5" />{step.replyRate}% reply
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[#1e1e38]">
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
