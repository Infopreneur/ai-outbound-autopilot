import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/cookies'
import { supabaseAdmin } from '@/lib/supabase/server'

type AccountRow = {
  id: string
  name: string
  slug: string
}

type MembershipRow = {
  account_id: string
  role: string
  accounts: AccountRow | AccountRow[] | null
}

type InvitationRow = {
  id: string
  account_id: string
  role: string
}

export type AccountContext = {
  user: User
  accessToken: string
  accountId: string
  accountName: string
  accountSlug: string
  role: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace'
}

async function getAccessToken() {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

async function createAccountForUser(user: User): Promise<AccountContext | null> {
  const emailPrefix = user.email?.split('@')[0] ?? 'workspace'
  const baseName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
    emailPrefix

  const accountName = `${baseName}'s Workspace`
  const baseSlug = slugify(baseName)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .insert({
        name: accountName,
        slug,
        owner_user_id: user.id,
      })
      .select('id, name, slug')
      .single()

    if (accountError) {
      if (accountError.code === '23505') continue
      throw accountError
    }

    const { error: membershipError } = await supabaseAdmin
      .from('account_memberships')
      .insert({
        account_id: account.id,
        user_id: user.id,
        role: 'owner',
      })

    if (membershipError) {
      throw membershipError
    }

    return {
      user,
      accessToken: await getAccessToken() ?? '',
      accountId: account.id,
      accountName: account.name,
      accountSlug: account.slug,
      role: 'owner',
    }
  }

  return null
}

async function findMembership(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('account_memberships')
    .select(`
      account_id,
      role,
      accounts:account_id (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as MembershipRow | null
}

async function claimPendingInvites(user: User) {
  const email = user.email?.trim().toLowerCase()
  if (!email) return

  const { data: invites, error } = await supabaseAdmin
    .from('account_invitations')
    .select('id, account_id, role')
    .eq('email', email)
    .eq('status', 'pending')

  if (error || !invites || invites.length === 0) return

  for (const invite of invites as InvitationRow[]) {
    const { error: membershipError } = await supabaseAdmin
      .from('account_memberships')
      .upsert({
        account_id: invite.account_id,
        user_id: user.id,
        role: invite.role,
      }, { onConflict: 'account_id,user_id' })

    if (membershipError) {
      console.error('[auth] failed to claim invitation:', membershipError.message)
      continue
    }

    await supabaseAdmin
      .from('account_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id)
  }
}

export async function getAccountContext(): Promise<AccountContext | null> {
  const accessToken = await getAccessToken()
  if (!accessToken) return null

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
  if (error || !data.user) return null

  await claimPendingInvites(data.user)

  let membership = await findMembership(data.user.id)
  if (!membership) {
    return createAccountForUser(data.user)
  }

  const account = Array.isArray(membership.accounts) ? membership.accounts[0] : membership.accounts
  if (!account) {
    membership = await findMembership(data.user.id)
    const refreshedAccount = membership
      ? (Array.isArray(membership.accounts) ? membership.accounts[0] : membership.accounts)
      : null
    if (!refreshedAccount) return null
    return {
      user: data.user,
      accessToken,
      accountId: refreshedAccount.id,
      accountName: refreshedAccount.name,
      accountSlug: refreshedAccount.slug,
      role: membership?.role ?? 'owner',
    }
  }

  return {
    user: data.user,
    accessToken,
    accountId: account.id,
    accountName: account.name,
    accountSlug: account.slug,
    role: membership.role,
  }
}

export async function requireAccountContext() {
  const ctx = await getAccountContext()
  if (!ctx) redirect('/login')
  return ctx
}
