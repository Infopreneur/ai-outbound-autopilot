'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Building2, Users, Globe, TrendingUp, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { mockCompanies } from '@/lib/mock-data'
import type { CompanyStage } from '@/lib/mock-data'

const stages: CompanyStage[] = ['prospect', 'engaged', 'demo', 'customer', 'churned']
const industries = ['All', 'SaaS', 'FinTech', 'MarTech', 'AI/ML', 'Cloud Infrastructure', 'HR Tech', 'eCommerce', 'Analytics']

export default function CompaniesPage() {
  const [search, setSearch]     = useState('')
  const [stage, setStage]       = useState<string>('All')
  const [industry, setIndustry] = useState('All')
  const [view, setView]         = useState<'grid' | 'list'>('grid')

  const filtered = mockCompanies.filter((c) => {
    const matchSearch   = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.domain.toLowerCase().includes(search.toLowerCase())
    const matchStage    = stage === 'All' || c.stage === stage
    const matchIndustry = industry === 'All' || c.industry === industry
    return matchSearch && matchStage && matchIndustry
  })

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Companies', value: mockCompanies.length.toString(),                                     color: 'text-white' },
          { label: 'Active Accounts', value: mockCompanies.filter(c => c.stage === 'engaged' || c.stage === 'demo').length.toString(), color: 'text-indigo-400' },
          { label: 'Customers',       value: mockCompanies.filter(c => c.stage === 'customer').length.toString(), color: 'text-emerald-400' },
          { label: 'Avg Score',       value: Math.round(mockCompanies.reduce((s, c) => s + c.score, 0) / mockCompanies.length).toString(), color: 'text-violet-400' },
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
              placeholder="Search companies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#1a1a30] border border-[#252540] rounded-lg p-1">
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                  view === v ? 'bg-indigo-600/30 text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="text-sm text-slate-500">
            <span className="text-white font-semibold">{filtered.length}</span> companies
          </div>
        </div>

        {/* Stage filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {['All', ...stages].map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                stage === s
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Company Grid */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-5 hover:border-[#252548] hover:bg-[#13132a] transition-all duration-150 cursor-pointer group h-full">
                <div className="flex items-start justify-between mb-4">
                  <Avatar name={company.name} size="lg" />
                  <Badge variant={company.stage as CompanyStage}>{company.stage}</Badge>
                </div>

                <div className="mb-3">
                  <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{company.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{company.domain}</div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Building2 className="w-3 h-3" />
                    {company.industry}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-3 h-3" />
                    {company.size} employees
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Globe className="w-3 h-3" />
                    {company.location}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>AI Score</span>
                    <span className="text-white font-semibold">{company.score}</span>
                  </div>
                  <Progress
                    value={company.score}
                    barClassName={company.score >= 80 ? 'bg-emerald-500' : company.score >= 60 ? 'bg-amber-500' : 'bg-slate-500'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{company.contacts} contacts</span>
                  <span className="text-xs text-slate-600">{company.lastActivity}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-[#1e1e38]">
              <tr>
                {['Company', 'Industry', 'Size', 'Stage', 'Score', 'Contacts', 'Last Activity', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14142a]">
              {filtered.map((company) => (
                <tr key={company.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={company.name} size="sm" />
                      <div>
                        <div className="text-sm font-medium text-slate-100">{company.name}</div>
                        <div className="text-xs text-slate-600">{company.domain}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{company.industry}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{company.size}</td>
                  <td className="px-4 py-3"><Badge variant={company.stage as CompanyStage}>{company.stage}</Badge></td>
                  <td className="px-4 py-3">
                    <div className={`text-sm font-bold ${company.score >= 80 ? 'text-emerald-400' : company.score >= 65 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {company.score}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{company.contacts}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{company.lastActivity}</td>
                  <td className="px-4 py-3">
                    <Link href={`/companies/${company.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
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
