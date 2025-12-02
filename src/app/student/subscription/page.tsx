'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { 
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
      <div className="min-h-screen" style={{ backgroundColor: '#050505' }}>
        <div className="pt-20 px-4 pb-24 safe-top">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-3">Land an Internship Faster</h1>
              <p className="text-white/70 text-base text-center">
                Get more credits, unlock early access, and boost your job search
              </p>
            </div>

            {/* Segmented Control - Fixed Sliding Pill */}
            <div className="flex items-center justify-center mb-10">
              <div className="relative inline-flex items-center bg-white/5 backdrop-blur-xl rounded-full p-1 border border-white/10">
                {/* Sliding Background */}
                <div
                  className={`absolute top-1 bottom-1 rounded-full bg-white/10 backdrop-blur-sm transition-all duration-300 ease-out ${
                    billingInterval === 'month' 
                      ? 'left-1 right-[calc(50%+2px)]' 
                      : 'left-[calc(50%+2px)] right-1'
                  }`}
                />
                
                {/* Monthly Button */}
                <button
                  onClick={() => setBillingInterval('month')}
                  className={`relative z-10 px-8 py-2.5 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
                    billingInterval === 'month' ? 'text-white' : 'text-white/60'
                  }`}
                >
                  Monthly
                </button>
                
                {/* Yearly Button */}
                <button
                  onClick={() => setBillingInterval('year')}
                  className={`relative z-10 px-8 py-2.5 text-sm font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap ${
                    billingInterval === 'year' ? 'text-white' : 'text-white/60'
                  }`}
                >
                  Yearly
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans - Stacked Vertically with Better Spacing */}
            <div className="space-y-8">
              {plans.map((plan, index) => {
                const isCurrentPlan = currentPlanId === plan.id
                const isDowngrade = (currentPlanId === 'student_pro' && plan.id === 'student_premium')
                const displayPrice = getDisplayPrice(plan)
                // Fries in the Bag: image on RIGHT, Unemployed Bro: image on LEFT
                const imagePosition = index === 0 ? 'right' : 'left'
                
                return (
                  <div
                    key={plan.id}
                    className="relative"
                  >
                    {/* Glass Card - Clean Design */}
                    <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 overflow-hidden">
                      <div className={`flex items-start gap-6 ${
                        imagePosition === 'right' ? 'flex-row' : 'flex-row-reverse'
                      }`}>
                        {/* Content */}
                        <div className={`flex-1 ${imagePosition === 'left' ? 'text-right' : ''}`}>
                          {/* Plan Name */}
                          <h3 className="text-2xl font-bold text-white mb-1">
                            {plan.name}
                          </h3>
                          <p className="text-white/60 text-sm mb-6">{plan.displayName} Plan</p>
                          
                          {/* Credits Badge - Prominent */}
                          <div className={`mb-4 ${imagePosition === 'left' ? 'flex justify-end' : ''}`}>
                            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-bidaaya-accent/20 to-purple-500/20 border-2 border-bidaaya-accent/40 backdrop-blur-sm">
                              <Zap className="w-5 h-5 text-bidaaya-accent" />
                              <span className="text-lg font-bold text-white">{plan.credits} credits</span>
                            </div>
                          </div>
                          
                          {/* Price - Smaller, Less Emphasis */}
                          <div className={`mb-6 ${imagePosition === 'left' ? 'text-right' : ''}`}>
                            <span className="text-3xl font-semibold text-white/90">£{displayPrice}</span>
                            <span className="text-base text-white/60 ml-1">/{billingInterval === 'year' ? 'year' : 'month'}</span>
                          </div>
                          {billingInterval === 'year' && (
                            <p className={`text-xs text-white/50 mb-4 ${imagePosition === 'left' ? 'text-right' : ''}`}>
                              £{plan.price}/month billed annually
                            </p>
                          )}

                          {/* CTA Button */}
                          {isCurrentPlan ? (
                            <div className="text-center py-3.5 bg-white/5 backdrop-blur-xl rounded-full text-white/80 font-semibold border border-white/10">
                              Your Current Plan
                            </div>
                          ) : isDowngrade ? (
                            <button
                              onClick={handleManageSubscription}
                              className="w-full py-3.5 bg-white/5 backdrop-blur-xl border border-white/20 text-white rounded-full font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                              Downgrade to {plan.displayName}
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpgrade(plan.id)}
                              disabled={upgrading}
                              className={`w-full py-3.5 bg-gradient-to-r ${plan.gradient} text-white rounded-full font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                            >
                              {upgrading ? 'Loading...' : `Upgrade to ${plan.displayName}`}
                              <ArrowRight className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        {/* Image - Full Coverage */}
                        <div className="flex-shrink-0 relative w-32 h-32">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
                          <img 
                            src={plan.image} 
                            alt={plan.name}
                            className="relative w-full h-full object-cover rounded-2xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </StudentLayoutWrapper>
  )
}

