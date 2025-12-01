'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { StudentLayoutWrapper } from '@/components/student-layout-wrapper'
import { PRICING_PLANS } from '@/lib/pricing'

export default function PricingPage() {
  const { data: session } = useSession()
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')

  const handleSubscribe = (planId: string, interval: 'month' | 'year') => {
    const params = new URLSearchParams({
      plan: planId,
      interval: interval
    })
    window.location.href = `/subscription?${params.toString()}`
  }

  // Calculate yearly pricing (assume 2 months free = 10 months price)
  const getYearlyPrice = (monthlyPrice: number) => {
    return monthlyPrice * 10 // 2 months free
  }

  const plans = [
    {
      id: PRICING_PLANS.STUDENT_PREMIUM.id,
      name: "Fries in the Bag",
      price: PRICING_PLANS.STUDENT_PREMIUM.price,
      credits: 100,
      image: '/pricing/cooked-guy.png',
      gradient: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
      buttonGradient: 'from-orange-500 to-red-500',
      anchor: 'left'
    },
    {
      id: PRICING_PLANS.STUDENT_PRO.id,
      name: 'Unemployed Bro',
      price: PRICING_PLANS.STUDENT_PRO.price,
      credits: 200,
      image: '/pricing/unemployed-guy.png',
      gradient: 'from-bidaaya-accent/20 to-purple-500/20',
      borderColor: 'border-bidaaya-accent/30',
      buttonGradient: 'from-bidaaya-accent to-purple-500',
      anchor: 'right'
    }
  ]

  const content = (
    <div className="w-full min-h-screen bg-black pt-16 px-4 pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Monthly/Yearly Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
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

        {/* Pricing Cards - Left and Right Anchored */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const displayPrice = billingInterval === 'year'
              ? getYearlyPrice(plan.price)
              : plan.price
            
            const priceDisplay = billingInterval === 'year' 
              ? `£${displayPrice} /yr`
              : `/mo £${plan.price}`
            
            return (
              <div
                key={plan.id}
                className={`relative bg-gradient-to-br ${plan.gradient} border ${plan.borderColor} rounded-2xl p-6 overflow-hidden ${
                  plan.anchor === 'left' ? 'md:mr-auto md:max-w-sm' : 'md:ml-auto md:max-w-sm'
                }`}
              >
                <div className={`flex items-start gap-4 ${
                  plan.anchor === 'left' ? 'flex-row' : 'flex-row-reverse'
                }`}>
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <img 
                      src={plan.image} 
                      alt={plan.name}
                      className="w-20 h-20 object-contain"
                    />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${plan.anchor === 'right' ? 'text-right' : ''}`}>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className={`text-white mb-3 ${plan.anchor === 'right' ? 'text-right' : ''}`}>
                      <span className="text-3xl font-bold">£{plan.price}</span>
                      <span className="text-sm ml-1">{billingInterval === 'year' ? '/yr' : '/mo'}</span>
                    </div>
                    
                    {/* Credits Badge */}
                    <div className={`mb-4 ${plan.anchor === 'right' ? 'flex justify-end' : ''}`}>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                        plan.anchor === 'left' 
                          ? 'bg-orange-500/30 text-orange-200' 
                          : 'bg-purple-500/30 text-purple-200'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-sm font-semibold">{plan.credits} credits</span>
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => handleSubscribe(plan.id, billingInterval)}
                      className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${plan.buttonGradient} hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg`}
                    >
                      {plan.anchor === 'left' ? 'Get Started' : 'Upgrade to Pro'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // If student, wrap with StudentLayoutWrapper
  if (session?.user?.role === 'STUDENT') {
    return <StudentLayoutWrapper>{content}</StudentLayoutWrapper>
  }

  return content
}
