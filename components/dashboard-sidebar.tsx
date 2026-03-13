'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Search,
  Building2,
  Clapperboard,
  Mail,
  BarChart3,
  Activity,
  Settings,
  Zap,
  ChevronRight,
  Sparkles,
  FileBarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/command-center',    icon: LayoutDashboard, label: 'Command Center' },
  { href: '/prospecting',       icon: Search,          label: 'Prospecting' },
  { href: '/companies',         icon: Building2,       label: 'Companies' },
  { href: '/outreach',          icon: Mail,            label: 'Outreach' },
  { href: '/reputation-report', icon: FileBarChart2,   label: 'Positioning Report' },
  { href: '/pipeline',          icon: BarChart3,       label: 'Pipeline' },
  { href: '/demo-studio',       icon: Clapperboard,    label: 'Demo Studio' },
]

const systemItems = [
  { href: '/system-health', icon: Activity, label: 'System Health' },
]

function NavLink({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/25 shadow-sm'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-indigo-400' : '')} />
      {label}
      {isActive && <ChevronRight className="w-3 h-3 ml-auto text-indigo-500" />}
    </Link>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <aside className="w-[220px] min-h-screen bg-[#0b0b18] border-r border-[#1e1e38] flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-[#1e1e38]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">AI Autopilot</div>
            <div className="text-[10px] text-indigo-400 font-medium mt-0.5">Outbound Platform</div>
          </div>
        </div>
      </div>

      {/* AI Status Pill */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">AI Engine Running</span>
          <Sparkles className="w-3 h-3 text-emerald-400 ml-auto" />
        </div>
      </div>

      {/* Platform nav */}
      <nav className="flex-1 px-3 pb-2 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">
          Platform
        </div>
        <div className="space-y-0.5 mb-4">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
          ))}
        </div>

        {/* System section */}
        <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2 mt-3">
          System
        </div>
        <div className="space-y-0.5">
          {systemItems.map((item) => (
            <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[#1e1e38] space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer mt-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-200 truncate">Alex Kim</div>
            <div className="text-xs text-slate-600 truncate">alex@company.com</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
