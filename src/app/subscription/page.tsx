'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Zap, Send, Users, Star, Target } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  period: string
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

  const userRole = (session?.user as any)?.role

  const studentPlans: Plan[] = [
    {
      id: 'student_free',
      name: 'Free',
      price: 0,
      currency: '£',
      period: 'month',
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
      id: 'student_pro_monthly',
      name: 'Student Pro',
      price: 5,
      currency: '£',
      period: 'month',
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
      id: 'student_premium_monthly',
      name: 'Student Premium',
      price: 10,
      currency: '£',
      period: 'month',
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
      id: 'company_basic',
      name: 'Company Basic',
      price: 15,
      currency: '£',
      period: 'month',
      contacts: 10,
      features: [
        '10 student contacts per month',
        'Basic project posting',
        'Standard search filters',
        'Email notifications',
        'Basic analytics'
      ],
      popular: false,
      buttonText: 'Get Started'
    },
    {
      id: 'company_pro',
      name: 'Company Pro',
      price: 35,
      currency: '£',
      period: 'month',
      contacts: 30,
      features: [
        '30 student contacts per month',
        'Priority project placement',
        'Advanced search & filters',
        'Candidate shortlisting tools',
        'Application management dashboard',
        'Proposal inbox management'
      ],
      popular: true,
      buttonText: 'Upgrade to Pro'
    },
    {
      id: 'company_premium',
      name: 'Company Premium',
      price: 65,
      currency: '£',
      period: 'month',
      contacts: 100,
      features: [
        '100 student contacts per month',
        'Unlimited project postings',
        'AI-powered candidate matching',
        'Direct messaging with students',
        'Priority customer support',
        'Analytics and insights dashboard',
        'Bulk proposal management'
      ],
      popular: false,
      buttonText: 'Get Premium'
    }
  ]

  const plans = userRole === 'STUDENT' ? studentPlans : companyPlans

  const handlePlanSelect = async (planId: string, price: number) => {
    setIsLoading(true)
    setSelectedPlan(planId)

    try {
      if (price === 0) {
        // Handle free plan
        const response = await fetch('/api/subscription/free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        })

        if (response.ok) {
          console.log(`✅ Successfully upgraded to free ${planId}`)
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
            planId,
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

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
                  {plan.currency}{plan.price}
                  <span className="text-lg text-gray-600">/{plan.period}</span>
                </div>
                
                {userRole === 'STUDENT' && plan.credits && (
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                    <Send className="h-4 w-4" />
                    <span>{plan.credits} proposals per month</span>
                  </div>
                )}
                
                {userRole === 'COMPANY' && plan.contacts && (
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                    <Users className="h-4 w-4" />
                    <span>{plan.contacts} student contacts per month</span>
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(plan.id, plan.price)}
                disabled={isLoading && selectedPlan === plan.id}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                } ${isLoading && selectedPlan === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading && selectedPlan === plan.id ? 'Processing...' : plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            {userRole === 'STUDENT' ? 'Why Students Choose Bidaaya Pro' : 'Why Companies Choose Bidaaya Pro'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {userRole === 'STUDENT' ? (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Direct Proposals</h3>
                  <p className="text-gray-600">
                    Send personalized proposals directly to companies and stand out from the crowd.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Priority Matching</h3>
                  <p className="text-gray-600">
                    Get priority recommendations for projects that match your skills and interests.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Career Support</h3>
                  <p className="text-gray-600">
                    Access career coaching, interview prep, and professional development resources.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Candidates</h3>
                  <p className="text-gray-600">
                    Access a curated pool of talented students and recent graduates.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Matching</h3>
                  <p className="text-gray-600">
                    AI-powered matching connects you with candidates that fit your requirements.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Efficient Hiring</h3>
                  <p className="text-gray-600">
                    Streamlined tools for managing applications, proposals, and candidate communication.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Questions about our plans? Contact our support team for assistance.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
} 