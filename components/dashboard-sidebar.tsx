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
    <aside className="w-[220px] min-h-screen bg-[color:color-mix(in_srgb,var(--shell-bg)_92%,#eef4ff_8%)] border-r border-[var(--panel-border)] flex flex-col shadow-[inset_-1px_0_0_rgba(148,163,184,0.08)]">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-[var(--panel-border)] bg-[color:color-mix(in_srgb,var(--panel-bg)_82%,transparent_18%)]">
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
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 shadow-sm">
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
                      ? 'bg-gradient-to-r from-indigo-500/18 to-violet-500/14 text-indigo-400 border border-indigo-500/25 shadow-[0_10px_24px_rgba(99,102,241,0.10)]'
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
