'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getPlansForUserType, type PricingPlan, getCreditAllowance } from '@/lib/pricing'
import { FaCheck, FaUserGraduate, FaBuilding } from 'react-icons/fa'

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedUserType, setSelectedUserType] = useState<'STUDENT' | 'COMPANY'>(
    (session?.user?.role as 'STUDENT' | 'COMPANY') || 'STUDENT'
  )
  const [isLoading, setIsLoading] = useState(false)

  const plans = getPlansForUserType(selectedUserType)

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (plan.price === 0) {
      // Handle free plan - just update user's plan
      try {
        const response = await fetch('/api/subscription/free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planId: plan.id }),
        })

        if (response.ok) {
          router.push('/dashboard?upgraded=true')
        }
      } catch (error) {
        console.error('Error upgrading to free plan:', error)
      }
      return
    }

    // Handle paid plans - redirect to Stripe Checkout
    setIsLoading(true)
    try {
      console.log(`🚀 Starting Stripe checkout for plan: ${plan.id}`)
      
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          planId: plan.id,  // Use planId instead of priceId
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        if (url) {
          console.log(`✅ Redirecting to Stripe checkout: ${url}`)
          window.location.href = url
        }
      } else {
        const error = await response.json()
        console.error('Checkout error:', error)
        alert('Payment system error. Please try again.')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Unlock your potential with the right plan for your needs
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="mt-12 flex justify-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedUserType('STUDENT')}
              className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedUserType === 'STUDENT'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaUserGraduate className="mr-2" />
              Students
            </button>
            <button
              onClick={() => setSelectedUserType('COMPANY')}
              className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedUserType === 'COMPANY'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaBuilding className="mr-2" />
              Companies
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                (plan as any).popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {(plan as any).popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
                  Most Popular
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-gray-600">{plan.description}</p>
                
                {/* Credits Badge for Company Plans */}
                {selectedUserType === 'COMPANY' && (
                  <div className="mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      💳 {getCreditAllowance(plan.id)} credits/month
                    </span>
                  </div>
                )}
                
                <div className="mt-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="ml-1 text-xl text-gray-500">/{plan.interval}</span>
                    )}
                  </div>
                </div>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5" />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    (plan as any).popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {isLoading ? 'Processing...' : plan.price === 0 ? 'Get Started Free' : 'Subscribe Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Can I change my plan later?
              </h3>
              <p className="mt-2 text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                What payment methods do you accept?
              </h3>
              <p className="mt-2 text-gray-600">
                We accept all major credit cards and debit cards through our secure payment processor, Stripe.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Is there a free trial?
              </h3>
              <p className="mt-2 text-gray-600">
                Yes, we offer a free plan with limited features. You can upgrade to a paid plan at any time to unlock more features.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Can I cancel my subscription?
              </h3>
              <p className="mt-2 text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 