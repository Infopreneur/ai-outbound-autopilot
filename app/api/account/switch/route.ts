import { NextRequest, NextResponse } from 'next/server'
import { ACTIVE_ACCOUNT_COOKIE } from '@/lib/auth/cookies'
import { getAccountContext } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const accountId = typeof body.accountId === 'string' ? body.accountId : ''
  const allowed = ctx.memberships.some((membership) => membership.accountId === accountId)

  if (!accountId || !allowed) {
    return NextResponse.json({ error: 'Invalid account.' }, { status: 422 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ACTIVE_ACCOUNT_COOKIE, accountId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
