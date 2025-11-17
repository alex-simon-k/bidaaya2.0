'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Crown, 
  Sparkles, 
  Check,
  Zap,
  ExternalLink,
  ArrowRight
} from 'lucide-react'
import { PRICING_PLANS } from '@/lib/pricing'
import { StudentLayoutWrapper } from '@/components/student-layout-wrapper'
import Link from 'next/link'

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
      interval: 'month'
    })
    window.location.href = `/subscription?${params.toString()}`
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
      <div className="min-h-screen bg-bidaaya-dark py-12 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="h-8 w-8 text-bidaaya-accent" />
              <h1 className="text-4xl font-bold text-bidaaya-light">Land an Internship Faster</h1>
            </div>
            <p className="text-lg text-bidaaya-light/70 max-w-2xl mx-auto">
              Get more credits, unlock early access, and boost your job search
            </p>
          </motion.div>

          {/* Current Plan Badge */}
          {currentPlanId !== 'free' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full"
            >
              <Check className="h-4 w-4" />
              <span className="font-medium">
                Current Plan: {currentPlanId === 'student_premium' ? 'Premium' : 'Pro'}
              </span>
            </motion.div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlanId === plan.id
            const isDowngrade = (currentPlanId === 'student_pro' && plan.id === 'student_premium')
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden ${
                  plan.highlight ? 'ring-2 ring-bidaaya-accent' : ''
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className={`bg-gradient-to-r ${plan.gradient} text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg`}>
                      <Sparkles className="h-3 w-3" />
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Header with Image */}
                <div className={`bg-gradient-to-br ${plan.gradient} p-8 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 opacity-10">
                    <img 
                      src={plan.image} 
                      alt={plan.name}
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-white/90 text-sm mb-4">{plan.displayName} Plan</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">AED {plan.price}</span>
                      <span className="text-white/80">/month</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 w-fit">
                      <Zap className="h-4 w-4" />
                      <span className="font-semibold">{plan.credits} credits/month</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="p-8">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-bidaaya-light/90">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <div className="text-center py-3 bg-white/10 rounded-lg text-bidaaya-light/80 font-medium">
                      Your Current Plan
                    </div>
                  ) : isDowngrade ? (
                    <button
                      onClick={handleManageSubscription}
                      className="w-full py-3 border-2 border-white/20 text-bidaaya-light rounded-lg font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                      Downgrade to {plan.displayName}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgrading}
                      className={`w-full py-3 bg-gradient-to-r ${plan.gradient} text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                      {upgrading ? 'Loading...' : `Upgrade to ${plan.displayName}`}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Manage Subscription Link */}
        {userSub?.hasStripeSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <button
              onClick={handleManageSubscription}
              className="inline-flex items-center gap-2 text-bidaaya-accent hover:text-purple-400 font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Manage Subscription & Billing
            </button>
          </motion.div>
        )}

        {/* Link to Settings */}
        <div className="text-center mt-8">
          <Link
            href="/student/settings"
            className="text-bidaaya-light/60 hover:text-bidaaya-light underline"
          >
            Go to Settings & Credit Management
          </Link>
        </div>
        </div>
      </div>
    </StudentLayoutWrapper>
  )
}

