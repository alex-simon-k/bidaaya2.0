'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Building2, GraduationCap, Loader2 } from 'lucide-react'
import { OnboardingSessionManager, useOnboardingSession } from '@/lib/onboarding-session-manager'

export default function RoleSelectionPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'COMPANY' | null>(null)

  // Use onboarding session manager
  const { 
    isInOnboarding, 
    currentState, 
    shouldProtect, 
    updateStep, 
    setUserRole
  } = useOnboardingSession()

  // Start onboarding session if not already started
  useEffect(() => {
    if (session?.user?.email && !isInOnboarding) {
      OnboardingSessionManager.startOnboarding(session.user.email, 'role-selection')
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

  // Handle authentication - only redirect if not in onboarding
  useEffect(() => {
    if (status === 'loading') return

    if (!session && !shouldProtect) {
      console.log('🔐 User not authenticated and not in onboarding, redirecting to login')
      router.push('/auth/login')
      return
    } else if (!session && shouldProtect) {
      console.log('🛡️ User not authenticated but in onboarding - protecting from redirect')
    }
  }, [session, status, router, shouldProtect])

  const handleRoleConfirmation = async (role: 'STUDENT' | 'COMPANY') => {
    if (!session?.user?.email) return

    setIsLoading(true)
    try {
      console.log(`🎯 Setting user role to: ${role}`)

      // Update user role in database
      const response = await fetch('/api/user/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: session.user.email,
          role 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to set user role')
      }

      const result = await response.json()
      console.log('✅ Role update response:', result)

      // Update onboarding session - use direct method with safety
      try {
        OnboardingSessionManager.setUserRole(role)
        OnboardingSessionManager.updateStep('profile-setup')
      } catch (sessionError) {
        console.warn('Failed to update onboarding session:', sessionError)
        // Continue with the flow even if session update fails
      }

      // Force session refresh to reflect the new role
      await update()

      console.log(`✅ User role set to ${role}`)

      // Route to appropriate onboarding flow
      if (role === 'COMPANY') {
        router.push('/onboarding/company')
      } else {
        router.push('/auth/setup-profile')
      }
    } catch (error) {
      console.error('Error setting user role:', error)
      alert('Failed to set user role. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bidaaya-dark via-bidaaya-dark to-blue-950">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-bidaaya-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-bidaaya-light/70">Loading...</p>
        </div>
      </div>
    )
  }

  // Return null if unauthenticated and not in onboarding
  if (!session && !shouldProtect) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bidaaya-dark via-bidaaya-dark to-blue-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-bidaaya-accent/20 to-bidaaya-light/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/20 to-bidaaya-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-12">
            {/* Logo/Brand */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-bidaaya-accent to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">B</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-bidaaya-light mb-3">
                Welcome to Bidaaya
              </h1>
              <p className="text-bidaaya-light/70 text-lg">
                Choose your path to get started
              </p>
            </div>
          </div>

        {/* Role Cards */}
        <div className="space-y-4 mb-8">
          {/* Student Card */}
          <div className="relative">
            <button
              onClick={() => setSelectedRole('STUDENT')}
              disabled={isLoading}
              className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left backdrop-blur-sm ${
                selectedRole === 'STUDENT'
                  ? 'border-emerald-500 bg-bidaaya-light/10 shadow-lg shadow-emerald-500/20 transform scale-[1.02]'
                  : 'border-bidaaya-light/10 bg-bidaaya-light/5 hover:border-emerald-400/50 hover:bg-bidaaya-light/10 hover:shadow-md'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  selectedRole === 'STUDENT' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-bidaaya-light/10'
                }`}>
                  <GraduationCap className={`h-8 w-8 ${
                    selectedRole === 'STUDENT' ? 'text-white' : 'text-bidaaya-light/60'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-bidaaya-light mb-1">For Students</h3>
                  <p className="text-bidaaya-light/70">
                    Find internships and career opportunities
                  </p>
                </div>
              </div>
            </button>
            
            {/* Continue Button for Students */}
            {selectedRole === 'STUDENT' && (
              <div className="mt-4">
                <Button
                  onClick={() => handleRoleConfirmation('STUDENT')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>Continue</>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-bidaaya-light/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-bidaaya-dark text-bidaaya-light/70">or</span>
            </div>
          </div>

          {/* Company Card */}
          <div className="relative">
            <button
              onClick={() => setSelectedRole('COMPANY')}
              disabled={isLoading}
              className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left backdrop-blur-sm ${
                selectedRole === 'COMPANY'
                  ? 'border-purple-500 bg-bidaaya-light/10 shadow-lg shadow-purple-500/20 transform scale-[1.02]'
                  : 'border-bidaaya-light/10 bg-bidaaya-light/5 hover:border-purple-400/50 hover:bg-bidaaya-light/10 hover:shadow-md'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  selectedRole === 'COMPANY' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-bidaaya-light/10'
                }`}>
                  <Building2 className={`h-8 w-8 ${
                    selectedRole === 'COMPANY' ? 'text-white' : 'text-bidaaya-light/60'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-bidaaya-light mb-1">For Companies</h3>
                  <p className="text-bidaaya-light/70">
                    Post opportunities and find talent
                  </p>
                </div>
              </div>
            </button>
            
            {/* Continue Button for Companies */}
            {selectedRole === 'COMPANY' && (
              <div className="mt-4">
                <Button
                  onClick={() => handleRoleConfirmation('COMPANY')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>Continue</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-bidaaya-light/60">
          By continuing, you agree to Bidaaya's{' '}
          <a href="/terms" className="text-bidaaya-accent hover:text-bidaaya-accent/80 underline">Terms of Service</a>{' '}
          and{' '}
          <a href="/privacy" className="text-bidaaya-accent hover:text-bidaaya-accent/80 underline">Privacy Policy</a>
        </div>
        </div>
      </div>
    </div>
  )
} 