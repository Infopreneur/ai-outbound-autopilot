import Link from 'next/link'
import {
  ArrowLeft,
  Globe,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Linkedin,
  Building2,
  Sparkles,
  Calendar,
  MessageSquare,
  Tag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { mockCompanies, mockLeads, mockActivity } from '@/lib/mock-data'
import type { CompanyStage } from '@/lib/mock-data'

export function generateStaticParams() {
  return mockCompanies.map((c) => ({ id: c.id }))
}

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const company = mockCompanies.find((c) => c.id === params.id) ?? mockCompanies[0]
  const contacts = mockLeads.filter((l) => l.companyId === company.id)
  const activity = mockActivity.slice(0, 5)

  const tabs = ['Overview', 'Contacts', 'Activity', 'AI Insights']

  return (
    <div className="max-w-[1200px] space-y-6">
      {/* Back */}
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Companies
      </Link>

      {/* Header Card */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <Avatar name={company.name} size="xl" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                <Badge variant={company.stage as CompanyStage}>{company.stage}</Badge>
              </div>
              <div className="text-slate-400 mt-1 text-sm">{company.description}</div>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <InfoChip icon={<Globe className="w-3.5 h-3.5" />} label={company.domain} />
                <InfoChip icon={<MapPin className="w-3.5 h-3.5" />} label={company.location} />
                <InfoChip icon={<Users className="w-3.5 h-3.5" />} label={`${company.size} employees`} />
                <InfoChip icon={<DollarSign className="w-3.5 h-3.5" />} label={company.revenue} />
                <InfoChip icon={<Tag className="w-3.5 h-3.5" />} label={company.fundingStage} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <Mail className="w-3.5 h-3.5" />
              Email
            </Button>
            <Button variant="secondary" size="sm">
              <Calendar className="w-3.5 h-3.5" />
              Schedule
            </Button>
            <Button variant="primary" size="sm">
              <Sparkles className="w-3.5 h-3.5" />
              AI Outreach
            </Button>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-5 pt-5 border-t border-[#1e1e38]">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">ICP Match Score</span>
            <span className={`text-sm font-bold ${company.score >= 80 ? 'text-emerald-400' : company.score >= 60 ? 'text-amber-400' : 'text-slate-400'}`}>
              {company.score} / 100
            </span>
          </div>
          <Progress
            value={company.score}
            barClassName={company.score >= 80 ? 'bg-emerald-500' : company.score >= 60 ? 'bg-amber-500' : 'bg-slate-500'}
            className="h-2"
          />
        </div>
      </div>

      {/* Tech stack */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl px-5 py-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tech Stack</div>
        <div className="flex flex-wrap gap-2">
          {company.technologies.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 rounded-full bg-[#1a1a30] border border-[#252540] text-xs font-medium text-slate-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contacts */}
        <div className="lg:col-span-2 bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e38]">
            <h2 className="text-sm font-semibold text-white">Contacts ({contacts.length > 0 ? contacts.length : '—'})</h2>
            <Button variant="secondary" size="sm">
              <Users className="w-3.5 h-3.5" />
              Find More
            </Button>
          </div>

          {contacts.length > 0 ? (
            <div className="divide-y divide-[#14142a]">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                  <Avatar name={contact.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-100">{contact.name}</div>
                    <div className="text-xs text-slate-500">{contact.title}</div>
                  </div>
                  <Badge variant={contact.status}>{contact.status}</Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5">
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5">
                      <Linkedin className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <div className="text-sm text-slate-600">No contacts yet</div>
              <Button variant="secondary" size="sm" className="mt-3">
                Find Contacts with AI
              </Button>
            </div>
          )}
        </div>

        {/* Activity + AI Insights */}
        <div className="space-y-4">
          {/* AI Insights */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">AI Insights</h3>
            </div>
            <div className="space-y-3">
              {[
                { insight: 'Job postings up 40% this quarter — rapid growth signal.', type: 'positive' },
                { insight: `Uses ${company.technologies[0]} — compatible with our integration.`, type: 'positive' },
                { insight: `${company.fundingStage} funded — has budget for new tools.`, type: 'positive' },
                { insight: 'Key decision maker active on LinkedIn this week.', type: 'positive' },
                { insight: 'No engagement in 72h — consider new touch point.', type: 'warning' },
              ].map((item, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.type === 'positive' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <p className="text-xs text-slate-400 leading-relaxed">{item.insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Activity</h3>
              <button className="text-xs text-indigo-400 hover:text-indigo-300">
                <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                Log
              </button>
            </div>
            <div className="space-y-3">
              {activity.map((item, i) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                    {i < activity.length - 1 && (
                      <div className="w-px flex-1 bg-[#1e1e38] mt-1" />
                    )}
                  </div>
                  <div className="pb-3 min-w-0">
                    <div className="text-xs font-semibold text-slate-300">{item.title}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">{item.description}</div>
                    <div className="text-[10px] text-slate-700 mt-1">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <span className="text-slate-600">{icon}</span>
      {label}
    </div>
  )
}
