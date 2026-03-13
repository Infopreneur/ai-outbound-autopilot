'use client'

import { useEffect, useState } from 'react'
import { Bell, Search, ChevronRight, Plus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const pageConfig: Record<string, { name: string; action?: string }> = {
  '/command-center': { name: 'Command Center' },
  '/prospecting':    { name: 'Prospecting', action: 'Import Leads' },
  '/companies':      { name: 'Companies', action: 'Add Company' },
  '/demo-studio':    { name: 'Demo Studio', action: 'New Demo' },
  '/outreach':       { name: 'Outreach', action: 'New Campaign' },
  '/pipeline':       { name: 'Pipeline', action: 'Add Deal' },
}

function getPageConfig(pathname: string) {
  for (const [key, val] of Object.entries(pageConfig)) {
    if (pathname === key || pathname.startsWith(key + '/')) return val
  }
  return { name: 'Dashboard' }
}

export function DashboardHeader() {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const config = getPageConfig(pathname)
  const [account, setAccount] = useState<{ id: string; name: string; role: string } | null>(null)
  const [memberships, setMemberships] = useState<Array<{ accountId: string; accountName: string; role: string }>>([])

  useEffect(() => {
    fetch('/api/account/context')
      .then((r) => r.json())
      .then((data) => {
        if (data?.account) {
          setAccount({
            id: data.account.id,
            name: data.account.name,
            role: data.account.role,
          })
        }
        if (Array.isArray(data?.memberships)) {
          setMemberships(data.memberships.map((membership: {
            accountId: string
            accountName: string
            role: string
          }) => ({
            accountId: membership.accountId,
            accountName: membership.accountName,
            role: membership.role,
          })))
        }
      })
      .catch(() => {})
  }, [])

  async function switchAccount(accountId: string) {
    const res = await fetch('/api/account/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    })
    if (!res.ok) return
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[var(--panel-border)] bg-[rgba(236,241,247,0.88)] px-6 backdrop-blur-xl shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-1">
        <span className="text-[var(--text-subtle)] text-xs">AI Autopilot</span>
        <ChevronRight className="w-3 h-3 text-[var(--text-subtle)]" />
        <span className="text-[var(--text-primary)] font-semibold text-sm">{config.name}</span>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-[var(--text-subtle)]" />
        <input
          type="text"
          placeholder="Search leads, companies, deals…"
          className="h-10 w-72 rounded-xl border border-[var(--panel-border)] bg-[rgba(255,255,255,0.64)] pl-9 pr-12 text-sm text-[var(--text-secondary)] placeholder-[var(--text-subtle)] transition-colors focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
        />
        <kbd className="absolute right-3 text-[10px] text-[var(--text-subtle)] font-medium">⌘K</kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {account && memberships.length > 1 && (
          <select
            value={account.id}
            onChange={(e) => switchAccount(e.target.value)}
            className="h-10 max-w-[240px] rounded-xl border border-[var(--panel-border)] bg-[rgba(255,255,255,0.64)] px-3 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-indigo-500/50"
          >
            {memberships.map((membership) => (
              <option key={membership.accountId} value={membership.accountId}>
                {membership.accountName} ({membership.role})
              </option>
            ))}
          </select>
        )}

        {config.action && (
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            {config.action}
          </Button>
        )}

        <button className="relative w-10 h-10 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer">
          {(account?.name?.[0] ?? 'A').toUpperCase()}
        </div>
      </div>
    </header>
  )
}
