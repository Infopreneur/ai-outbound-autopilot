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
  Sparkles,
  FileBarChart2,
  PenLine,
  List,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Nav structure ─────────────────────────────────────────────────────────────
type NavItem = {
  href: string
  icon: React.ElementType
  label: string
  children?: { href: string; icon: React.ElementType; label: string }[]
}

const navItems: NavItem[] = [
  { href: '/command-center',    icon: LayoutDashboard, label: 'Command Center' },
  { href: '/prospecting',       icon: Search,          label: 'Prospecting' },
  { href: '/companies',         icon: Building2,       label: 'Companies' },
  {
    href: '/outreach', icon: Mail, label: 'Outreach',
    children: [
      { href: '/outreach',         icon: List,    label: 'Campaigns' },
      { href: '/outreach/compose', icon: PenLine, label: 'Compose' },
    ],
  },
  { href: '/reputation-report', icon: FileBarChart2,   label: 'Positioning Report' },
  { href: '/pipeline',          icon: BarChart3,       label: 'Pipeline' },
  { href: '/demo-studio',       icon: Clapperboard,    label: 'Demo Studio' },
]

const systemItems = [
  { href: '/system-health', icon: Activity, label: 'System Health' },
  { href: '/system-settings', icon: Settings, label: 'System Settings' },
]

// ── Components ────────────────────────────────────────────────────────────────
function NavLink({
  href,
  icon: Icon,
  label,
  isActive,
  indent = false,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  indent?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
        indent ? 'px-3 py-2 ml-5' : 'px-3 py-2.5',
        isActive
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/25 shadow-sm'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]',
      )}
    >
      <Icon className={cn('flex-shrink-0', indent ? 'w-3.5 h-3.5' : 'w-4 h-4', isActive ? 'text-indigo-400' : '')} />
      {label}
    </Link>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function DashboardSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <aside className="flex min-h-screen w-[220px] flex-col border-r border-[var(--panel-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-bg)_90%,#dbe4f3_10%)_0%,color-mix(in_srgb,var(--shell-bg)_84%,#cbd5e1_16%)_100%)] shadow-[inset_-1px_0_0_rgba(148,163,184,0.10)]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[var(--panel-border)] bg-[rgba(255,255,255,0.34)] px-5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)] leading-none">AI Autopilot</div>
            <div className="text-[10px] text-indigo-400 font-medium mt-0.5">Outbound Platform</div>
          </div>
        </div>
      </div>

      {/* AI Status Pill */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/18 bg-[linear-gradient(90deg,rgba(16,185,129,0.10),rgba(34,211,238,0.08))] px-3 py-2.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">AI Engine Running</span>
          <Sparkles className="w-3 h-3 text-emerald-400 ml-auto" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-2 overflow-y-auto">
        <div className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider px-3 mb-2">
          Platform
        </div>
        <div className="space-y-1 mb-4">
          {navItems.map((item) => {
            const parentActive = isActive(item.href)
            const hasChildren  = item.children && item.children.length > 0

            return (
              <div key={item.href}>
                {/* Parent link — if it has children, just highlight when in that section */}
                <Link
                  href={item.children ? item.children[0].href : item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    parentActive
                      ? 'border border-indigo-400/30 bg-[linear-gradient(90deg,rgba(99,102,241,0.16),rgba(168,85,247,0.10))] text-indigo-500 shadow-[0_10px_24px_rgba(99,102,241,0.12)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]',
                  )}
                >
                  <item.icon className={cn('w-4 h-4 flex-shrink-0', parentActive ? 'text-indigo-400' : '')} />
                  {item.label}
                </Link>

                {/* Children — show when parent section is active */}
                {hasChildren && parentActive && (
                  <div className="mt-0.5 space-y-0.5">
                    {item.children!.map((child) => (
                      <NavLink
                        key={child.href}
                        href={child.href}
                        icon={child.icon}
                        label={child.label}
                        isActive={pathname === child.href}
                        indent
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* System */}
        <div className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider px-3 mb-2 mt-3">
          System
        </div>
        <div className="space-y-0.5">
          {systemItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} isActive={isActive(item.href)} />
          ))}
        </div>
      </nav>
    </aside>
  )
}
