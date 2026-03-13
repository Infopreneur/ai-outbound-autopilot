import { NextRequest, NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { requireAnyRole } from '@/lib/auth/permissions'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'

export async function GET() {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    user: {
      id: ctx.user.id,
      email: ctx.user.email ?? '',
      name:
        (typeof ctx.user.user_metadata?.full_name === 'string' && ctx.user.user_metadata.full_name) ||
        (typeof ctx.user.user_metadata?.name === 'string' && ctx.user.user_metadata.name) ||
        ctx.user.email?.split('@')[0] ||
        'User',
    },
    account: {
      id: ctx.accountId,
      name: ctx.accountName,
      slug: ctx.accountSlug,
      role: ctx.role,
    },
    memberships: ctx.memberships,
  })
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const supabase = getUserSupabaseClient(ctx.accessToken)

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const accountName = typeof body.accountName === 'string' ? body.accountName.trim() : ''

  if (name || email || password) {
    const updatePayload: {
      email?: string
      password?: string
      data?: { full_name?: string; name?: string }
    } = {}

    if (email) updatePayload.email = email
    if (password) updatePayload.password = password
    if (name) updatePayload.data = { full_name: name, name }

    const { error } = await supabase.auth.updateUser(updatePayload)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  if (accountName) {
    try {
      requireAnyRole(ctx, ['admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('accounts')
      .update({ name: accountName })
      .eq('id', ctx.accountId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  const refreshed = await getAccountContext()
  if (!refreshed) return NextResponse.json({ error: 'Unable to refresh account context.' }, { status: 500 })

  return NextResponse.json({
    user: {
      id: refreshed.user.id,
      email: refreshed.user.email ?? '',
      name:
        (typeof refreshed.user.user_metadata?.full_name === 'string' && refreshed.user.user_metadata.full_name) ||
        (typeof refreshed.user.user_metadata?.name === 'string' && refreshed.user.user_metadata.name) ||
        refreshed.user.email?.split('@')[0] ||
        'User',
    },
    account: {
      id: refreshed.accountId,
      name: refreshed.accountName,
      slug: refreshed.accountSlug,
      role: refreshed.role,
    },
    memberships: refreshed.memberships,
  })
}
