'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, MoreHorizontal, ExternalLink, Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Lead, LeadStatus } from '@/lib/mock-data'

type SortKey = 'name' | 'company' | 'score' | 'status' | 'lastActivity'
type SortDir = 'asc' | 'desc'

interface LeadTableProps {
  leads: Lead[]
  compact?: boolean
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85 ? 'text-emerald-400 bg-emerald-500/10' :
    score >= 65 ? 'text-amber-400 bg-amber-500/10' :
    'text-[var(--text-muted)] bg-slate-500/10'
  return (
    <div className={cn('inline-flex items-center justify-center w-9 h-7 rounded-md text-xs font-bold tabular-nums', color)}>
      {score}
    </div>
  )
}

function StatusDot({ status }: { status: LeadStatus }) {
  const color: Record<LeadStatus, string> = {
    hot:          'bg-red-400',
    warm:         'bg-amber-400',
    cold:         'bg-blue-400',
    contacted:    'bg-violet-400',
    qualified:    'bg-emerald-400',
    disqualified: 'bg-slate-500',
  }
  return <span className={cn('inline-block w-1.5 h-1.5 rounded-full', color[status])} />
}

export function LeadTable({ leads, compact = false }: LeadTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const sorted = [...leads].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'score') cmp = a.score - b.score
    else if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortKey === 'company') cmp = a.company.localeCompare(b.company)
    else if (sortKey === 'status') cmp = a.status.localeCompare(b.status)
    return sortDir === 'asc' ? cmp : -cmp
  })

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 text-[var(--text-subtle)]" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-indigo-400" />
      : <ChevronDown className="w-3 h-3 text-indigo-400" />
  }

  function Th({ label, k }: { label: string; k?: SortKey }) {
    return (
      <th
        className={cn(
          'px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap',
          k && 'cursor-pointer hover:text-[var(--text-secondary)] select-none',
        )}
        onClick={() => k && toggleSort(k)}
      >
        <div className="flex items-center gap-1">
          {label}
          {k && <SortIcon k={k} />}
        </div>
      </th>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--panel-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-bg-muted)_96%,white_4%)_0%,var(--panel-bg)_100%)] shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-600/10 border-b border-indigo-500/20">
          <span className="text-sm text-indigo-300 font-medium">{selected.size} selected</span>
          <Button size="sm" variant="primary">Add to Campaign</Button>
          <Button size="sm" variant="secondary">Export</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <table className="w-full">
        <thead className="border-b border-[var(--panel-border)]">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
                checked={selected.size === sorted.length && sorted.length > 0}
                onChange={(e) =>
                  setSelected(e.target.checked ? new Set(sorted.map((l) => l.id)) : new Set())
                }
              />
            </th>
            <Th label="Name" k="name" />
            <Th label="Company" k="company" />
            {!compact && <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Title</th>}
            <Th label="Score" k="score" />
            <Th label="Status" k="status" />
            {!compact && <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">AI Insight</th>}
            <Th label="Activity" k="lastActivity" />
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:color-mix(in_srgb,var(--panel-border)_75%,transparent_25%)]">
          {sorted.map((lead) => (
            <tr
              key={lead.id}
              className={cn(
                'group hover:bg-[var(--hover-bg)] transition-colors',
                selected.has(lead.id) && 'bg-indigo-500/5',
              )}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
                  checked={selected.has(lead.id)}
                  onChange={() => toggleSelect(lead.id)}
                />
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={lead.name} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{lead.name}</div>
                    <div className="text-xs text-[var(--text-subtle)]">{lead.email}</div>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="text-sm text-[var(--text-secondary)]">{lead.company}</div>
                <div className="text-xs text-[var(--text-subtle)]">{lead.employees} emp.</div>
              </td>

              {!compact && (
                <td className="px-4 py-3">
                  <div className="text-sm text-[var(--text-muted)] max-w-[160px] truncate">{lead.title}</div>
                </td>
              )}

              <td className="px-4 py-3">
                <ScoreBadge score={lead.score} />
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <StatusDot status={lead.status} />
                  <Badge variant={lead.status}>{lead.status}</Badge>
                </div>
              </td>

              {!compact && (
                <td className="px-4 py-3 max-w-[220px]">
                  <div className="text-xs text-[var(--text-muted)] truncate">{lead.aiInsight}</div>
                </td>
              )}

              <td className="px-4 py-3">
                <span className="text-xs text-[var(--text-subtle)]">{lead.lastActivity}</span>
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title="Email"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Phone"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Open"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative">
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
                      onClick={() => setOpenMenu(openMenu === lead.id ? null : lead.id)}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                    {openMenu === lead.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--panel-bg)] border border-[var(--input-border)] rounded-lg shadow-xl z-10 py-1 text-sm">
                        {['Add to Campaign', 'Schedule Call', 'Add Note', 'Disqualify'].map((a) => (
                          <button
                            key={a}
                            className="w-full text-left px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors"
                            onClick={() => setOpenMenu(null)}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
