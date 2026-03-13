'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Key, User, Settings as SettingsIcon, Mail, Globe, Bot, Zap, Loader2, Building2, Users, Trash2 } from 'lucide-react'

interface ApiKeys {
  anthropic: string
  supabaseUrl: string
  supabaseAnon: string
  supabaseService: string
  googleMaps: string
  emailApi: string
  scrapingApi: string
  automationApi: string
}

interface UserAccount {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface Preferences {
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  dataRetention: string
}

interface AccountContextPayload {
  user: {
    id: string
    email: string
    name: string
  }
  account: {
    id: string
    name: string
    slug: string
    role: string
  }
}

interface WorkspaceMember {
  id: string
  userId: string
  name: string
  email: string
  role: string
  createdAt: string
}

interface WorkspaceInvitation {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
}

interface MembersPayload {
  members: WorkspaceMember[]
  invitations: WorkspaceInvitation[]
}

interface AccountSettingsPayload {
  apiKeys: ApiKeys
  preferences: Preferences
}

export default function SystemSettingsPage() {
  const router = useRouter()
  const [loadingAccount, setLoadingAccount] = useState(true)
  const [savingAccount, setSavingAccount] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [savingMembers, setSavingMembers] = useState(false)
  const [accountMessage, setAccountMessage] = useState<string | null>(null)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [membersMessage, setMembersMessage] = useState<string | null>(null)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [workspace, setWorkspace] = useState({ name: '', slug: '', role: 'member' })
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')

  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    return {
      anthropic: '',
      supabaseUrl: '',
      supabaseAnon: '',
      supabaseService: '',
      googleMaps: '',
      emailApi: '',
      scrapingApi: '',
      automationApi: '',
    }
  })

  const [userAccount, setUserAccount] = useState<UserAccount>(() => {
    return { name: 'Alex Kim', email: 'alex@company.com', password: '', confirmPassword: '' }
  })

  const [preferences, setPreferences] = useState<Preferences>(() => {
    return { theme: 'dark', notifications: true, dataRetention: '90' }
  })

  // apply theme on change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      if (preferences.theme === 'system') {
        // follow system
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        root.classList.add(mq.matches ? 'dark' : 'light')
      } else {
        root.classList.add(preferences.theme)
      }
    }
  }, [preferences])

  useEffect(() => {
    fetch('/api/account/settings')
      .then((r) => r.json())
      .then((data: AccountSettingsPayload | { error?: string }) => {
        if ('error' in data && data.error) throw new Error(data.error)
        const payload = data as AccountSettingsPayload
        setApiKeys(payload.apiKeys)
        setPreferences(payload.preferences)
        if (typeof window !== 'undefined') {
          localStorage.setItem('workspacePreferences', JSON.stringify(payload.preferences))
        }
      })
      .catch((err) => setAccountError(err instanceof Error ? err.message : 'Failed to load workspace settings.'))
      .finally(() => setLoadingSettings(false))
  }, [])

  useEffect(() => {
    fetch('/api/account/context')
      .then((r) => r.json())
      .then((data: AccountContextPayload | { error?: string }) => {
        if ('error' in data && data.error) {
          throw new Error(data.error)
        }
        const payload = data as AccountContextPayload
        setUserAccount((prev) => ({
          ...prev,
          name: payload.user.name,
          email: payload.user.email,
          password: '',
          confirmPassword: '',
        }))
        setWorkspace({
          name: payload.account.name,
          slug: payload.account.slug,
          role: payload.account.role,
        })
        if (typeof window !== 'undefined') {
          localStorage.setItem('userAccount', JSON.stringify({
            name: payload.user.name,
            email: payload.user.email,
            password: '',
            confirmPassword: '',
          }))
        }
      })
      .catch((err) => setAccountError(err instanceof Error ? err.message : 'Failed to load account settings.'))
      .finally(() => setLoadingAccount(false))
  }, [])

  useEffect(() => {
    fetch('/api/account/members')
      .then((r) => r.json())
      .then((data: MembersPayload | { error?: string }) => {
        if ('error' in data && data.error) throw new Error(data.error)
        const payload = data as MembersPayload
        setMembers(payload.members)
        setInvitations(payload.invitations)
      })
      .catch((err) => setMembersError(err instanceof Error ? err.message : 'Failed to load members.'))
      .finally(() => setLoadingMembers(false))
  }, [])

  function applyMembersPayload(payload: MembersPayload) {
    setMembers(payload.members)
    setInvitations(payload.invitations)
  }

  async function inviteMember() {
    setSavingMembers(true)
    setMembersError(null)
    setMembersMessage(null)
    try {
      const res = await fetch('/api/account/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to invite member.')
      applyMembersPayload(data as MembersPayload)
      setInviteEmail('')
      setInviteRole('member')
      setMembersMessage('Invitation created.')
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Failed to invite member.')
    } finally {
      setSavingMembers(false)
    }
  }

  async function updateMemberRole(membershipId: string, role: string) {
    setSavingMembers(true)
    setMembersError(null)
    try {
      const res = await fetch('/api/account/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update role.')
      applyMembersPayload(data as MembersPayload)
      setMembersMessage('Role updated.')
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Failed to update role.')
    } finally {
      setSavingMembers(false)
    }
  }

  async function removeMember(params: { membershipId?: string; invitationId?: string }) {
    setSavingMembers(true)
    setMembersError(null)
    try {
      const query = new URLSearchParams()
      if (params.membershipId) query.set('membershipId', params.membershipId)
      if (params.invitationId) query.set('invitationId', params.invitationId)
      const res = await fetch(`/api/account/members?${query.toString()}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to remove access.')
      applyMembersPayload(data as MembersPayload)
      setMembersMessage(params.invitationId ? 'Invitation cancelled.' : 'Member removed.')
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Failed to remove access.')
    } finally {
      setSavingMembers(false)
    }
  }

  const handleApiKeyChange = (key: keyof ApiKeys, value: string) => {
    setApiKeys((prev) => ({ ...prev, [key]: value }))
  }

  const handleUserChange = (key: keyof UserAccount, value: string) => {
    setUserAccount((prev) => {
      const next = { ...prev, [key]: value }
      if (typeof window !== 'undefined') localStorage.setItem('userAccount', JSON.stringify(next))
      return next
    })
  }

  const handlePreferenceChange = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value }
      if (typeof window !== 'undefined') {
        localStorage.setItem('workspacePreferences', JSON.stringify(next))
      }
      return next
    })
  }

  const saveSettings = () => {
    if (userAccount.password && userAccount.password !== userAccount.confirmPassword) {
      setAccountError('Passwords do not match.')
      setAccountMessage(null)
      return
    }

    setSavingAccount(true)
    setAccountError(null)
    setAccountMessage(null)

    Promise.allSettled([
      fetch('/api/account/context', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userAccount.name,
          email: userAccount.email,
          password: userAccount.password || undefined,
          accountName: workspace.name,
        }),
      }).then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? 'Failed to save account settings.')
        return data as AccountContextPayload
      }),
      fetch('/api/account/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKeys,
          preferences,
        }),
      }).then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? 'Failed to save workspace settings.')
        return data as AccountSettingsPayload
      }),
    ])
      .then(([accountResult, settingsResult]) => {
        if (accountResult.status === 'fulfilled') {
          const data = accountResult.value
          setUserAccount((prev) => ({
            ...prev,
            name: data.user.name,
            email: data.user.email,
            password: '',
            confirmPassword: '',
          }))
          setWorkspace({
            name: data.account.name,
            slug: data.account.slug,
            role: data.account.role,
          })
          if (typeof window !== 'undefined') {
            localStorage.setItem('userAccount', JSON.stringify({
              name: data.user.name,
              email: data.user.email,
              password: '',
              confirmPassword: '',
            }))
          }
        }

        if (settingsResult.status === 'fulfilled') {
          const settings = settingsResult.value
          setApiKeys(settings.apiKeys)
          setPreferences(settings.preferences)
          if (typeof window !== 'undefined') {
            localStorage.setItem('workspacePreferences', JSON.stringify(settings.preferences))
          }
        }

        const accountErrorMessage = accountResult.status === 'rejected' ? accountResult.reason : null
        const settingsErrorMessage = settingsResult.status === 'rejected' ? settingsResult.reason : null

        if (accountErrorMessage && settingsErrorMessage) {
          throw new Error(
            `${accountErrorMessage instanceof Error ? accountErrorMessage.message : 'Failed to save account settings.'} ${settingsErrorMessage instanceof Error ? settingsErrorMessage.message : 'Failed to save workspace settings.'}`.trim(),
          )
        }

        if (accountErrorMessage) {
          setAccountMessage('Workspace settings saved, but account details could not be updated.')
          setAccountError(accountErrorMessage instanceof Error ? accountErrorMessage.message : 'Failed to save account settings.')
          return
        }

        if (settingsErrorMessage) {
          setAccountMessage('Account details saved, but workspace settings could not be updated.')
          setAccountError(settingsErrorMessage instanceof Error ? settingsErrorMessage.message : 'Failed to save workspace settings.')
          return
        }

        setUserAccount((prev) => ({
          ...prev,
          password: '',
          confirmPassword: '',
        }))
        setAccountMessage('Settings saved.')
      })
      .catch((err) => setAccountError(err instanceof Error ? err.message : 'Failed to save settings.'))
      .finally(() => setSavingAccount(false))
  }

  const logout = () => {
    supabase.auth.signOut().finally(async () => {
      await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' })
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Settings</h1>
        <p className="text-[var(--text-muted)] mt-1">Configure API keys, user account, and system preferences</p>
      </div>

      {/* API Configuration */}
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Configuration
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Manage API keys for external services used by the system
          </p>
        </div>
        <div className="space-y-4">
          {loadingSettings && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />Loading workspace settings…
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="anthropic" className="text-[var(--text-secondary)] flex items-center gap-2 text-sm font-medium">
                <Bot className="w-4 h-4" />
                Anthropic API Key
              </label>
              <input
                id="anthropic"
                type="password"
                value={apiKeys.anthropic}
                onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="supabaseUrl" className="text-[var(--text-secondary)] flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4" />
                Supabase URL
              </label>
              <input
                id="supabaseUrl"
                value={apiKeys.supabaseUrl}
                onChange={(e) => handleApiKeyChange('supabaseUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="supabaseAnon" className="text-[var(--text-secondary)] text-sm font-medium">
                Supabase Anon Key
              </label>
              <input
                id="supabaseAnon"
                type="password"
                value={apiKeys.supabaseAnon}
                onChange={(e) => handleApiKeyChange('supabaseAnon', e.target.value)}
                placeholder="eyJ..."
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="supabaseService" className="text-[var(--text-secondary)] text-sm font-medium">
                Supabase Service Role Key
              </label>
              <input
                id="supabaseService"
                type="password"
                value={apiKeys.supabaseService}
                onChange={(e) => handleApiKeyChange('supabaseService', e.target.value)}
                placeholder="eyJ..."
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="googleMaps" className="text-[var(--text-secondary)] text-sm font-medium">
                Google Maps API Key
              </label>
              <input
                id="googleMaps"
                type="password"
                value={apiKeys.googleMaps}
                onChange={(e) => handleApiKeyChange('googleMaps', e.target.value)}
                placeholder="AIza..."
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="emailApi" className="text-[var(--text-secondary)] flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4" />
                Email API Key
              </label>
              <input
                id="emailApi"
                type="password"
                value={apiKeys.emailApi}
                onChange={(e) => handleApiKeyChange('emailApi', e.target.value)}
                placeholder="SG...."
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="scrapingApi" className="text-[var(--text-secondary)] text-sm font-medium">
                Scraping API Key
              </label>
              <input
                id="scrapingApi"
                type="password"
                value={apiKeys.scrapingApi}
                onChange={(e) => handleApiKeyChange('scrapingApi', e.target.value)}
                placeholder="..."
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="automationApi" className="text-[var(--text-secondary)] flex items-center gap-2 text-sm font-medium">
                <Zap className="w-4 h-4" />
                Automation API Key
              </label>
              <input
                id="automationApi"
                type="password"
                value={apiKeys.automationApi}
                onChange={(e) => handleApiKeyChange('automationApi', e.target.value)}
                placeholder="..."
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-5 h-5" />
            Workspace Access
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Invite teammates and manage roles for this workspace.
          </p>
        </div>

        <div className="space-y-4">
          {(workspace.role === 'owner' || workspace.role === 'admin') && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button onClick={inviteMember} disabled={savingMembers || !inviteEmail.trim()}>
                {savingMembers ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Invite
              </Button>
            </div>
          )}

          {membersError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {membersError}
            </div>
          )}
          {membersMessage && (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
              {membersMessage}
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm font-medium text-[var(--text-secondary)]">Members</div>
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin" />Loading members…
              </div>
            ) : members.length === 0 ? (
              <div className="text-sm text-[var(--text-subtle)]">No members yet.</div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex flex-col md:flex-row md:items-center gap-3 justify-between rounded-md border border-[var(--panel-border)] bg-[var(--panel-bg-muted)] px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">{member.name}</div>
                      <div className="text-xs text-[var(--text-subtle)]">{member.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(workspace.role === 'owner' || workspace.role === 'admin') ? (
                        <select
                          value={member.role}
                          onChange={(e) => updateMemberRole(member.id, e.target.value)}
                          className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] capitalize">{member.role}</span>
                      )}
                      {(workspace.role === 'owner' || workspace.role === 'admin') && (
                        <button
                          onClick={() => removeMember({ membershipId: member.id })}
                          className="p-2 rounded-md border border-red-500/20 text-red-400 hover:bg-red-500/10"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-[var(--text-secondary)]">Pending Invitations</div>
            {invitations.length === 0 ? (
              <div className="text-sm text-[var(--text-subtle)]">No pending invitations.</div>
            ) : (
              <div className="space-y-2">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between rounded-md border border-[var(--panel-border)] bg-[var(--panel-bg-muted)] px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">{invite.email}</div>
                      <div className="text-xs text-[var(--text-subtle)] capitalize">{invite.role} • {invite.status}</div>
                    </div>
                    {(workspace.role === 'owner' || workspace.role === 'admin') && (
                      <button
                        onClick={() => removeMember({ invitationId: invite.id })}
                        className="p-2 rounded-md border border-red-500/20 text-red-400 hover:bg-red-500/10"
                        title="Cancel invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Account */}
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <User className="w-5 h-5" />
            User Account
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Manage your account information and security settings
          </p>
        </div>
        <div className="space-y-4">
          {loadingAccount && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />Loading account settings…
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-[var(--text-secondary)] text-sm font-medium">Full Name</label>
              <input
                id="name"
                value={userAccount.name}
                onChange={(e) => handleUserChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-[var(--text-secondary)] text-sm font-medium">Email Address</label>
              <input
                id="email"
                type="email"
                value={userAccount.email}
                onChange={(e) => handleUserChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-[var(--text-secondary)] text-sm font-medium">New Password</label>
              <input
                id="password"
                type="password"
                value={userAccount.password}
                onChange={(e) => handleUserChange('password', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-[var(--text-secondary)] text-sm font-medium">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={userAccount.confirmPassword}
                onChange={(e) => handleUserChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <hr className="border-[var(--panel-border)]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="workspaceName" className="text-[var(--text-secondary)] text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Workspace Name
              </label>
              <input
                id="workspaceName"
                value={workspace.name}
                onChange={(e) => setWorkspace((prev) => ({ ...prev, name: e.target.value }))}
                disabled={workspace.role !== 'owner' && workspace.role !== 'admin'}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-subtle)] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="workspaceRole" className="text-[var(--text-secondary)] text-sm font-medium">Workspace Role</label>
              <input
                id="workspaceRole"
                value={`${workspace.role} • ${workspace.slug}`}
                disabled
                className="w-full px-3 py-2 bg-[var(--input-bg-muted)] border border-[var(--input-border)] rounded-md text-[var(--text-muted)]"
              />
            </div>
          </div>
          {accountError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {accountError}
            </div>
          )}
          {accountMessage && (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
              {accountMessage}
            </div>
          )}
          <hr className="border-[var(--panel-border)]" />
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            System Preferences
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Customize system behavior and appearance
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-[var(--text-secondary)] text-sm font-medium">Theme</label>
              <p className="text-sm text-[var(--text-subtle)]">Choose your preferred theme</p>
            </div>
            <select
              value={preferences.theme}
              onChange={(e) => handlePreferenceChange('theme', e.target.value as Preferences['theme'])}
              className="w-32 px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <hr className="border-[var(--panel-border)]" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-[var(--text-secondary)] text-sm font-medium">Email Notifications</label>
              <p className="text-sm text-[var(--text-subtle)]">Receive email notifications for important events</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-[var(--input-bg)] border-[var(--input-border)] rounded focus:ring-indigo-500"
            />
          </div>
          <hr className="border-[var(--panel-border)]" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-[var(--text-secondary)] text-sm font-medium">Data Retention</label>
              <p className="text-sm text-[var(--text-subtle)]">How long to keep historical data (days)</p>
            </div>
            <select
              value={preferences.dataRetention}
              onChange={(e) => handlePreferenceChange('dataRetention', e.target.value)}
              className="w-32 px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={savingAccount} className="bg-indigo-600 hover:bg-indigo-700">
          {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
