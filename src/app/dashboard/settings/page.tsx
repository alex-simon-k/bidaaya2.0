'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Settings as SettingsIcon, Bell, Shield, User, Globe } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)

  return (
    <div className="min-h-screen w-full bg-bidaaya-dark overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bidaaya-light mb-2">Settings</h1>
          <p className="text-bidaaya-light/60">Manage your account preferences</p>
        </div>

        {/* Account Settings */}
        <div className="bg-bidaaya-light/5 rounded-xl p-6 border border-bidaaya-light/10">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-bidaaya-accent" />
            <h2 className="text-xl font-semibold text-bidaaya-light">Account</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-bidaaya-light/70">Email</label>
              <p className="text-bidaaya-light">{session?.user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-bidaaya-light/70">Name</label>
              <p className="text-bidaaya-light">{session?.user?.name}</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-bidaaya-light/5 rounded-xl p-6 border border-bidaaya-light/10">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-bidaaya-accent" />
            <h2 className="text-xl font-semibold text-bidaaya-light">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-bidaaya-light">Push Notifications</p>
                <p className="text-sm text-bidaaya-light/60">Get notified about new opportunities</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-bidaaya-accent' : 'bg-bidaaya-light/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-bidaaya-light">Email Updates</p>
                <p className="text-sm text-bidaaya-light/60">Receive weekly email summaries</p>
              </div>
              <button
                onClick={() => setEmailUpdates(!emailUpdates)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailUpdates ? 'bg-bidaaya-accent' : 'bg-bidaaya-light/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-bidaaya-light/5 rounded-xl p-6 border border-bidaaya-light/10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-bidaaya-accent" />
            <h2 className="text-xl font-semibold text-bidaaya-light">Privacy</h2>
          </div>
          <div className="space-y-3">
            <p className="text-bidaaya-light/70 text-sm">
              Your data is secure and we never share it without your permission.
            </p>
            <button className="text-bidaaya-accent hover:text-bidaaya-accent/80 text-sm">
              View Privacy Policy →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

