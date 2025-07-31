'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Zap, Star, ArrowRight, Shield, Users, Target, Rocket } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface MembershipSelectionPopupProps {
  isOpen: boolean
  onClose: () => void
  userRole: 'STUDENT' | 'COMPANY'
  userName?: string
}

export function MembershipSelectionPopup({ 
  isOpen, 
  onClose, 
  userRole,
  userName 
}: MembershipSelectionPopupProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  // Check current subscription status
  const { data: session } = useSession()
  const currentPlan = (session?.user as any)?.subscriptionPlan || 'FREE'
  
  console.log(`🔍 MembershipPopup - Current plan: ${currentPlan}, Role: ${userRole}`)
  
  // Don't show popup if user already has a paid plan
  if (currentPlan !== 'FREE') {
    console.log(`🎯 User has ${currentPlan}, not showing membership popup`)
    return null
  }

  interface Plan {
    id: string
    name: string
    price: number
    description: string
    features: string[]
    buttonText: string
    color: string
    popular: boolean
    note?: string
    yearlyDiscount?: string
  }

  const getStudentPlans = (cycle: 'monthly' | 'yearly'): Plan[] => [
    {
      id: 'free',
      name: 'Free Explorer',
      price: 0,
      description: 'Perfect for getting started',
      features: ['4 applications/month', 'Basic gamification (XP, badges, portfolio)', 'Mentorship available (paid separately)', 'Discovery quiz access'],
      buttonText: 'Continue Free',
      color: 'gray',
      popular: false
    },
    {
      id: cycle === 'monthly' ? 'student_premium_monthly' : 'student_premium_yearly',
      name: 'Career Builder',
      price: cycle === 'monthly' ? 5 : 50,
      description: 'For active job seekers',
      features: ['10 applications/month', '1 additional document upload per application', 'External job tracking', 'Enhanced gamification features', 'Email support'],
      buttonText: `Upgrade to Premium`,
      color: 'blue',
      popular: true,
      yearlyDiscount: cycle === 'yearly' ? '17% off' : undefined
    },
    {
      id: cycle === 'monthly' ? 'student_pro_monthly' : 'student_pro_yearly',
      name: 'Career Accelerator',
      price: cycle === 'monthly' ? 15 : 150,
      description: '🔥 Early access + unlimited applications',
      features: ['Unlimited applications/month', '1 additional document upload per application', '🔥 EXCLUSIVE: 24-36h early access to new projects', 'External job tracking', 'Premium gamification features', 'Priority customer support'],
      buttonText: 'Go Pro',
      color: 'purple',
      popular: false,
      yearlyDiscount: cycle === 'yearly' ? '17% off' : undefined
    }
  ]

  const getCompanyPlans = (cycle: 'monthly' | 'yearly'): Plan[] => [
    {
      id: cycle === 'monthly' ? 'company_basic_monthly' : 'company_basic_yearly',
      name: 'Company Basic',
      price: cycle === 'monthly' ? 20 : 199.99,
      description: 'Perfect for small teams',
      features: ['1 active project', 'AI shortlisting', 'Interview tools', 'Basic analytics'],
      buttonText: 'Start Hiring',
      color: 'blue',
      popular: true,
      yearlyDiscount: cycle === 'yearly' ? '17% off' : undefined
    },
    {
      id: cycle === 'monthly' ? 'company_hr_booster_monthly' : 'company_hr_booster_yearly',
      name: 'HR Booster',
      price: cycle === 'monthly' ? 75 : 747,
      description: 'For growing companies',
      features: ['5 active projects', 'Full applicant visibility', 'Advanced analytics', 'Priority support'],
      buttonText: 'Boost Hiring',
      color: 'purple',
      popular: false,
      yearlyDiscount: cycle === 'yearly' ? '17% off' : undefined
    },
    {
      id: cycle === 'monthly' ? 'company_hr_agent_monthly' : 'company_hr_agent_yearly',
      name: 'HR Agent',
      price: cycle === 'monthly' ? 175 : 1745,
      description: 'Complete hiring solution',
      features: ['Unlimited projects', 'White-glove service', 'Custom integrations', 'Dedicated support'],
      buttonText: 'Go Full Agent',
      color: 'gold',
      popular: false,
      yearlyDiscount: cycle === 'yearly' ? '17% off' : undefined
    }
  ]

  const plans = userRole === 'STUDENT' ? getStudentPlans(billingCycle) : getCompanyPlans(billingCycle)

  const handlePlanSelect = async (planId: string, price: number) => {
    if (isUpgrading) return

    setSelectedPlan(planId)
    setIsUpgrading(true)

    try {
      // Handle free plan - just close the modal, don't go to Stripe
      if (planId === 'free' || price === 0) {
        console.log('✅ User selected free plan - closing modal')
        setTimeout(() => {
          onClose()
          setIsUpgrading(false)
          setSelectedPlan(null)
        }, 500) // Small delay for better UX
        return
      }

      // Paid plan - redirect to Stripe
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          // testMode: true, // Disabled to show real Stripe checkout
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🎯 Checkout response:', data)
        
        if (data.testMode && data.redirectUrl) {
          // Test mode - redirect to success page
          console.log(`✅ Test mode upgrade successful: ${data.subscriptionPlan}`)
          window.location.href = data.redirectUrl
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
        const error = await response.json()
        console.error('Checkout error:', error)
        alert('Payment system is being set up. Please try again later.')
      }
    } catch (error) {
      console.error('Error selecting plan:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsUpgrading(false)
      setSelectedPlan(null)
    }
  }

  const getPlanIcon = (color: string) => {
    switch (color) {
      case 'blue': return <Zap className="h-6 w-6" />
      case 'purple': return <Crown className="h-6 w-6" />
      case 'gold': return <Star className="h-6 w-6" />
      default: return <Shield className="h-6 w-6" />
    }
  }

  const getPlanColors = (color: string, popular: boolean = false) => {
    if (popular) {
      return {
        bg: 'bg-gradient-to-br from-blue-500 to-purple-600',
        text: 'text-white',
        button: 'bg-white text-blue-600 hover:bg-gray-100',
        border: 'border-blue-500 ring-2 ring-blue-200'
      }
    }

    switch (color) {
      case 'blue':
        return {
          bg: 'bg-white',
          text: 'text-gray-900',
          button: 'bg-blue-600 text-white hover:bg-blue-700',
          border: 'border-blue-200 hover:border-blue-300'
        }
      case 'purple':
        return {
          bg: 'bg-white',
          text: 'text-gray-900',
          button: 'bg-purple-600 text-white hover:bg-purple-700',
          border: 'border-purple-200 hover:border-purple-300'
        }
      case 'gold':
        return {
          bg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
          text: 'text-white',
          button: 'bg-white text-orange-600 hover:bg-gray-100',
          border: 'border-yellow-400'
        }
      default:
        return {
          bg: 'bg-white',
          text: 'text-gray-900',
          button: 'bg-gray-600 text-white hover:bg-gray-700',
          border: 'border-gray-200 hover:border-gray-300'
        }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl bg-white rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                {userRole === 'STUDENT' ? (
                  <Target className="h-12 w-12 text-white mx-auto" />
                ) : (
                  <Rocket className="h-12 w-12 text-white mx-auto" />
                )}
              </motion.div>

              <h1 className="text-3xl font-bold mb-2">
                Welcome{userName ? `, ${userName}` : ''}! 🎉
              </h1>
              <p className="text-white/90 text-lg">
                {userRole === 'STUDENT' 
                  ? 'Choose your plan to start applying for amazing opportunities'
                  : 'Select your plan to start posting projects and hiring talent'
                }
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="p-8 pb-4">
              <div className="flex justify-center mb-8">
                <div className="bg-gray-100 rounded-xl p-1 flex">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all relative ${
                      billingCycle === 'yearly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Yearly
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      Save 17%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Plans */}
            <div className="px-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {plans.map((plan: Plan, index: number) => {
                  const colors = getPlanColors(plan.color, plan.popular)
                  const isSelected = selectedPlan === plan.id
                  const isLoading = isUpgrading && isSelected

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative p-6 rounded-2xl border-2 ${colors.border} ${colors.bg} ${colors.text} transition-all hover:shadow-lg ${
                        plan.popular ? 'scale-105 z-10' : ''
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            MOST POPULAR
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <div className="mb-3">
                          {getPlanIcon(plan.color)}
                        </div>
                        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                        <p className={`text-sm ${plan.popular ? 'text-white/80' : 'text-gray-600'}`}>
                          {plan.description}
                        </p>
                      </div>

                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold">
                          {plan.price === 0 ? 'Free' : `$${plan.price}`}
                        </div>
                        {plan.price > 0 && (
                          <div className={`text-sm ${plan.popular ? 'text-white/80' : 'text-gray-500'}`}>
                            /{billingCycle === 'monthly' ? 'month' : 'year'}
                          </div>
                        )}
                        {plan.yearlyDiscount && (
                          <div className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                            {plan.yearlyDiscount}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mb-6">
                        {plan.features.map((feature: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className={`w-1.5 h-1.5 rounded-full ${plan.popular ? 'bg-white' : 'bg-green-500'}`} />
                            {feature}
                          </div>
                        ))}
                      </div>

                      {plan.note && (
                        <div className="text-xs text-orange-600 mb-4 font-medium">
                          ⚠️ {plan.note}
                        </div>
                      )}

                      <button
                        onClick={() => handlePlanSelect(plan.id, plan.price)}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${colors.button} disabled:opacity-50`}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            {plan.buttonText}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </motion.div>
                  )
                })}
              </div>

              {/* Bottom CTA */}
              <div className="text-center mt-8">
                <p className="text-gray-600 text-sm mb-4">
                  🔒 Secure payment • Cancel anytime • 30-day money back guarantee
                </p>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  I'll decide later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 