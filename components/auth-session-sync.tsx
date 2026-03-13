'use client'

import { useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

async function persistSession(session: Session | null) {
  if (!session) {
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
    })
    return
  }

  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    }),
  })
}

export function AuthSessionSync() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      void persistSession(data.session)
    }).catch(() => {})

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void persistSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return null
}
