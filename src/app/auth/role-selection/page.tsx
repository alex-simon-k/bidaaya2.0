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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Return null if unauthenticated and not in onboarding
  if (!session && !shouldProtect) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Choose Your Account Type
          </h1>
          <p className="text-lg text-gray-600">
            Select how you'll be using Bidaaya
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedRole('STUDENT')}
            disabled={isLoading}
            className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
              selectedRole === 'STUDENT'
                ? 'border-green-500 bg-green-50 shadow-lg'
                : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-center">
              <GraduationCap className={`h-12 w-12 mx-auto mb-4 ${
                selectedRole === 'STUDENT' ? 'text-green-600' : 'text-gray-600'
              }`} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Student</h3>
              <p className="text-sm text-gray-600">
                Looking for opportunities and building your career
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('COMPANY')}
            disabled={isLoading}
            className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
              selectedRole === 'COMPANY'
                ? 'border-purple-500 bg-purple-50 shadow-lg'
                : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-center">
              <Building2 className={`h-12 w-12 mx-auto mb-4 ${
                selectedRole === 'COMPANY' ? 'text-purple-600' : 'text-gray-600'
              }`} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Company</h3>
              <p className="text-sm text-gray-600">
                Hiring talented students and posting opportunities
              </p>
            </div>
          </button>
        </div>

        {selectedRole && (
          <div className="mt-8">
            <Button
              onClick={() => handleRoleConfirmation(selectedRole)}
              disabled={isLoading}
              className={`w-full py-4 text-lg font-semibold ${
                selectedRole === 'STUDENT'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Setting up your account...
                </>
              ) : (
                <>
                  Continue as {selectedRole === 'STUDENT' ? 'Student' : 'Company'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 