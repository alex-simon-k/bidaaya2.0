'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Zap, Send, Users, Star, Target } from 'lucide-react'

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice?: number
  currency: string
  credits?: number
  contacts?: number
  features: string[]
  popular: boolean
  buttonText: string
}

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const userRole = (session?.user as any)?.role

  const studentPlans: Plan[] = [
    {
      id: 'student_free',
      name: 'Free',
      monthlyPrice: 0,
      currency: '£',
      credits: 5,
      features: [
        '4 project applications per month',
        '5 direct proposals per month',
        'Browse all projects',
        'Basic profile features',
        'Email notifications',
        'Access to company database'
      ],
      popular: false,
      buttonText: 'Current Plan'
    },
    {
      id: 'student_pro',
      name: 'Student Pro',
      monthlyPrice: 5,
      yearlyPrice: 48,
      currency: '£',
      credits: 20,
      features: [
        '10 project applications per month',
        '20 direct proposals per month',
        'Priority project recommendations',
        'Enhanced profile features',
        'Advanced search filters',
        'Career guidance resources',
        'Profile optimization tips'
      ],
      popular: true,
      buttonText: 'Upgrade to Pro'
    },
    {
      id: 'student_premium',
      name: 'Student Premium',
      monthlyPrice: 10,
      yearlyPrice: 96,
      currency: '£',
      credits: 50,
      features: [
        '20 project applications per month',
        '50 direct proposals per month',
        'Premium profile badge',
        'One-on-one career coaching',
        'Company introduction service',
        'Interview preparation resources',
        'Resume review service'
      ],
      popular: false,
      buttonText: 'Get Premium'
    }
  ]

  const companyPlans: Plan[] = [
    {
      id: 'company_free',
      name: 'Free Trial',
      monthlyPrice: 0,
      currency: '£',
      contacts: 10,
      features: [
        '10 contact credits per month',
        'Create draft projects',
        'Browse student profiles',
        'Basic platform access',
        'Email notifications',
        'Community support'
      ],
      popular: false,
      buttonText: 'Current Plan'
    },
    {
      id: 'company_basic',
      name: 'Company Basic',
      monthlyPrice: 20,
      yearlyPrice: 200,
      currency: '£',
      contacts: 50,
      features: [
        '50 contact credits per month',
        '1 active project at a time',
        'AI shortlisting (top 10 candidates)',
        'Template-based projects only',
        'Interview scheduling tools',
        'Email notifications',
        'Basic analytics'
      ],
      popular: false,
      buttonText: 'Get Started'
    },
    {
      id: 'company_hr_booster',
      name: 'HR Booster',
      monthlyPrice: 75,
      yearlyPrice: 750,
      currency: '£',
      contacts: 100,
      features: [
        '100 contact credits per month',
        'Up to 5 simultaneous projects',
        'Full applicant pool visibility',
        'Custom project creation',
        'Interview scheduling & management',
        'Advanced analytics dashboard',
        'Candidate communication tools',
        'Priority email support'
      ],
      popular: true,
      buttonText: 'Upgrade to HR Booster'
    },
    {
      id: 'company_hr_agent',
      name: 'HR Agent',
      monthlyPrice: 175,
      yearlyPrice: 1750,
      currency: '£',
      contacts: 200,
      features: [
        '200 contact credits per month',
        'Unlimited simultaneous projects',
        'Complete applicant transparency',
        'We conduct interviews for you',
        'Interview transcript analysis',
        'Team recommendations delivered',
        'Dedicated account manager',
        'White-label options'
      ],
      popular: false,
      buttonText: 'Get HR Agent'
    }
  ]

  const plans = userRole === 'STUDENT' ? studentPlans : companyPlans

  const handlePlanSelect = async (planId: string, price: number) => {
    setIsLoading(true)
    setSelectedPlan(planId)

    const actualPlanId = billingCycle === 'yearly' && price > 0 ? `${planId}_yearly` : `${planId}_monthly`

    try {
      if (price === 0) {
        // Handle free plan
        const response = await fetch('/api/subscription/free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: actualPlanId }),
        })

        if (response.ok) {
          console.log(`✅ Successfully upgraded to free ${actualPlanId}`)
          window.location.reload()
        } else {
          console.error('❌ Failed to upgrade to free plan')
        }
      } else {
        // Handle paid plans - redirect to Stripe checkout
        const response = await fetch('/api/subscription/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            planId: actualPlanId,
            successUrl: `${window.location.origin}/dashboard?success=true`,
            cancelUrl: `${window.location.origin}/subscription?canceled=true`,
          }),
        })

        if (response.ok) {
          const { url } = await response.json()
          window.location.href = url
        } else {
          const errorData = await response.json()
          console.error('❌ Failed to create checkout session:', errorData)
          alert('Unable to start checkout process. Please try again or contact support.')
        }
      }
    } catch (error) {
      console.error('❌ Error selecting plan:', error)
      alert('An unexpected error occurred. Please try again or contact support.')
    } finally {
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  const getCurrentPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return 0
    return billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice
  }

  const getDisplayPrice = (plan: Plan) => {
    const price = getCurrentPrice(plan)
    if (price === 0) return 'Free'
    if (billingCycle === 'yearly' && plan.yearlyPrice) {
      return `${plan.currency}${price}/year`
    }
    return `${plan.currency}${price}/month`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            {userRole === 'STUDENT' ? 'Unlock Your Career Potential' : 'Scale Your Hiring Process'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            {userRole === 'STUDENT' 
              ? 'Send more proposals, access premium features, and land your dream opportunity'
              : 'Connect with top talent and build your dream team'
            }
          </motion.p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Crown className="h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {getDisplayPrice(plan)}
                </div>
                
                {userRole === 'STUDENT' && plan.credits && (
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                    <Send className="h-4 w-4" />
                    {plan.credits} credits/month
                  </div>
                )}
                
                {userRole === 'COMPANY' && plan.contacts && (
                  <div className="flex items-center justify-center gap-2 text-purple-600 font-semibold">
                    <Users className="h-4 w-4" />
                    {plan.contacts} contacts/month
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(plan.id, getCurrentPrice(plan))}
                disabled={isLoading && selectedPlan === plan.id}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading && selectedPlan === plan.id ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  plan.buttonText
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            All plans include our core features and dedicated customer support
          </p>
          <p className="text-sm text-gray-500">
            Need a custom plan? <a href="mailto:support@bidaaya.ae" className="text-blue-600 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  )
} 