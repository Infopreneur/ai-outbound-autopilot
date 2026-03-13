import { requireAccountContext } from '@/lib/auth/server'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAccountContext()

  return (
    <div className="flex min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_18%)] p-6">{children}</main>
      </div>
    </div>
  )
}
