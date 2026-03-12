import {
  Users,
  CalendarCheck,
  Megaphone,
  DollarSign,
  Sparkles,
  Bot,
  Mail,
  Phone,
  Calendar,
  Zap,
  ArrowRight,
  Activity,
} from 'lucide-react'
import { KpiCard } from '@/components/kpi-card'
import { LeadTable } from '@/components/lead-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockLeads, mockActivity, kpiData } from '@/lib/mock-data'

const kpiIcons = [
  <Users key="users" className="w-4 h-4" />,
  <CalendarCheck key="cal" className="w-4 h-4" />,
  <Megaphone key="mega" className="w-4 h-4" />,
  <DollarSign key="dollar" className="w-4 h-4" />,
]

const activityIcons: Record<string, React.ReactNode> = {
  ai:          <Bot className="w-3.5 h-3.5 text-indigo-400" />,
  email:       <Mail className="w-3.5 h-3.5 text-blue-400" />,
  call:        <Phone className="w-3.5 h-3.5 text-emerald-400" />,
  meeting:     <Calendar className="w-3.5 h-3.5 text-violet-400" />,
  enrichment:  <Zap className="w-3.5 h-3.5 text-amber-400" />,
  note:        <Activity className="w-3.5 h-3.5 text-slate-400" />,
}

const activityBg: Record<string, string> = {
  ai:         'bg-indigo-500/10 border-indigo-500/20',
  email:      'bg-blue-500/10 border-blue-500/20',
  call:       'bg-emerald-500/10 border-emerald-500/20',
  meeting:    'bg-violet-500/10 border-violet-500/20',
  enrichment: 'bg-amber-500/10 border-amber-500/20',
  note:       'bg-slate-500/10 border-slate-500/20',
}

export default function CommandCenterPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, i) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            icon={kpiIcons[i]}
            color={kpi.color as 'indigo' | 'emerald' | 'violet' | 'amber'}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Recent Prospects */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Prospects</h2>
              <p className="text-xs text-slate-500 mt-0.5">AI-scored leads from the last 24 hours</p>
            </div>
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <LeadTable leads={mockLeads.slice(0, 5)} compact />
        </div>

        {/* Right: AI Activity Feed */}
        <div className="space-y-4">
          {/* AI Activity */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">AI Activity</h3>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-3">
              {mockActivity.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${activityBg[item.type] ?? activityBg.note}`}
                  >
                    {activityIcons[item.type]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-300 leading-snug">{item.title}</div>
                      {item.meta && (
                        <span className="text-[10px] text-slate-600 bg-[#1a1a30] px-1.5 py-0.5 rounded border border-[#252540] whitespace-nowrap">
                          {item.meta}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                      {item.description}
                    </div>
                    <div className="text-[10px] text-slate-700 mt-1">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Run AI Prospecting', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-indigo-400 bg-indigo-500/10' },
                { label: 'Launch Email Campaign', icon: <Mail className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-500/10' },
                { label: 'Schedule Demo', icon: <Calendar className="w-3.5 h-3.5" />, color: 'text-violet-400 bg-violet-500/10' },
                { label: 'Enrich Leads', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/10' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a1a30] border border-[#252540] text-sm text-slate-300 hover:text-white hover:border-[#32325a] hover:bg-[#1e1e38] transition-all text-left"
                >
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center ${action.color}`}>
                    {action.icon}
                  </span>
                  {action.label}
                  <ArrowRight className="w-3 h-3 ml-auto text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Outreach Performance */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Outreach Performance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Last 30 days — all channels</p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((r, i) => (
              <button
                key={r}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  i === 1
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/25'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Emails Sent',    value: '1,842', sub: 'Total outreach',    color: 'text-blue-400' },
            { label: 'Open Rate',      value: '52.6%', sub: '+4.1% vs benchmark', color: 'text-indigo-400' },
            { label: 'Reply Rate',     value: '14.4%', sub: '+2.3% vs last month', color: 'text-violet-400' },
            { label: 'Demos Booked',   value: '38',    sub: 'From email channel', color: 'text-emerald-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1a1a30] border border-[#252540] rounded-lg p-4">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-sm font-medium text-slate-300">{stat.label}</div>
              <div className="text-xs text-slate-600 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Fake bar chart */}
        <div className="mt-5">
          <div className="flex items-end gap-2 h-20">
            {[42, 65, 55, 78, 62, 88, 74, 91, 68, 82, 76, 95, 71, 84].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-indigo-500/60 hover:bg-indigo-500 transition-colors"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-slate-700">Feb 26</span>
            <span className="text-[10px] text-slate-700">Mar 12</span>
          </div>
        </div>
      </div>
    </div>
  )
}
