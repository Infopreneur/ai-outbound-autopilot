import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AuthSessionSync } from '@/components/auth-session-sync'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AI Outbound Autopilot',
  description: 'AI-powered outbound sales automation platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthSessionSync />
        {children}
      </body>
    </html>
  )
}
