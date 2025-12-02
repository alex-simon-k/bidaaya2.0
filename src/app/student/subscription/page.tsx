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
        <div className="py-8 px-4 pb-24">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-3 whitespace-nowrap">Land an Internship Faster</h1>
              <p className="text-white/70 text-sm text-center">
                Get more credits, unlock early access, and boost your job search
              </p>
            </div>

            {/* Segmented Control - Sliding Pill */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative inline-flex items-center bg-white/5 backdrop-blur-xl rounded-full p-1 border border-white/10">
                {/* Sliding Background */}
                <div
                  className={`absolute top-1 bottom-1 rounded-full bg-white/10 backdrop-blur-sm transition-all duration-300 ease-out ${
                    billingInterval === 'month' ? 'left-1 right-1/2' : 'left-1/2 right-1'
                  }`}
                />
                
                {/* Monthly Button */}
                <button
                  onClick={() => setBillingInterval('month')}
                  className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors ${
                    billingInterval === 'month' ? 'text-white' : 'text-white/60'
                  }`}
                >
                  Monthly
                </button>
                
                {/* Yearly Button */}
                <button
                  onClick={() => setBillingInterval('year')}
                  className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                    billingInterval === 'year' ? 'text-white' : 'text-white/60'
                  }`}
                >
                  Yearly
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans - Stacked Vertically with Glassmorphism */}
            <div className="space-y-6">
              {plans.map((plan, index) => {
                const isCurrentPlan = currentPlanId === plan.id
                const isDowngrade = (currentPlanId === 'student_pro' && plan.id === 'student_premium')
                const displayPrice = getDisplayPrice(plan)
                // Fries in the Bag: image on RIGHT, Unemployed Bro: image on LEFT
                const imagePosition = index === 0 ? 'right' : 'left'
                const glowColor = plan.gradient.includes('orange') 
                  ? 'rgba(249, 115, 22, 0.3)' 
                  : 'rgba(168, 85, 247, 0.3)'
                
                return (
                  <div
                    key={plan.id}
                    className="relative"
                  >
                    {/* Ambient Glow Behind Card */}
                    <div 
                      className="absolute inset-0 rounded-3xl blur-2xl opacity-50 -z-10"
                      style={{ 
                        background: glowColor,
                        transform: 'scale(1.1)'
                      }}
                    />
                    
                    {/* Glass Card */}
                    <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 overflow-hidden"
                      style={{
                        backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.01) 100%)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {/* Gradient Border Effect */}
                      <div 
                        className="absolute inset-0 rounded-3xl opacity-20"
                        style={{
                          background: plan.gradient.includes('orange')
                            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(239, 68, 68, 0.2))'
                            : 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.2))',
                          padding: '1px',
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude'
                        }}
                      />
                      
                      <div className={`flex items-center gap-6 ${
                        imagePosition === 'right' ? 'flex-row' : 'flex-row-reverse'
                      }`}>
                        {/* Content */}
                        <div className={`flex-1 ${imagePosition === 'left' ? 'text-right' : ''}`}>
                          {/* Plan Name with Gradient */}
                          <h3 
                            className="text-2xl font-bold mb-1 bg-clip-text text-transparent"
                            style={{
                              backgroundImage: plan.gradient.includes('orange')
                                ? 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)'
                                : 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)'
                            }}
                          >
                            {plan.name}
                          </h3>
                          <p className="text-white/60 text-sm mb-4">{plan.displayName} Plan</p>
                          
                          {/* Massive Price - Thin and Bright */}
                          <div className={`mb-3 ${imagePosition === 'left' ? 'text-right' : ''}`}>
                            <span className="text-6xl font-thin text-white tracking-tight">£{displayPrice}</span>
                            <span className="text-xl text-white/70 ml-2 font-light">/{billingInterval === 'year' ? 'year' : 'month'}</span>
                          </div>
                          {billingInterval === 'year' && (
                            <p className={`text-xs text-white/50 mb-4 ${imagePosition === 'left' ? 'text-right' : ''}`}>
                              £{plan.price}/month billed annually
                            </p>
                          )}

                          {/* Credits Badge */}
                          <div className={`mb-5 ${imagePosition === 'left' ? 'flex justify-end' : ''}`}>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                              <Zap className="w-3.5 h-3.5 text-white/80" />
                              <span className="text-sm font-medium text-white/90">{plan.credits} credits</span>
                            </div>
                          </div>

                          {/* CTA Button - Full Gradient, Pill Shape */}
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
                              className={`w-full py-3.5 bg-gradient-to-r ${plan.gradient} text-white rounded-full font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg`}
                              style={{
                                boxShadow: `0 4px 20px ${glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                              }}
                            >
                              {upgrading ? 'Loading...' : `Upgrade to ${plan.displayName}`}
                              <ArrowRight className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        {/* Image with Glow */}
                        <div className="flex-shrink-0 relative">
                          {/* Glow behind image */}
                          <div 
                            className="absolute inset-0 rounded-full blur-xl opacity-60"
                            style={{ background: glowColor }}
                          />
                          <img 
                            src={plan.image} 
                            alt={plan.name}
                            className="relative w-28 h-28 object-contain"
                            style={{
                              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))'
                            }}
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

