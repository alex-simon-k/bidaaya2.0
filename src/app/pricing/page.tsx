'use client'

import { useSession } from 'next-auth/react'
import { Check, Zap } from 'lucide-react'
import { StudentLayoutWrapper } from '@/components/student-layout-wrapper'
import { PRICING_PLANS, getPricingPlans } from '@/lib/pricing'

export default function PricingPage() {
  const { data: session } = useSession()

  const handleSubscribe = (planId: string) => {
    // Map plan IDs to env variable names
    const stripePriceIds: Record<string, string | undefined> = {
      'student_premium': process.env.NEXT_PUBLIC_STRIPE_STUDENT_PREMIUM_MONTHLY,
      'student_pro': process.env.NEXT_PUBLIC_STRIPE_STUDENT_PRO_MONTHLY,
    }

    const stripeLink = stripePriceIds[planId]
    
    if (!stripeLink) {
      alert('Payment link not configured yet. Please contact support.')
      return
    }
    
    // Redirect to Stripe checkout
    window.location.href = stripeLink
  }

  const studentPlans = getPricingPlans('STUDENT')

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
          {studentPlans.map((plan) => {
            const planAny = plan as any
            return (
            <div
              key={plan.id}
              className={`relative bg-bidaaya-light/5 border rounded-2xl p-6 ${
                planAny.popular
                  ? 'border-bidaaya-accent shadow-lg shadow-bidaaya-accent/20'
                  : 'border-bidaaya-light/10'
              }`}
            >
              {planAny.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-bidaaya-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
              )}

              {planAny.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {planAny.badge}
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
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </div>
                <p className="text-sm text-bidaaya-light/60">
                  {planAny.credits} credits / month
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.slice(0, 6).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-bidaaya-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-bidaaya-light/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.price === 0 ? (
                <div className="w-full py-3 rounded-xl font-semibold text-center bg-bidaaya-light/10 text-bidaaya-light/50">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    planAny.popular
                      ? 'bg-bidaaya-accent text-white hover:bg-bidaaya-accent/90'
                      : 'bg-bidaaya-light/10 text-bidaaya-light hover:bg-bidaaya-light/20'
                  }`}
                >
                  Subscribe Now
                </button>
              )}
            </div>
          )})}
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
