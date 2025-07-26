"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSessionRefresh } from '@/lib/session-utils'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Shield, 
  Clock, 
  MessageSquare, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface SubscriptionStatus {
  subscriptionPlan: string
  subscriptionStatus: string
  hasStripeSubscription: boolean
  hasStripeCustomer: boolean
  role: string
}

interface ManagementOptions {
  canUseStripePortal: boolean
  canDowngradeImmediately: boolean
  canUpgrade: boolean
}

export function SubscriptionManagement() {
  const { data: session } = useSession()
  const { refreshSession } = useSessionRefresh()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [options, setOptions] = useState<ManagementOptions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showDowngradeForm, setShowDowngradeForm] = useState(false)
  const [showRefundInfo, setShowRefundInfo] = useState(false)
  const [confirmDowngrade, setConfirmDowngrade] = useState(false)
  const [downgradeReason, setDowngradeReason] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_status' })
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data.user)
        setOptions(data.managementOptions)
      } else {
        setMessage({ type: 'error', text: 'Failed to load subscription status' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load subscription status' })
    }
  }

  const handleStripePortal = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stripe_portal' })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.open(data.url, '_blank')
          setMessage({ type: 'info', text: 'Opened Stripe Customer Portal in new tab' })
        }
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to open Stripe portal' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDowngradeToFree = async () => {
    if (!confirmDowngrade) {
      setMessage({ type: 'error', text: 'Please confirm that you want to downgrade' })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'downgrade_to_free', 
          confirmDowngrade: true,
          reason: downgradeReason 
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: data.message })
        setShowDowngradeForm(false)
        
        // Refresh session to show updated plan
        await refreshSession()
        await fetchSubscriptionStatus()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to downgrade subscription' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePauseSubscription = async () => {
    if (!confirm('Are you sure you want to pause your subscription for 30 days?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause_subscription' })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: data.message })
        await fetchSubscriptionStatus()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to pause subscription' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestRefund = async () => {
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_refund' })
      })

      if (response.ok) {
        const data = await response.json()
        setShowRefundInfo(true)
        setMessage({ type: 'info', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to get refund information' })
    }
  }

  if (!session?.user || !status) {
    return null
  }

  const isPaidPlan = status.subscriptionPlan !== 'FREE'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Subscription Management</h2>

      {/* Message Display */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          <div className="flex items-center">
            {message.type === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
            {message.type === 'error' && <AlertTriangle className="h-4 w-4 mr-2" />}
            <span className="text-sm">{message.text}</span>
          </div>
        </motion.div>
      )}

      {/* Current Plan Status */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Current Plan</h3>
            <p className="text-gray-600">
              <span className="font-semibold text-blue-600">
                {status.subscriptionPlan === 'FREE' ? 'Free Plan' : 
                 status.subscriptionPlan === 'STUDENT_PREMIUM' ? 'Student Premium' :
                 status.subscriptionPlan === 'STUDENT_PRO' ? 'Student Pro' :
                 status.subscriptionPlan === 'COMPANY_BASIC' ? 'Company Basic' :
                 status.subscriptionPlan === 'COMPANY_PRO' ? 'Company Pro' :
                 status.subscriptionPlan === 'COMPANY_PREMIUM' ? 'Company Premium' :
                 status.subscriptionPlan}
              </span>
              <span className="ml-2 text-sm">
                ({status.subscriptionStatus === 'ACTIVE' ? 'Active' : status.subscriptionStatus})
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {status.hasStripeSubscription ? 'Stripe Subscription' : 'Direct Plan'}
            </div>
          </div>
        </div>
      </div>

      {/* Management Options */}
      <div className="space-y-4">
        {/* Stripe Customer Portal */}
        {options?.canUseStripePortal && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStripePortal}
            disabled={isLoading}
            className="w-full flex items-center justify-between p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Full Subscription Management</div>
                <div className="text-sm text-gray-600">
                  Update payment method, view billing history, change plan
                </div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </motion.button>
        )}

        {/* Immediate Downgrade to Free */}
        {options?.canDowngradeImmediately && (
          <div className="border border-orange-200 rounded-lg">
            <button
              onClick={() => setShowDowngradeForm(!showDowngradeForm)}
              className="w-full flex items-center justify-between p-4 hover:bg-orange-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <Shield className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Downgrade to Free Plan</div>
                  <div className="text-sm text-gray-600">
                    Cancel subscription and switch to free plan immediately
                  </div>
                </div>
              </div>
              {showDowngradeForm ? 
                <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                <ChevronDown className="h-4 w-4 text-gray-400" />
              }
            </button>

            {showDowngradeForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-orange-200 p-4 bg-orange-25"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Help us improve - Why are you downgrading? (Optional)
                    </label>
                    <select
                      value={downgradeReason}
                      onChange={(e) => setDowngradeReason(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select a reason...</option>
                      <option value="too_expensive">Too expensive</option>
                      <option value="not_using_features">Not using the features</option>
                      <option value="found_alternative">Found alternative solution</option>
                      <option value="temporary_break">Taking a temporary break</option>
                      <option value="technical_issues">Technical issues</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="confirm-downgrade"
                      checked={confirmDowngrade}
                      onChange={(e) => setConfirmDowngrade(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="confirm-downgrade" className="text-sm text-gray-700">
                      I understand I'll lose premium features but keep core functionality
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDowngradeToFree}
                      disabled={!confirmDowngrade || isLoading}
                      className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isLoading ? 'Processing...' : 'Confirm Downgrade'}
                    </button>
                    <button
                      onClick={() => setShowDowngradeForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Pause Subscription */}
        {status.hasStripeSubscription && isPaidPlan && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePauseSubscription}
            disabled={isLoading}
            className="w-full flex items-center justify-between p-4 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Pause Subscription</div>
                <div className="text-sm text-gray-600">
                  Pause billing for 30 days, resume anytime
                </div>
              </div>
            </div>
          </motion.button>
        )}

        {/* Request Refund */}
        {isPaidPlan && (
          <div className="border border-purple-200 rounded-lg">
            <button
              onClick={handleRequestRefund}
              className="w-full flex items-center justify-between p-4 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Request Refund</div>
                  <div className="text-sm text-gray-600">
                    Get help with refunds from our support team
                  </div>
                </div>
              </div>
            </button>

            {showRefundInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t border-purple-200 p-4 bg-purple-25"
              >
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">How to Request a Refund:</h4>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Email us at <strong>support@bidaaya.co</strong></li>
                    <li>Include your account email and reason for refund</li>
                    <li>We typically respond within 24 hours</li>
                    <li>Refunds are processed within 5-7 business days</li>
                  </ol>
                  <a
                    href="mailto:support@bidaaya.co?subject=Refund Request&body=Account Email: ${session.user?.email}%0A%0AReason for refund:%0A%0A"
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 text-sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Send Email Now
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Free Plan Message */}
      {!isPaidPlan && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <div className="font-medium text-green-800">You're on the Free Plan</div>
              <div className="text-sm text-green-700">
                Enjoying core features at no cost. 
                <a href="/subscription" className="underline ml-1">Upgrade anytime</a> for premium features.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 