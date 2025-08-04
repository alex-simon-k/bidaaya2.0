'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SubscriptionManager } from '@/lib/subscription-manager'
import { getPlansByRole, getPlanById } from '@/lib/subscription-config'
import { SubscriptionManagement } from '@/components/subscription-management'
import { getCreditAllowance } from '@/lib/pricing'
// Note: Install @heroicons/react for icons: npm install @heroicons/react
// For now, using text symbols as placeholders
const CheckIcon = ({ className }: { className: string }) => <span className={className}>✓</span>
const XMarkIcon = ({ className }: { className: string }) => <span className={className}>✗</span>

export default function SubscriptionPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isYearly, setIsYearly] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const userRole = session.user.role as 'STUDENT' | 'COMPANY'
  const currentPlan = (session.user as any).subscriptionPlan || 'FREE'
  const userData = {
    id: (session.user as any).id || '',
    role: userRole,
    subscriptionPlan: currentPlan,
    subscriptionStatus: (session.user as any).subscriptionStatus
  }
  const availableTiers = getPlansByRole(userRole)
  const currentTier = SubscriptionManager.getUserPlan(userData)

  const handleUpgrade = async (tier: any) => {
    if (!tier) {
      setError('Invalid plan selected. Please try again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Map tier to planId format expected by checkout API
      const planIdMap: Record<string, string> = {
        'STUDENT_PREMIUM': isYearly ? 'student_premium_yearly' : 'student_premium_monthly',
        'STUDENT_PRO': isYearly ? 'student_pro_yearly' : 'student_pro_monthly',
        'COMPANY_BASIC': isYearly ? 'company_basic_yearly' : 'company_basic_monthly',
        'COMPANY_PRO': isYearly ? 'company_hr_booster_yearly' : 'company_hr_booster_monthly',
        'COMPANY_PREMIUM': isYearly ? 'company_hr_agent_yearly' : 'company_hr_agent_monthly',
      }

      const planId = planIdMap[tier.id]
      if (!planId) {
        setError('Plan configuration error. Please contact support.')
        return
      }

      console.log(`🚀 Starting Stripe checkout for plan: ${planId}`)

      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId,
          // testMode: true, // Disabled to show real Stripe checkout
          successUrl: `${window.location.origin}/dashboard?success=true&plan=${tier.id}`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🎯 Subscription checkout response:', data)
        
        if (data.testMode && data.redirectUrl) {
          // Test mode - refresh session and redirect
          console.log(`✅ Test mode upgrade successful: ${data.subscriptionPlan}`)
          
          if (data.refreshSession) {
            console.log('🔄 Refreshing session with latest subscription data...')
            // Force session refresh to get updated subscription data
            await update()
          }
          
          // Small delay to ensure session update completes
          setTimeout(() => {
            window.location.href = data.redirectUrl
          }, 500)
        } else if (data.url) {
          // Normal Stripe mode - redirect to Stripe checkout
          console.log(`🚀 Redirecting to Stripe: ${data.url}`)
          window.location.href = data.url
        } else {
          // Fallback - redirect to dashboard
          console.log('⚠️ No URL in response, redirecting to dashboard')
          window.location.href = `${window.location.origin}/dashboard?upgraded=true`
        }
      } else {
        const errorData = await response.json()
        console.error('Checkout API error:', errorData)
        setError(errorData.error || 'Failed to start upgrade process. Please try again.')
      }
    } catch (error) {
      console.error('Error starting checkout:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setLoading(true)
    try {
      // Use Stripe Customer Portal for subscription management
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url // Redirect to Stripe Customer Portal
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to open subscription management. Please try again.')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      setError('Failed to open subscription management. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {userRole === 'STUDENT' ? 'Student' : 'Company'} Subscription Plans
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the plan that best fits your needs and unlock powerful features to accelerate your 
            {userRole === 'STUDENT' ? ' career growth' : ' hiring process'}.
          </p>
        </div>

        {/* Subscription Management */}
        <SubscriptionManagement />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <XMarkIcon className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                !isYearly 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                isYearly 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {availableTiers.map((tier) => {
            const isCurrentPlan = tier.id === currentPlan
            const isUpgrade = availableTiers.findIndex(t => t.id === currentPlan) < availableTiers.findIndex(t => t.id === tier.id)

            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-lg shadow-sm border-2 p-8 ${
                  isCurrentPlan 
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600 mb-4">{tier.description}</p>
                  
                  {/* Credits Badge for Company Plans */}
                  {userRole === 'COMPANY' && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        💳 {getCreditAllowance(tier.id)} credits/month
                      </span>
                    </div>
                  )}
                  
                  <div className="text-4xl font-bold text-gray-900">
                    ${isYearly ? Math.round(tier.price * 12 * 0.8) : tier.price}
                    <span className="text-lg font-normal text-gray-600">
                      {isYearly ? '/year' : '/month'}
                    </span>
                  </div>
                  {isYearly && tier.price > 0 && (
                    <div className="text-green-600 text-sm font-medium mt-1">
                      Save ${Math.round(tier.price * 12 * 0.2)} per year
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.displayFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : tier.price === 0 ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
                    >
                      Free Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(tier)}
                      disabled={loading}
                      className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                        isUpgrade
                          ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                          : 'bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50'
                      }`}
                    >
                      {loading ? 'Processing...' : isUpgrade ? 'Upgrade' : 'Change Plan'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Compare All Features
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feature
                    </th>
                    {availableTiers.map((tier) => (
                      <th key={tier.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userRole === 'COMPANY' && (
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Contact credits per month
                      </td>
                      {availableTiers.map((tier) => (
                        <td key={tier.id} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {getCreditAllowance(tier.id)}
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Applications per month
                    </td>
                    {availableTiers.map((tier) => (
                      <td key={tier.id} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {tier.features.applicationsPerMonth === -1 ? 'Unlimited' : tier.features.applicationsPerMonth}
                      </td>
                    ))}
                  </tr>
                  {userRole === 'COMPANY' && (
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Active projects
                      </td>
                      {availableTiers.map((tier) => (
                        <td key={tier.id} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {tier.features.activeProjectsAllowed === -1 ? 'Unlimited' : tier.features.activeProjectsAllowed || 'N/A'}
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      External job tracking
                    </td>
                    {availableTiers.map((tier) => (
                      <td key={tier.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {tier.features.externalJobTracking ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Priority support
                    </td>
                    {availableTiers.map((tier) => (
                      <td key={tier.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {tier.features.prioritySupport || tier.features.priorityCustomerSupport ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <div className="bg-blue-50 rounded-lg p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need help choosing a plan?
            </h3>
            <p className="text-gray-600 mb-4">
              Our team is here to help you find the perfect plan for your needs.
            </p>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 