'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Crown, X, ArrowRight, Zap } from 'lucide-react'
import { SubscriptionManager } from '@/lib/subscription-manager'
import { getPlansByRole } from '@/lib/subscription-config'

interface UpgradePromptProps {
  reason: string
  onClose?: () => void
  compact?: boolean
}

export function UpgradePrompt({ reason, onClose, compact = false }: UpgradePromptProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)

  if (!session?.user || !isVisible) return null

  const userRole = session.user.role as 'STUDENT' | 'COMPANY'
  const currentPlan = (session.user as any).subscriptionPlan || 'FREE'
  
  // Hide upgrade prompt if user already has a paid plan
  if (currentPlan !== 'FREE') {
    console.log(`🎯 User has plan ${currentPlan}, hiding upgrade prompt`)
    return null
  }
  
  const currentTier = getSubscriptionTier(currentPlan, userRole)
  const upgradeMessage = getUpgradePrompt(currentPlan, userRole)

  const handleUpgrade = () => {
    router.push('/subscription')
  }

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">{reason}</p>
              <p className="text-xs text-amber-600">{upgradeMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpgrade}
              className="px-3 py-1 text-xs font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
            >
              Upgrade
            </button>
            <button
              onClick={handleClose}
              className="text-amber-400 hover:text-amber-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {userRole === 'STUDENT' ? 'Upgrade Your Plan' : 'Upgrade Your Company Plan'}
          </h3>
          
          <p className="text-gray-600 mb-1">{reason}</p>
          <p className="text-sm text-gray-500 mb-6">{upgradeMessage}</p>

          {currentTier && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Plan:</span>
                <span className="font-medium text-gray-900">{currentTier.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Applications/Month:</span>
                <span className="font-medium text-gray-900">
                  {currentTier.applicationsPerMonth === -1 ? 'Unlimited' : currentTier.applicationsPerMonth}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-colors font-medium"
            >
              <Zap className="h-4 w-4" />
              Upgrade Now
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Usage stats component for dashboard
export function UsageStatsCard() {
  const { data: session } = useSession()
  const [limits, setLimits] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    fetchApplicationLimits()
  }, [])

  const fetchApplicationLimits = async () => {
    try {
      const response = await fetch('/api/user/limits')
      if (response.ok) {
        const data = await response.json()
        setLimits(data.limits)
      }
    } catch (error) {
      console.error('Error fetching application limits:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!session?.user || isLoading) return null

  const userRole = session.user.role as 'STUDENT' | 'COMPANY'
  const currentPlan = (session.user as any).subscriptionPlan || 'FREE'
  const userData = {
    id: (session.user as any).id || '',
    role: userRole,
    subscriptionPlan: currentPlan,
    subscriptionStatus: (session.user as any).subscriptionStatus
  }
  const currentTier = SubscriptionManager.getUserPlan(userData)

  if (!currentTier || !limits) return null

  const maxApplications = limits.maxApplications
  const applicationsUsed = limits.applicationsUsed
  const applicationsRemaining = limits.applicationsRemaining

  const usagePercentage = maxApplications === -1 
    ? 0 
    : (applicationsUsed / maxApplications) * 100

  const isNearLimit = usagePercentage >= 80
  const isOverLimit = usagePercentage >= 100

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Plan Usage</h3>
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">{currentTier.name}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Applications this month</span>
            <span className="font-medium">
              {applicationsUsed} / {maxApplications === -1 ? '∞' : maxApplications}
            </span>
          </div>
          
          {maxApplications !== -1 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverLimit 
                    ? 'bg-red-500' 
                    : isNearLimit 
                    ? 'bg-amber-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          )}
          
          {limits.nextResetDate && (
            <p className="text-xs text-gray-500 mt-2">
              Resets {new Date(limits.nextResetDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {isNearLimit && !isOverLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <Crown className="h-4 w-4" />
              <span>You're approaching your monthly limit!</span>
            </div>
          </div>
        )}

        {isOverLimit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-800 text-sm">
              <X className="h-4 w-4" />
              <span>You've reached your monthly limit.</span>
            </div>
          </div>
        )}

        <button
          onClick={() => window.location.href = '/subscription'}
          className="w-full py-2 px-4 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          {currentTier.price === 0 ? 'Upgrade Plan' : 'Manage Subscription'}
        </button>
      </div>
    </div>
  )
} 