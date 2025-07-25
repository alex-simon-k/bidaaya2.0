"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { CheckCircle, Sparkles, ArrowRight, Crown } from 'lucide-react'
import { useSessionRefresh } from '@/lib/session-utils'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, update } = useSession()
  const { refreshSession } = useSessionRefresh()
  const [isLoading, setIsLoading] = useState(true)
  const [planName, setPlanName] = useState('')

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Refresh session immediately on success page load
    const refreshAndDetectPlan = async () => {
      console.log('🎉 Success page loaded, refreshing session for updated subscription data...')
      
      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Refresh session to get latest subscription data
      await refreshSession()
      
      // Wait another moment for the refresh to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsLoading(false)
      
      // Try to detect plan from updated user data
      const userRole = session?.user?.role
      const subscriptionPlan = (session?.user as any)?.subscriptionPlan
      
      console.log('Success page - Updated subscription plan:', subscriptionPlan)
      
      if (subscriptionPlan === 'STUDENT_PREMIUM') {
        setPlanName('Student Premium')
      } else if (subscriptionPlan === 'STUDENT_PRO') {
        setPlanName('Student Pro')
      } else if (subscriptionPlan === 'COMPANY_BASIC') {
        setPlanName('Company Basic')
      } else if (subscriptionPlan === 'COMPANY_PRO') {
        setPlanName('Company Pro')
      } else if (subscriptionPlan === 'COMPANY_PREMIUM') {
        setPlanName('Company Premium')
      } else if (userRole === 'COMPANY') {
        setPlanName('Company Premium')
      } else {
        setPlanName('Student Premium')
      }
    }

    refreshAndDetectPlan()
  }, [refreshSession, session])

  const handleContinue = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Processing your subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-12 text-center text-white relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="mb-6"
          >
            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-3xl font-bold mb-2"
          >
            Payment Successful!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-emerald-100 text-lg"
          >
            Welcome to {planName}
          </motion.p>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* Content */}
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-yellow-500" />
              <span className="text-gray-700 font-semibold">Premium Features Unlocked</span>
            </div>
            
            <p className="text-gray-600 leading-relaxed">
              Your subscription is now active and you have access to all premium features. 
              Start exploring your enhanced dashboard!
            </p>
          </motion.div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="space-y-3 mb-8"
          >
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span className="text-gray-700 text-sm">AI-powered features enabled</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700 text-sm">Unlimited access unlocked</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
              <Crown className="h-5 w-5 text-purple-600" />
              <span className="text-gray-700 text-sm">Priority support activated</span>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            onClick={handleContinue}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2"
          >
            Continue to Dashboard
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
          <p className="text-gray-500 text-sm">
            Questions? Contact our support team anytime
          </p>
        </div>
      </motion.div>
    </div>
  )
} 