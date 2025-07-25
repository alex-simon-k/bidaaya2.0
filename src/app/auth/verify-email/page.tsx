'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        return
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          throw new Error('Verification failed')
        }

        setStatus('success')
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } catch (error) {
        setStatus('error')
      }
    }

    verifyEmail()
  }, [token, router])

  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />,
          title: 'Verifying Your Email',
          message: 'Please wait while we verify your email address...',
          bgColor: 'from-blue-500 to-indigo-600',
          textColor: 'text-blue-100'
        }
      case 'success':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-emerald-600" />,
          title: 'Email Verified Successfully!',
          message: 'Your email has been verified. Redirecting to your dashboard...',
          bgColor: 'from-emerald-500 to-teal-600',
          textColor: 'text-emerald-100'
        }
      case 'error':
        return {
          icon: <XCircle className="h-12 w-12 text-red-600" />,
          title: 'Verification Failed',
          message: 'The verification link may be invalid or expired. Please try again.',
          bgColor: 'from-red-500 to-pink-600',
          textColor: 'text-red-100'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header Section */}
        <div className={`bg-gradient-to-r ${config.bgColor} px-8 py-12 text-center`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6"
          >
            <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-lg">
              {config.icon}
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-3xl font-bold text-white mb-3"
          >
            {config.title}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`${config.textColor} text-lg leading-relaxed`}
          >
            {config.message}
          </motion.p>
        </div>

        {/* Content Section */}
        <div className="px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center"
          >
            {status === 'loading' && (
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Mail className="text-white h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Processing Verification</h3>
                  <p className="text-sm text-gray-600">This should only take a moment</p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                    <CheckCircle2 className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Welcome to Bidaaya!</h3>
                    <p className="text-sm text-gray-600">Your account is now active</p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-center gap-2 text-emerald-700">
                    <ArrowRight className="h-4 w-4" />
                    <span className="text-sm font-medium">Redirecting to dashboard in 3 seconds...</span>
                  </div>
                </motion.div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center">
                    <XCircle className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Verification Issue</h3>
                    <p className="text-sm text-gray-600">Please check your verification link</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/auth/login')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300"
                >
                  Back to Sign In
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
} 