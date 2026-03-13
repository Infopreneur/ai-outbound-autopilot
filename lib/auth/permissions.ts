import type { AccountContext } from '@/lib/auth/server'

export const ACCOUNT_ROLES = ['owner', 'admin', 'member'] as const
export type AccountRole = typeof ACCOUNT_ROLES[number]

const ROLE_RANK: Record<AccountRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
}

export function hasMinimumRole(role: string, minimumRole: AccountRole) {
  if (!(role in ROLE_RANK)) return false
  return ROLE_RANK[role as AccountRole] >= ROLE_RANK[minimumRole]
}

export function hasAnyRole(role: string, allowedRoles: AccountRole[]) {
  return allowedRoles.some((allowed) => hasMinimumRole(role, allowed))
}

export function requireAnyRole(ctx: AccountContext, allowedRoles: AccountRole[]) {
  if (!hasAnyRole(ctx.role, allowedRoles)) {
    throw new Error('Forbidden')
  }
}
