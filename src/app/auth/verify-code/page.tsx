'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { OTPInput, SlotProps } from 'input-otp'
import { OnboardingSessionManager, useOnboardingSession } from '@/lib/onboarding-session-manager'

// Custom Slot component to handle OTP input props properly
function Slot(props: SlotProps) {
  return (
    <div
      className={`w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors flex items-center justify-center ${
        props.isActive ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : ''
      }`}
    >
      {props.char !== null && (
        <div className="text-gray-900 font-bold text-xl">{props.char}</div>
      )}
    </div>
  )
}

export default function VerifyCodePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [canVerify, setCanVerify] = useState(false)

  // Use onboarding session manager
  const { 
    isInOnboarding, 
    currentState, 
    shouldProtect, 
    updateStep, 
    markEmailVerified
  } = useOnboardingSession()

  // Start onboarding session when user arrives
  useEffect(() => {
    if (session?.user?.email && !isInOnboarding) {
      OnboardingSessionManager.startOnboarding(session.user.email, 'verification')
      // Use safe update activity after session is started
      setTimeout(() => {
        OnboardingSessionManager.safeUpdateActivity()
      }, 100)
    }
  }, [session?.user?.email, isInOnboarding])

  // Update activity on user interaction - only when in onboarding
  useEffect(() => {
    if (!isInOnboarding) return

    const handleActivity = () => {
      OnboardingSessionManager.safeUpdateActivity()
    }

    window.addEventListener('click', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity)

    return () => {
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
    }
  }, [isInOnboarding])

  // Check if user is already verified and redirect appropriately
  useEffect(() => {
    // Only run this check once and after the session has loaded
    if (status === 'loading' || hasCheckedStatus) return;
    
    const checkUserStatus = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/auth/check-verification-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 Verification check response:', data);
            
            if (data.isVerified) {
              console.log('✅ User is already verified, marking in onboarding session');
              markEmailVerified()
              
              // Get next step from onboarding manager
              const nextUrl = OnboardingSessionManager.getRedirectUrl()
              if (nextUrl) {
                console.log('🚀 Redirecting to next step:', nextUrl)
                router.replace(nextUrl)
              } else {
                console.log('🚀 Redirecting to dashboard')
                router.replace('/dashboard')
              }
              
              return;
            } else {
              console.log('❌ User is not verified, showing verification form');
            }
          } else {
            console.error('Failed to check verification status:', response.status);
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
        }
      } else {
        console.log('No session email available for verification check');
      }
      
      // If we get here, user needs verification
      setCanVerify(true);
      setHasCheckedStatus(true);
    };

    checkUserStatus();
  }, [session, status, router, hasCheckedStatus, markEmailVerified]);

  // Handle authentication - only redirect if not in onboarding
  useEffect(() => {
    if (status === 'unauthenticated' && !shouldProtect) {
      console.log('🔐 User not authenticated and not in onboarding, redirecting to login')
      setTimeout(() => router.push('/auth/login'), 100);
    } else if (status === 'unauthenticated' && shouldProtect) {
      console.log('🛡️ User not authenticated but in onboarding - protecting from redirect')
    }
  }, [status, router, shouldProtect]);

  // Show loading state while checking verification status or redirecting
  if (status === 'loading' || isRedirecting || !hasCheckedStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {isRedirecting ? 'Redirecting...' : 'Loading...'}
          </p>
        </motion.div>
      </div>
    )
  }

  // Return null if unauthenticated and not in onboarding
  if (status === 'unauthenticated' && !shouldProtect) {
    return null;
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, email: session?.user?.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }

      // Ensure onboarding session exists before updating
      if (!isInOnboarding && session?.user?.email) {
        OnboardingSessionManager.startOnboarding(session.user.email, 'verification')
      }

      // Mark email as verified in onboarding session - use direct method with safety
      try {
        OnboardingSessionManager.markEmailVerified()
        OnboardingSessionManager.updateStep('role-selection')
      } catch (sessionError) {
        console.warn('Failed to update onboarding session:', sessionError)
        // Continue with the flow even if session update fails
      }

      // Redirect to role selection after email verification
      router.push('/auth/role-selection');
    } catch (error) {
      console.error('Verification error:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  // Custom OTP handler
  const handleOtpChange = (val: string) => {
    setCode(val);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
            >
              <span className="text-2xl">📧</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl font-bold text-gray-800 mb-2"
            >
              Verify Your Email
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-gray-600"
            >
              We've sent a verification code to <strong>{session?.user?.email}</strong>
            </motion.p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter the 6-digit code
              </label>
              
              <OTPInput
                value={code}
                onChange={handleOtpChange}
                maxLength={6}
                render={({ slots }) => (
                  <div className="flex gap-2 justify-center">
                    {slots.map((slot, index) => (
                      <Slot key={index} {...slot} />
                    ))}
                  </div>
                )}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={code.length !== 6 || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </div>
              ) : (
                'Verify Email'
              )}
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-500">
              Didn't receive the code?{' '}
              <button
                onClick={() => {
                  // Resend verification code logic here
                  console.log('Resend code clicked')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Resend
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
} 