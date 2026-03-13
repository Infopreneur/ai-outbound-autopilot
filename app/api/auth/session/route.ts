import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth/cookies'

function clearCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const accessToken = typeof body.access_token === 'string' ? body.access_token : ''
  const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : ''
  const expiresAt = typeof body.expires_at === 'number' ? body.expires_at : null

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'Missing session tokens.' }, { status: 422 })
  }

  const response = NextResponse.json({ ok: true })
  const maxAge = expiresAt ? Math.max(60, expiresAt - Math.floor(Date.now() / 1000)) : 60 * 60

  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  clearCookies(response)
  return response
}
