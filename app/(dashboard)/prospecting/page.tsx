'use client'

import { useState } from 'react'
import { Search, Filter, Sparkles, Download, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { LeadTable } from '@/components/lead-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockLeads } from '@/lib/mock-data'

const industries = ['All', 'SaaS', 'FinTech', 'MarTech', 'AI/ML', 'Cloud Infrastructure', 'HR Tech', 'eCommerce']
const statuses   = ['All', 'hot', 'warm', 'cold', 'contacted', 'qualified']
const scores     = ['All', '90+', '75–89', '60–74', 'Below 60']

export default function ProspectingPage() {
  const [search, setSearch]           = useState('')
  const [industry, setIndustry]       = useState('All')
  const [status, setStatus]           = useState('All')
  const [scoreFilter, setScoreFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = mockLeads.filter((lead) => {
    const matchSearch =
      !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.title.toLowerCase().includes(search.toLowerCase())

    const matchIndustry = industry === 'All' || lead.industry === industry
    const matchStatus   = status === 'All' || lead.status === status
    const matchScore    =
      scoreFilter === 'All' ||
      (scoreFilter === '90+' && lead.score >= 90) ||
      (scoreFilter === '75–89' && lead.score >= 75 && lead.score < 90) ||
      (scoreFilter === '60–74' && lead.score >= 60 && lead.score < 75) ||
      (scoreFilter === 'Below 60' && lead.score < 60)

    return matchSearch && matchIndustry && matchStatus && matchScore
  })

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Prospects', value: '12,847', color: 'text-white' },
          { label: 'Hot Leads',       value: mockLeads.filter(l => l.status === 'hot').length.toString(),  color: 'text-red-400' },
          { label: 'Avg AI Score',    value: Math.round(mockLeads.reduce((s, l) => s + l.score, 0) / mockLeads.length).toString(), color: 'text-indigo-400' },
          { label: 'New Today',       value: '48',    color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111120] border border-[#1e1e38] rounded-xl px-5 py-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search name, company, or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </Button>

          <Button variant="secondary" size="sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI Prospect
          </Button>

          <Button variant="secondary" size="sm">
            <RefreshCw className="w-3.5 h-3.5" />
            Enrich
          </Button>

          <Button variant="secondary" size="sm">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>

          <div className="ml-auto text-sm text-slate-500">
            <span className="text-white font-semibold">{filtered.length}</span> results
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#1e1e38] flex flex-wrap gap-4">
            <FilterGroup label="Industry" options={industries} value={industry} onChange={setIndustry} />
            <FilterGroup label="Status"   options={statuses}   value={status}   onChange={setStatus} />
            <FilterGroup label="AI Score" options={scores}     value={scoreFilter} onChange={setScoreFilter} />
          </div>
        )}
      </div>

      {/* Table */}
      <LeadTable leads={filtered} />
    </div>
  )
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-500 w-16">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              value === o
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540] hover:border-[#32325a]'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
