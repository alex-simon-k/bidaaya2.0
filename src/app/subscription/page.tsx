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

  // Create Stripe checkout session
  const createCheckoutSession = async (plan: string, interval: string) => {
    try {
      // Map plan and interval to planId format
      const planId = `${plan}_${interval}ly` // e.g., "student_premium_monthly"
      
      console.log(`🔄 Creating Stripe checkout session for ${planId}`)
      
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const data = await response.json()
      
      if (data.url) {
        console.log(`✅ Got Stripe checkout URL, redirecting...`)
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      console.error('❌ Checkout error:', err)
      setError(err.message || 'Failed to initiate checkout. Please try again.')
      setIsLoading(false)
    }
  }

  // On mount, check if we have plan/interval params and create checkout session
  useEffect(() => {
    const plan = searchParams.get('plan')
    const interval = searchParams.get('interval')
    
    if (plan && interval) {
      // We have params from pricing page - create Stripe checkout session
      createCheckoutSession(plan, interval)
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