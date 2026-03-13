import { requireAccountContext } from '@/lib/auth/server'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAccountContext()

  return (
    <div className="flex min-h-screen bg-[#07070e]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
