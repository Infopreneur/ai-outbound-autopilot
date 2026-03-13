'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, Mail, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

async function persistSession() {
  const { data } = await supabase.auth.getSession()
  if (!data.session) return

  if (typeof window !== 'undefined') {
    const user = data.session.user
    const fallbackName = typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : user.email?.split('@')[0] ?? 'User'
    window.localStorage.setItem('userAccount', JSON.stringify({
      name: fallbackName,
      email: user.email ?? '',
      password: '',
      confirmPassword: '',
    }))
  }

  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    }),
  })
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function getEmailRedirectTo() {
    if (typeof window === 'undefined') return undefined
    return `${window.location.origin}/login`
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return
      router.replace('/command-center')
      router.refresh()
    }).catch(() => {})
  }, [router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'sign-up') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getEmailRedirectTo(),
            data: {
              full_name: name.trim(),
              name: name.trim(),
            },
          },
        })

        if (signUpError) throw signUpError

        if (data.session) {
          await persistSession()
          router.push('/command-center')
          router.refresh()
          return
        }

        setMessage('Check your email to confirm your account, then sign in.')
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      await persistSession()
      router.push('/command-center')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_32%),linear-gradient(180deg,#07070e_0%,#0b1020_100%)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#111120] border border-[#1e1e38] rounded-2xl p-8 shadow-2xl">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Outbound Autopilot</h1>
          <p className="text-sm text-slate-400 mt-2">
            Sign in to access your account-scoped prospecting, outreach, and pipeline workspace.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('sign-in')}
            className={`flex-1 h-10 rounded-lg text-sm font-medium border transition-colors ${mode === 'sign-in' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' : 'bg-[#1a1a30] border-[#252540] text-slate-400'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('sign-up')}
            className={`flex-1 h-10 rounded-lg text-sm font-medium border transition-colors ${mode === 'sign-up' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' : 'bg-[#1a1a30] border-[#252540] text-slate-400'}`}
          >
            Create Account
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'sign-up' && (
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === 'sign-up'}
                  className="w-full h-11 pl-10 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
                  placeholder="Jane Founder"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-11 pl-10 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {message && (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              {message}
            </div>
          )}

          <Button variant="primary" size="md" disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
