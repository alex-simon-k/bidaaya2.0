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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">B</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to Bidaaya
            </h1>
            <p className="text-gray-600 text-lg">
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
              className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                selectedRole === 'STUDENT'
                  ? 'border-green-500 bg-green-50 shadow-lg transform scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50 hover:shadow-md'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  selectedRole === 'STUDENT' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <GraduationCap className={`h-8 w-8 ${
                    selectedRole === 'STUDENT' ? 'text-green-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">For Students</h3>
                  <p className="text-gray-600">
                    Find internships and career opportunities
                  </p>
                </div>
              </div>
            </button>
            
            {/* Google Continue Button for Students */}
            {selectedRole === 'STUDENT' && (
              <div className="mt-4">
                <Button
                  onClick={() => handleRoleConfirmation('STUDENT')}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 1c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google as Student
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="text-center py-4">
            <span className="text-gray-400 text-sm bg-white px-4">or</span>
          </div>

          {/* Company Card */}
          <div className="relative">
            <button
              onClick={() => setSelectedRole('COMPANY')}
              disabled={isLoading}
              className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                selectedRole === 'COMPANY'
                  ? 'border-purple-500 bg-purple-50 shadow-lg transform scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 hover:shadow-md'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  selectedRole === 'COMPANY' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <Building2 className={`h-8 w-8 ${
                    selectedRole === 'COMPANY' ? 'text-purple-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">For Companies</h3>
                  <p className="text-gray-600">
                    Post opportunities and find talent
                  </p>
                </div>
              </div>
            </button>
            
            {/* Google Continue Button for Companies */}
            {selectedRole === 'COMPANY' && (
              <div className="mt-4">
                <Button
                  onClick={() => handleRoleConfirmation('COMPANY')}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 1c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google as Company
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          By continuing, you agree to Bidaaya's{' '}
          <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
        </div>
      </div>
    </div>
  )
} 