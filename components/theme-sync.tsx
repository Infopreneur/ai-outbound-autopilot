'use client'

import { useEffect } from 'react'

type StoredPreferences = {
  theme?: 'light' | 'dark' | 'system'
}

function applyTheme(theme: StoredPreferences['theme']) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.add(prefersDark ? 'dark' : 'light')
    return
  }

  root.classList.add(theme === 'light' ? 'light' : 'dark')
}

export function ThemeSync() {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('workspacePreferences')
      if (raw) {
        const parsed = JSON.parse(raw) as StoredPreferences
        applyTheme(parsed.theme)
      } else {
        applyTheme('dark')
      }
    } catch {
      applyTheme('dark')
    }

    fetch('/api/account/settings')
      .then((response) => response.json())
      .then((data) => {
        const theme = typeof data?.preferences?.theme === 'string' ? data.preferences.theme as StoredPreferences['theme'] : 'dark'
        window.localStorage.setItem('workspacePreferences', JSON.stringify(data.preferences ?? { theme }))
        applyTheme(theme)
      })
      .catch(() => {})
  }, [])

  return null
}
