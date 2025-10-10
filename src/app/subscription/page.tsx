'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

function SubscriptionPageContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get Stripe price IDs from environment variables
  const getStripeLink = (plan: string, interval: string): string | null => {
    const envKey = `NEXT_PUBLIC_STRIPE_${plan.toUpperCase()}_${interval.toUpperCase()}`
    
    // Map the plan names to env variable names
    const stripeLinks: { [key: string]: string | undefined } = {
      'NEXT_PUBLIC_STRIPE_STUDENT_PREMIUM_MONTHLY': process.env.NEXT_PUBLIC_STRIPE_STUDENT_PREMIUM_MONTHLY,
      'NEXT_PUBLIC_STRIPE_STUDENT_PREMIUM_YEARLY': process.env.NEXT_PUBLIC_STRIPE_STUDENT_PREMIUM_YEARLY,
      'NEXT_PUBLIC_STRIPE_STUDENT_PRO_MONTHLY': process.env.NEXT_PUBLIC_STRIPE_STUDENT_PRO_MONTHLY,
      'NEXT_PUBLIC_STRIPE_STUDENT_PRO_YEARLY': process.env.NEXT_PUBLIC_STRIPE_STUDENT_PRO_YEARLY,
    }
    
    return stripeLinks[envKey] || null
  }

  // On mount, check if we have plan/interval params and redirect to Stripe
  useEffect(() => {
    const plan = searchParams.get('plan')
    const interval = searchParams.get('interval')
    
    if (plan && interval) {
      // We have params from pricing page - redirect to Stripe immediately
      const stripeLink = getStripeLink(plan, interval)
      
      if (stripeLink) {
        console.log(`✅ Redirecting to Stripe for ${plan} (${interval})`)
        window.location.href = stripeLink
      } else {
        console.error(`❌ No Stripe link found for ${plan} (${interval})`)
        setError(`Payment link not configured for ${plan} (${interval}). Please contact support.`)
        setIsLoading(false)
      }
    } else {
      // No params - redirect back to pricing page
      console.log('❌ No plan/interval params - redirecting to pricing')
      router.push('/pricing')
    }
  }, [searchParams, router])

  // Show loading or error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-bidaaya-dark via-bidaaya-dark to-blue-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {isLoading && !error && (
          <>
            <div className="w-16 h-16 border-4 border-bidaaya-accent border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-bidaaya-light mb-2">Redirecting to Stripe...</h2>
            <p className="text-bidaaya-light/60">Please wait while we set up your payment</p>
          </>
        )}
        
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-red-400 mb-2">⚠️ Payment Link Error</h2>
            <p className="text-bidaaya-light/80 mb-4">{error}</p>
            <button
              onClick={() => router.push('/pricing')}
              className="bg-bidaaya-accent hover:bg-bidaaya-accent/80 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Pricing
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-bidaaya-dark via-bidaaya-dark to-blue-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-bidaaya-accent border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-bidaaya-light mb-2">Loading...</h2>
          <p className="text-bidaaya-light/60">Setting up your subscription</p>
        </div>
      </div>
    }>
      <SubscriptionPageContent />
    </Suspense>
  )
} 