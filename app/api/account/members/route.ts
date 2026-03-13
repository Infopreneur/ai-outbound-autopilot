import { NextRequest, NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { requireAnyRole, hasMinimumRole, type AccountRole } from '@/lib/auth/permissions'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'
import { supabaseAdmin } from '@/lib/supabase/server'

type MembershipRow = {
  id: string
  role: string
  user_id: string
  created_at: string
}

type InvitationRow = {
  id: string
  email: string
  role: string
  status: string
  created_at: string
}

const VALID_ROLES: AccountRole[] = ['owner', 'admin', 'member']

async function listMembers(accountId: string) {
  const { data: memberships, error: membershipsError } = await supabaseAdmin
    .from('account_memberships')
    .select('id, user_id, role, created_at')
    .eq('account_id', accountId)
    .order('created_at', { ascending: true })

  if (membershipsError) throw membershipsError

  const ids = ((memberships ?? []) as MembershipRow[]).map((m) => m.user_id)
  const usersById = new Map<string, { email: string; name: string }>()

  if (ids.length > 0) {
    for (const id of ids) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id)
      const email = data.user?.email ?? ''
      const name =
        (typeof data.user?.user_metadata?.full_name === 'string' && data.user.user_metadata.full_name) ||
        (typeof data.user?.user_metadata?.name === 'string' && data.user.user_metadata.name) ||
        email.split('@')[0] ||
        'User'
      usersById.set(id, { email, name })
    }
  }

  const { data: invitations, error: invitesError } = await supabaseAdmin
    .from('account_invitations')
    .select('id, email, role, status, created_at')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })

  if (invitesError) throw invitesError

  return {
    members: ((memberships ?? []) as MembershipRow[]).map((membership) => ({
      id: membership.id,
      userId: membership.user_id,
      role: membership.role,
      createdAt: membership.created_at,
      email: usersById.get(membership.user_id)?.email ?? '',
      name: usersById.get(membership.user_id)?.name ?? 'User',
    })),
    invitations: ((invitations ?? []) as InvitationRow[]).map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      createdAt: invite.created_at,
    })),
  }
}

export async function GET() {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const payload = await listMembers(ctx.accountId)
    return NextResponse.json(payload)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to load members.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    requireAnyRole(ctx, ['admin'])
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role = typeof body.role === 'string' ? body.role : 'member'

  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 422 })
  if (!VALID_ROLES.includes(role as AccountRole) || role === 'owner') {
    return NextResponse.json({ error: 'Role must be admin or member.' }, { status: 422 })
  }

  const supabase = getUserSupabaseClient(ctx.accessToken)
  const { error } = await supabase
    .from('account_invitations')
    .upsert({
      account_id: ctx.accountId,
      email,
      role,
      invited_by_user_id: ctx.user.id,
      status: 'pending',
      accepted_at: null,
    }, { onConflict: 'account_id,email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const payload = await listMembers(ctx.accountId)
  return NextResponse.json(payload, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    requireAnyRole(ctx, ['admin'])
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const membershipId = typeof body.membershipId === 'string' ? body.membershipId : ''
  const role = typeof body.role === 'string' ? body.role : ''

  if (!membershipId || !VALID_ROLES.includes(role as AccountRole)) {
    return NextResponse.json({ error: 'membershipId and valid role are required.' }, { status: 422 })
  }

  const { data: membership, error: findError } = await supabaseAdmin
    .from('account_memberships')
    .select('id, user_id, role')
    .eq('id', membershipId)
    .eq('account_id', ctx.accountId)
    .single()

  if (findError || !membership) {
    return NextResponse.json({ error: 'Membership not found.' }, { status: 404 })
  }

  if (membership.user_id === ctx.user.id && !hasMinimumRole(role, 'admin')) {
    return NextResponse.json({ error: 'You cannot demote yourself below admin.' }, { status: 400 })
  }

  const supabase = getUserSupabaseClient(ctx.accessToken)
  const { error } = await supabase
    .from('account_memberships')
    .update({ role })
    .eq('id', membershipId)
    .eq('account_id', ctx.accountId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const payload = await listMembers(ctx.accountId)
  return NextResponse.json(payload)
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    requireAnyRole(ctx, ['admin'])
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const membershipId = searchParams.get('membershipId') ?? ''
  const invitationId = searchParams.get('invitationId') ?? ''
  const supabase = getUserSupabaseClient(ctx.accessToken)

  if (membershipId) {
    const { data: membership } = await supabaseAdmin
      .from('account_memberships')
      .select('user_id')
      .eq('id', membershipId)
      .eq('account_id', ctx.accountId)
      .maybeSingle()

    if (membership?.user_id === ctx.user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself from the workspace.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('account_memberships')
      .delete()
      .eq('id', membershipId)
      .eq('account_id', ctx.accountId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  } else if (invitationId) {
    const { error } = await supabase
      .from('account_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('account_id', ctx.accountId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  } else {
    return NextResponse.json({ error: 'membershipId or invitationId is required.' }, { status: 422 })
  }

  const payload = await listMembers(ctx.accountId)
  return NextResponse.json(payload)
}
