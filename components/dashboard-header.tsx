'use client'

import { Bell, Search, ChevronRight, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
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
  const config = getPageConfig(pathname)

  return (
    <header className="h-16 border-b border-[#1e1e38] bg-[#07070e]/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-1">
        <span className="text-slate-600 text-xs">AI Autopilot</span>
        <ChevronRight className="w-3 h-3 text-slate-700" />
        <span className="text-white font-semibold text-sm">{config.name}</span>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-600" />
        <input
          type="text"
          placeholder="Search leads, companies, deals…"
          className="w-72 h-9 pl-9 pr-12 bg-[#111120] border border-[#1e1e38] rounded-lg text-sm text-slate-400 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
        />
        <kbd className="absolute right-3 text-[10px] text-slate-700 font-medium">⌘K</kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {config.action && (
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            {config.action}
          </Button>
        )}

        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer">
          A
        </div>
      </div>
    </header>
  )
}
