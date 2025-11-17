'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Coins, 
  Zap, 
  TrendingUp, 
  Calendar, 
  Award,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { SubscriptionManagement } from '@/components/subscription-management'
import { CREDIT_COSTS } from '@/lib/credits'
import Link from 'next/link'

interface CreditInfo {
  currentCredits: number
  lifetimeCreditsUsed: number
  creditsRefreshDate: string | null
  subscriptionPlan: string
}

export default function StudentSettings() {
  const { data: session } = useSession()
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreditInfo()
  }, [])

  const fetchCreditInfo = async () => {
    try {
      const response = await fetch('/api/student/credits')
      if (response.ok) {
        const data = await response.json()
        setCreditInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch credit info:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bidaaya-accent"></div>
      </div>
    )
  }

  const isPaidPlan = creditInfo?.subscriptionPlan !== 'FREE'
  const nextRefresh = creditInfo?.creditsRefreshDate 
    ? new Date(creditInfo.creditsRefreshDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Not set'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings & Subscription</h1>
          <p className="mt-2 text-gray-600">
            Manage your credits, subscription, and account preferences
          </p>
        </div>

        {/* Credits Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-bidaaya-accent to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Coins className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-white/80 text-sm">Available Credits</p>
                <p className="text-4xl font-bold">{creditInfo?.currentCredits || 0}</p>
              </div>
            </div>
            
            {isPaidPlan && (
              <div className="text-right">
                <div className="flex items-center text-white/90 mb-1">
                  <Sparkles className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Premium Member</span>
                </div>
                <p className="text-xs text-white/70">
                  Next refresh: {nextRefresh}
                </p>
              </div>
            )}
          </div>

          {/* Credit Usage Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
            <div>
              <div className="flex items-center text-white/80 text-sm mb-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                Lifetime Used
              </div>
              <p className="text-2xl font-semibold">{creditInfo?.lifetimeCreditsUsed || 0}</p>
            </div>
            <div>
              <div className="flex items-center text-white/80 text-sm mb-1">
                <Calendar className="h-4 w-4 mr-1" />
                Plan
              </div>
              <p className="text-lg font-semibold">
                {creditInfo?.subscriptionPlan === 'FREE' ? 'Free' : 
                 creditInfo?.subscriptionPlan === 'STUDENT_PREMIUM' ? 'Premium' :
                 creditInfo?.subscriptionPlan === 'STUDENT_PRO' ? 'Pro' :
                 creditInfo?.subscriptionPlan}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Credit Costs Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            How Credits Work
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Early Access Unlock</p>
                  <p className="text-sm text-gray-500">Unlock any opportunity 24hrs before public release</p>
                </div>
              </div>
              <span className="text-xl font-bold text-purple-600">{CREDIT_COSTS.EARLY_ACCESS}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Custom CV Generation</p>
                  <p className="text-sm text-gray-500">AI-powered CV tailored to each opportunity</p>
                </div>
              </div>
              <span className="text-xl font-bold text-blue-600">{CREDIT_COSTS.CUSTOM_CV}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Custom Cover Letter</p>
                  <p className="text-sm text-gray-500">Personalized cover letter for applications</p>
                </div>
              </div>
              <span className="text-xl font-bold text-green-600">{CREDIT_COSTS.CUSTOM_COVER_LETTER}</span>
            </div>
          </div>

          {/* Pro Tier Callout */}
          {creditInfo?.subscriptionPlan !== 'STUDENT_PRO' && (
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start">
                <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-purple-900">Unlock Unlimited Early Access</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Pro members get free early access to ALL new opportunities without spending credits!
                  </p>
                  <Link 
                    href="/subscription" 
                    className="inline-flex items-center mt-3 text-sm font-medium text-purple-600 hover:text-purple-700"
                  >
                    Upgrade to Pro
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Subscription Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SubscriptionManagement />
        </motion.div>

        {/* Need More Credits CTA */}
        {!isPaidPlan && (creditInfo?.currentCredits || 0) < 10 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white text-center"
          >
            <Coins className="h-12 w-12 mx-auto mb-3 opacity-90" />
            <h3 className="text-xl font-bold mb-2">Running Low on Credits?</h3>
            <p className="text-white/90 mb-4">
              Upgrade to Premium or Pro to get 100-200 credits per month and unlock premium features!
            </p>
            <Link
              href="/subscription"
              className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              View Plans
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

