'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Zap, Star, Check, Send } from 'lucide-react'

interface StudentPlan {
  id: string
  name: string
  price: number
  currency: string
  period: string
  proposals: number
  features: string[]
  popular: boolean
  buttonText: string
}

interface CompanyPlan {
  id: string
  name: string
  price: number
  currency: string
  period: string
  contacts: number
  features: string[]
  popular: boolean
  buttonText: string
}

interface MembershipSelectionPopupProps {
  isOpen: boolean
  onClose: () => void
  userRole: 'STUDENT' | 'COMPANY'
  userName: string
}

export function MembershipSelectionPopup({ 
  isOpen, 
  onClose, 
  userRole, 
  userName 
}: MembershipSelectionPopupProps) {
  const { data: session } = useSession()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  if (!isOpen) return null

  const studentPlans: StudentPlan[] = [
    {
      id: 'student_free',
      name: 'Free',
      price: 0,
      currency: '£',
      period: 'month',
      proposals: 5,
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
      proposals: 20,
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
      proposals: 50,
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

  const companyPlans: CompanyPlan[] = [
    {
      id: 'company_basic',
      name: 'Basic',
      price: 15,
      currency: '£',
      period: 'month',
      contacts: 10,
      features: [
        '10 student contacts per month',
        'Basic project posting',
        'Standard search filters',
        'Email notifications'
      ],
      popular: false,
      buttonText: 'Get Started'
    },
    {
      id: 'company_pro',
      name: 'Pro',
      price: 35,
      currency: '£',
      period: 'month',
      contacts: 30,
      features: [
        '30 student contacts per month',
        'Priority project placement',
        'Advanced search & filters',
        'Candidate shortlisting tools',
        'Application management dashboard'
      ],
      popular: true,
      buttonText: 'Upgrade to Pro'
    },
    {
      id: 'company_premium',
      name: 'Premium',
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
        'Analytics and insights dashboard'
      ],
      popular: false,
      buttonText: 'Get Premium'
    }
  ]

  const plans = userRole === 'STUDENT' ? studentPlans : companyPlans

  const handlePlanSelect = async (planId: string, price: number) => {
    console.log(`${userRole} selected plan:`, planId, 'price:', price)
    
    if (!session) {
      window.location.href = '/auth/login'
      return
    }

    try {
      if (price === 0) {
        // Handle free plan
        const response = await fetch('/api/subscription/free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        })

        if (response.ok) {
          onClose()
          console.log(`✅ Successfully upgraded to free ${planId}`)
        } else {
          console.error('❌ Failed to upgrade to free plan')
        }
      } else {
        // Handle paid plans - redirect to subscription page
        window.location.href = '/subscription'
      }
    } catch (error) {
      console.error('❌ Error selecting plan:', error)
      alert('An unexpected error occurred. Please try again or contact support.')
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {userRole === 'STUDENT' ? 'Unlock Your Career Potential' : 'Scale Your Hiring'}
                </h2>
                <p className="text-blue-100 mt-1">
                  {userRole === 'STUDENT' 
                    ? `Hi ${userName}! Send more proposals and access premium features`
                    : `Hi ${userName}! Get access to more talented students`
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                    plan.popular
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-gray-900">
                      {plan.currency}{plan.price}
                      <span className="text-lg text-gray-600">/{plan.period}</span>
                    </div>
                    {userRole === 'STUDENT' ? (
                      <p className="text-sm text-gray-600 mt-2 font-medium">
                        {'proposals' in plan ? plan.proposals : 0} proposals per month
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-2 font-medium">
                        {'contacts' in plan ? plan.contacts : 0} student contacts per month
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePlanSelect(plan.id, plan.price)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                {userRole === 'STUDENT' 
                  ? 'Start sending proposals today and land your dream opportunity!'
                  : 'Find the perfect candidates for your company!'
                }
              </p>
              <button
                onClick={onClose}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
} 