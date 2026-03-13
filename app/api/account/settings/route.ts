import { NextRequest, NextResponse } from 'next/server'
import { getAccountContext } from '@/lib/auth/server'
import { requireAnyRole } from '@/lib/auth/permissions'
import { getUserSupabaseClient } from '@/lib/supabase/user-server'

const DEFAULT_API_KEYS = {
  anthropic: '',
  supabaseUrl: '',
  supabaseAnon: '',
  supabaseService: '',
  googleMaps: '',
  emailApi: '',
  scrapingApi: '',
  automationApi: '',
}

const DEFAULT_PREFERENCES = {
  theme: 'dark',
  notifications: true,
  dataRetention: '90',
}

export async function GET() {
  const ctx = await getAccountContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getUserSupabaseClient(ctx.accessToken)
  const { data, error } = await supabase
    .from('account_settings')
    .select('api_keys, preferences')
    .eq('account_id', ctx.accountId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    apiKeys: { ...DEFAULT_API_KEYS, ...(data?.api_keys ?? {}) },
    preferences: { ...DEFAULT_PREFERENCES, ...(data?.preferences ?? {}) },
  })
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

  const apiKeys = typeof body.apiKeys === 'object' && body.apiKeys !== null ? body.apiKeys : {}
  const preferences = typeof body.preferences === 'object' && body.preferences !== null ? body.preferences : {}

  const supabase = getUserSupabaseClient(ctx.accessToken)
  const payload = {
    account_id: ctx.accountId,
    api_keys: { ...DEFAULT_API_KEYS, ...(apiKeys as Record<string, unknown>) },
    preferences: { ...DEFAULT_PREFERENCES, ...(preferences as Record<string, unknown>) },
    updated_by_user_id: ctx.user.id,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('account_settings')
    .upsert(payload, { onConflict: 'account_id' })
    .select('api_keys, preferences')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    apiKeys: { ...DEFAULT_API_KEYS, ...(data.api_keys ?? {}) },
    preferences: { ...DEFAULT_PREFERENCES, ...(data.preferences ?? {}) },
  })
}
