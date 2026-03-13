import { redirect } from 'next/navigation'
import { getAccountContext } from '@/lib/auth/server'

export default async function RootPage() {
  const ctx = await getAccountContext()
  redirect(ctx ? '/command-center' : '/login')
}
