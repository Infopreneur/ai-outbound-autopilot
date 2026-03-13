import { NextRequest, NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { requireAnyRole } from '@/lib/auth/permissions'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'
import { supabaseAdmin } from '@/lib/supabase/server'

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

  let updatedUser = ctx.user

  if (name || email || password) {
    const updatePayload: {
      email?: string
      password?: string
      user_metadata?: { full_name?: string; name?: string }
    } = {}

    if (email) updatePayload.email = email
    if (password) updatePayload.password = password
    if (name) updatePayload.user_metadata = { full_name: name, name }

    const { data: userData, error } = await supabaseAdmin.auth.admin.updateUserById(ctx.user.id, updatePayload)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (userData.user) {
      updatedUser = userData.user
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
  const responseUser = refreshed?.user ?? updatedUser
  const responseAccount = refreshed
    ? {
        id: refreshed.accountId,
        name: refreshed.accountName,
        slug: refreshed.accountSlug,
        role: refreshed.role,
      }
    : {
        id: ctx.accountId,
        name: accountName || ctx.accountName,
        slug: ctx.accountSlug,
        role: ctx.role,
      }

  return NextResponse.json({
    user: {
      id: responseUser.id,
      email: responseUser.email ?? '',
      name:
        (typeof responseUser.user_metadata?.full_name === 'string' && responseUser.user_metadata.full_name) ||
        (typeof responseUser.user_metadata?.name === 'string' && responseUser.user_metadata.name) ||
        responseUser.email?.split('@')[0] ||
        'User',
    },
    account: responseAccount,
    memberships: refreshed?.memberships ?? ctx.memberships,
  })
}
