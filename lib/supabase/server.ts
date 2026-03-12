import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Lazy singleton — client is created on first use, not at module import time.
// This prevents "supabaseUrl is required" crashes during Next.js static build.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _admin: SupabaseClient<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAdmin(): SupabaseClient<any> {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase env vars are not set (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    _admin = createClient(url, key)
  }
  return _admin
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin = new Proxy({} as SupabaseClient<any>, {
  get(_t, prop, receiver) {
    return Reflect.get(getAdmin(), prop, receiver)
  },
})
