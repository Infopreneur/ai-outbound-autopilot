'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Key, User, Settings as SettingsIcon, Mail, Globe, Bot, Zap } from 'lucide-react'

export default function SystemSettingsPage() {
  // API Keys
  const [apiKeys, setApiKeys] = useState({
    anthropic: '',
    supabaseUrl: '',
    supabaseAnon: '',
    supabaseService: '',
    googleMaps: '',
    emailApi: '',
    scrapingApi: '',
    automationApi: '',
  })

  // User Account
  const [userAccount, setUserAccount] = useState({
    name: 'Alex Kim',
    email: 'alex@company.com',
    password: '',
    confirmPassword: '',
  })

  // System Preferences
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    notifications: true,
    dataRetention: '90',
  })

  const handleApiKeyChange = (key: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [key]: value }))
  }

  const handleUserChange = (key: string, value: string) => {
    setUserAccount(prev => ({ ...prev, [key]: value }))
  }

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const saveSettings = () => {
    // In a real app, this would save to backend
    alert('Settings saved! (This is a demo - in production, this would update your backend)')
    console.log('API Keys:', apiKeys)
    console.log('User Account:', userAccount)
    console.log('Preferences:', preferences)
  }

  const logout = () => {
    // In a real app, this would log out the user
    alert('Logged out! (Demo)')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-slate-400 mt-1">Configure API keys, user account, and system preferences</p>
      </div>

      {/* API Configuration */}
      <div className="bg-[#0f0f23] border border-[#1e1e38] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Configuration
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage API keys for external services used by the system
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="anthropic" className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                <Bot className="w-4 h-4" />
                Anthropic API Key
              </label>
              <input
                id="anthropic"
                type="password"
                value={apiKeys.anthropic}
                onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="supabaseUrl" className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4" />
                Supabase URL
              </label>
              <input
                id="supabaseUrl"
                value={apiKeys.supabaseUrl}
                onChange={(e) => handleApiKeyChange('supabaseUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="supabaseAnon" className="text-slate-300 text-sm font-medium">
                Supabase Anon Key
              </label>
              <input
                id="supabaseAnon"
                type="password"
                value={apiKeys.supabaseAnon}
                onChange={(e) => handleApiKeyChange('supabaseAnon', e.target.value)}
                placeholder="eyJ..."
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="supabaseService" className="text-slate-300 text-sm font-medium">
                Supabase Service Role Key
              </label>
              <input
                id="supabaseService"
                type="password"
                value={apiKeys.supabaseService}
                onChange={(e) => handleApiKeyChange('supabaseService', e.target.value)}
                placeholder="eyJ..."
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="googleMaps" className="text-slate-300 text-sm font-medium">
                Google Maps API Key
              </label>
              <input
                id="googleMaps"
                type="password"
                value={apiKeys.googleMaps}
                onChange={(e) => handleApiKeyChange('googleMaps', e.target.value)}
                placeholder="AIza..."
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="emailApi" className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4" />
                Email API Key
              </label>
              <input
                id="emailApi"
                type="password"
                value={apiKeys.emailApi}
                onChange={(e) => handleApiKeyChange('emailApi', e.target.value)}
                placeholder="SG...."
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="scrapingApi" className="text-slate-300 text-sm font-medium">
                Scraping API Key
              </label>
              <input
                id="scrapingApi"
                type="password"
                value={apiKeys.scrapingApi}
                onChange={(e) => handleApiKeyChange('scrapingApi', e.target.value)}
                placeholder="..."
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="automationApi" className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                <Zap className="w-4 h-4" />
                Automation API Key
              </label>
              <input
                id="automationApi"
                type="password"
                value={apiKeys.automationApi}
                onChange={(e) => handleApiKeyChange('automationApi', e.target.value)}
                placeholder="..."
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* User Account */}
      <div className="bg-[#0f0f23] border border-[#1e1e38] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            User Account
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage your account information and security settings
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-slate-300 text-sm font-medium">Full Name</label>
              <input
                id="name"
                value={userAccount.name}
                onChange={(e) => handleUserChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-slate-300 text-sm font-medium">Email Address</label>
              <input
                id="email"
                type="email"
                value={userAccount.email}
                onChange={(e) => handleUserChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-slate-300 text-sm font-medium">New Password</label>
              <input
                id="password"
                type="password"
                value={userAccount.password}
                onChange={(e) => handleUserChange('password', e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={userAccount.confirmPassword}
                onChange={(e) => handleUserChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <hr className="border-[#1e1e38]" />
          <Button variant="outline" onClick={logout} className="border-[#2a2a4e] text-slate-300 hover:bg-[#1a1a2e]">
            Logout
          </Button>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-[#0f0f23] border border-[#1e1e38] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            System Preferences
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Customize system behavior and appearance
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-slate-300 text-sm font-medium">Theme</label>
              <p className="text-sm text-slate-500">Choose your preferred theme</p>
            </div>
            <select
              value={preferences.theme}
              onChange={(e) => handlePreferenceChange('theme', e.target.value)}
              className="w-32 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <hr className="border-[#1e1e38]" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-slate-300 text-sm font-medium">Email Notifications</label>
              <p className="text-sm text-slate-500">Receive email notifications for important events</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-[#1a1a2e] border-[#2a2a4e] rounded focus:ring-indigo-500"
            />
          </div>
          <hr className="border-[#1e1e38]" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-slate-300 text-sm font-medium">Data Retention</label>
              <p className="text-sm text-slate-500">How long to keep historical data (days)</p>
            </div>
            <select
              value={preferences.dataRetention}
              onChange={(e) => handlePreferenceChange('dataRetention', e.target.value)}
              className="w-32 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <Button onClick={saveSettings} className="bg-indigo-600 hover:bg-indigo-700">
          Save Settings
        </Button>
      </div>
    </div>
  )
}