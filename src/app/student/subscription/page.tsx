'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { 
  Crown, 
  Check,
  Zap,
  ArrowRight
} from 'lucide-react'
import { PRICING_PLANS } from '@/lib/pricing'
import { StudentLayoutWrapper } from '@/components/student-layout-wrapper'

interface UserSubscription {
  subscriptionPlan: string
  subscriptionStatus: string
  hasStripeSubscription: boolean
}

export default function StudentSubscription() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [userSub, setUserSub] = useState<UserSubscription | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [])

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_status' })
      })
      if (response.ok) {
        const data = await response.json()
        setUserSub(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = (planId: string) => {
    setUpgrading(true)
    const params = new URLSearchParams({
      plan: planId,
      interval: billingInterval
    })
    window.location.href = `/subscription?${params.toString()}`
  }

  // Calculate yearly pricing (17% discount)
  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 10) // 2 months free
  }

  const getDisplayPrice = (plan: any) => {
    if (billingInterval === 'year') {
      return getYearlyPrice(plan.price)
    }
    return plan.price
  }

  const handleManageSubscription = async () => {
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
        }
      }
    } catch (error) {
      console.error('Failed to open portal:', error)
    }
  }

  const plans = [
    {
      id: PRICING_PLANS.STUDENT_PREMIUM.id,
      name: "Fries in the Bag",
      displayName: "Premium",
      price: PRICING_PLANS.STUDENT_PREMIUM.price,
      credits: 100,
      image: '/pricing/cooked-guy.png',
      gradient: 'from-orange-500 to-red-500',
      features: [
        '100 credits per month',
        'Custom CV generation',
        'Custom cover letters',
        'Early access to opportunities (7 credits each)',
        'Priority support'
      ]
    },
    {
      id: PRICING_PLANS.STUDENT_PRO.id,
      name: 'Unemployed Bro',
      displayName: "Pro",
      price: PRICING_PLANS.STUDENT_PRO.price,
      credits: 200,
      image: '/pricing/unemployed-guy.png',
      gradient: 'from-bidaaya-accent to-purple-600',
      badge: 'Best Value',
      highlight: true,
      features: [
        '200 credits per month',
        'UNLIMITED early access (no credits needed)',
        'Custom CV generation',
        'Custom cover letters',
        'Premium support',
        'Profile boost'
      ]
    }
  ]

  const currentPlanId = userSub?.subscriptionPlan === 'STUDENT_PREMIUM' ? 'student_premium' :
                        userSub?.subscriptionPlan === 'STUDENT_PRO' ? 'student_pro' : 'free'

  if (loading) {
    return (
      <div className="min-h-screen bg-bidaaya-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bidaaya-accent"></div>
      </div>
    )
  }

  return (
    <StudentLayoutWrapper>
      <div className="min-h-screen bg-black py-8 px-4 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-6 w-6 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Land an Internship Faster</h1>
            </div>
            <p className="text-white/70 text-sm text-center">
              Get more credits, unlock early access, and boost your job search
            </p>
          </div>

          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className={`text-sm font-medium transition-colors ${
              billingInterval === 'month' ? 'text-white' : 'text-gray-400'
            }`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(prev => prev === 'month' ? 'year' : 'month')}
              className="relative w-14 h-7 rounded-full bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                  billingInterval === 'year' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium transition-colors ${
                billingInterval === 'year' ? 'text-white' : 'text-gray-400'
              }`}>
                Yearly
              </span>
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                Save 17%
              </span>
            </div>
          </div>

          {/* Plans - Stacked Vertically */}
          <div className="space-y-6">
            {plans.map((plan, index) => {
              const isCurrentPlan = currentPlanId === plan.id
              const isDowngrade = (currentPlanId === 'student_pro' && plan.id === 'student_premium')
              const displayPrice = getDisplayPrice(plan)
              const anchor = index === 0 ? 'left' : 'right' // First card left-anchored, second right-anchored
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-gradient-to-br ${plan.gradient} border ${plan.gradient.includes('orange') ? 'border-orange-500/30' : 'border-purple-500/30'} rounded-2xl p-6 overflow-hidden`}
                >
                  <div className={`flex items-start gap-4 ${
                    anchor === 'left' ? 'flex-row' : 'flex-row-reverse'
                  }`}>
                    {/* Image - Anchored */}
                    <div className={`flex-shrink-0 ${anchor === 'right' ? 'order-2' : ''}`}>
                      <img 
                        src={plan.image} 
                        alt={plan.name}
                        className="w-24 h-24 object-contain opacity-80"
                      />
                    </div>

                    {/* Content - Anchored */}
                    <div className={`flex-1 ${anchor === 'right' ? 'text-right' : ''}`}>
                      <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                      <p className="text-white/90 text-sm mb-3">{plan.displayName} Plan</p>
                      
                      {/* Price */}
                      <div className={`text-white mb-2 ${anchor === 'right' ? 'text-right' : ''}`}>
                        <span className="text-4xl font-bold">£{displayPrice}</span>
                        <span className="text-lg ml-1">/{billingInterval === 'year' ? 'year' : 'month'}</span>
                      </div>
                      {billingInterval === 'year' && (
                        <p className={`text-xs text-white/70 mb-3 ${anchor === 'right' ? 'text-right' : ''}`}>
                          £{plan.price}/month billed annually
                        </p>
                      )}

                      {/* Credits Badge */}
                      <div className={`mb-4 ${anchor === 'right' ? 'flex justify-end' : ''}`}>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                          plan.gradient.includes('orange')
                            ? 'bg-orange-500/30 text-orange-200'
                            : 'bg-purple-500/30 text-purple-200'
                        }`}>
                          <Zap className="w-3.5 h-3.5" />
                          <span className="text-sm font-semibold">{plan.credits} credits/month</span>
                        </div>
                      </div>

                      {/* Features - Only show for first plan */}
                      {index === 0 && (
                        <ul className="space-y-2 mb-4">
                          {plan.features.slice(0, 5).map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-white/90">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* CTA Button */}
                      {isCurrentPlan ? (
                        <div className="text-center py-3 bg-white/10 rounded-lg text-white/80 font-medium">
                          Your Current Plan
                        </div>
                      ) : isDowngrade ? (
                        <button
                          onClick={handleManageSubscription}
                          className="w-full py-3 border-2 border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                          Downgrade to {plan.displayName}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={upgrading}
                          className={`w-full py-3 bg-gradient-to-r ${plan.gradient} text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg`}
                        >
                          {upgrading ? 'Loading...' : `Upgrade to ${plan.displayName}`}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </StudentLayoutWrapper>
  )
}

