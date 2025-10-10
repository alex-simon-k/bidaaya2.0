'use client'

import { useSession } from 'next-auth/react'
import { Check, Zap } from 'lucide-react'
import { StudentLayoutWrapper } from '@/components/student-layout-wrapper'

const STUDENT_PLANS = [
  {
    name: '20 Credits',
    credits: 20,
    price: '$9.99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_20_CREDITS_PRICE_ID,
    features: [
      '20 credits per month',
      'Apply to internal projects',
      'Send proposals to companies',
      'Basic AI CV builder',
      'Email support'
    ]
  },
  {
    name: '50 Credits',
    credits: 50,
    price: '$19.99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_50_CREDITS_PRICE_ID,
    popular: true,
    features: [
      '50 credits per month',
      'Priority application review',
      'Advanced AI CV builder',
      'Cover letter generator',
      'Career coaching access',
      'Priority support'
    ]
  },
  {
    name: '100 Credits',
    credits: 100,
    price: '$34.99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_100_CREDITS_PRICE_ID,
    features: [
      '100 credits per month',
      'Unlimited applications',
      'Premium AI tools',
      'Interview preparation',
      '1-on-1 mentorship',
      'Dedicated support',
      'Early access to features'
    ]
  }
]

export default function PricingPage() {
  const { data: session } = useSession()

  const handleSubscribe = (priceId: string | undefined) => {
    if (!priceId) {
      alert('Payment link not configured yet')
      return
    }
    // Redirect to Stripe checkout
    window.location.href = priceId
  }

  const content = (
    <div className="w-full pt-16 px-4 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-bidaaya-light mb-2">
            Choose Your Plan
          </h1>
          <p className="text-bidaaya-light/60">
            Get more credits to unlock opportunities
          </p>
        </div>

        {/* Pricing Cards - All visible on one screen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {STUDENT_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-bidaaya-light/5 border rounded-2xl p-6 ${
                plan.popular
                  ? 'border-bidaaya-accent shadow-lg shadow-bidaaya-accent/20'
                  : 'border-bidaaya-light/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-bidaaya-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-bidaaya-accent" />
                  <h3 className="text-xl font-bold text-bidaaya-light">
                    {plan.name}
                  </h3>
                </div>
                <div className="text-3xl font-bold text-bidaaya-light mb-1">
                  {plan.price}
                </div>
                <p className="text-sm text-bidaaya-light/60">per month</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-bidaaya-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-bidaaya-light/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.priceId)}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? 'bg-bidaaya-accent text-white hover:bg-bidaaya-accent/90'
                    : 'bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20'
                }`}
              >
                Subscribe Now
              </button>
            </div>
          ))}
        </div>

        {/* Credit Costs Info */}
        <div className="mt-8 max-w-2xl mx-auto bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-bidaaya-light mb-4 text-center">
            How Credits Work
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-bidaaya-accent mb-1">5</div>
              <p className="text-sm text-bidaaya-light/70">Internal Application</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-bidaaya-accent mb-1">7</div>
              <p className="text-sm text-bidaaya-light/70">Company Proposal</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-bidaaya-accent mb-1">10</div>
              <p className="text-sm text-bidaaya-light/70">Custom CV Build</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // If student, wrap with StudentLayoutWrapper
  if (session?.user?.role === 'STUDENT') {
    return <StudentLayoutWrapper>{content}</StudentLayoutWrapper>
  }

  // Otherwise render directly
  return content
}
