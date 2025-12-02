'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { OnboardingSessionManager } from '@/lib/onboarding-session-manager'
import { ChevronDown } from 'lucide-react'
import { StudentLayoutWrapper } from '@/components/student-layout-wrapper'



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hasCheckedRouting, setHasCheckedRouting] = useState(false)
  const [creditInfo, setCreditInfo] = useState<{
    used: number
    remaining: number
    limit: number
    plan: string
    refreshesIn?: number
  } | null>(null)

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('DashboardLayout - Session status:', status)
  }

  // Handle authentication and routing in useEffect
  useEffect(() => {
    console.log('🏠 DashboardLayout - useEffect triggered');
    console.log('🏠 DashboardLayout - useEffect - Status:', status);
    console.log('🏠 DashboardLayout - useEffect - hasCheckedRouting:', hasCheckedRouting);
    
    if (status === 'loading') {
      console.log('🏠 DashboardLayout - Status is loading, waiting...');
      return;
    }
    
    if (hasCheckedRouting) {
      console.log('🏠 DashboardLayout - Routing check completed');
      return;
    }

    const handleRouting = () => {
      console.log('🏠 DashboardLayout handleRouting - Full session data:', session);
      console.log('🏠 DashboardLayout handleRouting - Status:', status);
      console.log('🏠 DashboardLayout handleRouting - User:', session?.user);
      console.log('🏠 DashboardLayout handleRouting - User role:', session?.user?.role);
      
      // Check if user is in onboarding and should be protected
      const isInOnboarding = OnboardingSessionManager.isInActiveOnboarding()
      const shouldProtect = OnboardingSessionManager.shouldProtectFromRedirects()
      
      // Handle unauthenticated status
      if (status === 'unauthenticated') {
        if (shouldProtect) {
          console.log('🛡️ User in onboarding - protecting from login redirect')
          // Get the appropriate redirect URL from onboarding manager
          const redirectUrl = OnboardingSessionManager.getRedirectUrl()
          if (redirectUrl && redirectUrl !== '/dashboard') {
            console.log('🔄 Redirecting to onboarding step:', redirectUrl)
            router.replace(redirectUrl)
          }
          return
        } else {
          console.log('🏠 DashboardLayout - Status is unauthenticated, redirecting to login')
            router.replace('/auth/login');
          return;
        }
      }

      if (!session) {
        if (shouldProtect) {
          console.log('🛡️ No session but in onboarding - protecting from redirect')
          const redirectUrl = OnboardingSessionManager.getRedirectUrl()
          if (redirectUrl && redirectUrl !== '/dashboard') {
            console.log('🔄 Redirecting to onboarding step:', redirectUrl)
            router.replace(redirectUrl)
          }
          return
        } else {
          console.log('🏠 DashboardLayout - No session object, redirecting to login')
            router.replace('/auth/login');
          return;
        }
      }

      if (!session.user) {
        console.log('🏠 DashboardLayout - No session.user, redirecting to login')
        router.replace('/auth/login');
        return;
      }

      if (session?.user) {
        const sessionData = session as any;
        console.log('🏠 DashboardLayout - Session data analysis:', {
          emailVerified: sessionData.emailVerified,
          needsVerification: sessionData.needsVerification,
          userRole: session.user.role,
          profileCompleted: sessionData.profileCompleted
        });
        
        // Skip all verification checks for ADMIN users
        if (session.user.role === 'ADMIN') {
          console.log('🏠 DashboardLayout - ✅ ADMIN user detected, skipping all verification checks');
          setHasCheckedRouting(true);
          return;
        }
        
        // Check for corrupted session - user exists but no role data
        if (!session.user.role && sessionData.emailVerified === undefined) {
          console.log('🚨 Detected corrupted session - no role or verification data. Signing out to force fresh session.');
          signOut({ 
            callbackUrl: '/auth/login',
            redirect: true 
          });
          return;
        }
        
        // Check if user needs verification (new users or unverified users)
        if (sessionData.needsVerification && !sessionData.emailVerified) {
          console.log('🏠 DashboardLayout - User needs email verification, redirecting to verify-code')
          router.replace('/auth/verify-code');
          return;
        }

        // Check if user is verified but doesn't have a role or profile completed
        if (sessionData.emailVerified) {
          console.log('🏠 DashboardLayout - User is email verified, checking role and profile...');
          
          // If user doesn't have a role, redirect to role selection
          if (!session.user.role || session.user.role === null) {
            console.log('🏠 DashboardLayout - User verified but no role, redirecting to role selection')
            router.replace('/auth/role-selection');
            return;
          }

          console.log('🏠 DashboardLayout - User has role:', session.user.role, 'checking profile completion...');

          // If user has role but profile not completed
          // Handle both boolean and string values for profileCompleted
          const isProfileCompleted = sessionData.profileCompleted === true || sessionData.profileCompleted === 'true';
          console.log('🏠 DashboardLayout - Profile completion check:', {
            rawValue: sessionData.profileCompleted,
            type: typeof sessionData.profileCompleted,
            isCompleted: isProfileCompleted
          });
          
          if (!isProfileCompleted) {
            console.log('🏠 DashboardLayout - Profile not completed, profileCompleted value:', sessionData.profileCompleted);
            if (session.user.role === 'STUDENT') {
              console.log('🏠 DashboardLayout - Student needs to complete profile')
              router.replace('/auth/setup-profile');
              return;
            } else if (session.user.role === 'COMPANY') {
              console.log('🏠 DashboardLayout - Company needs to complete onboarding')
              router.replace('/onboarding/company');
              return;
            }
          }

          console.log('🏠 DashboardLayout - Profile is completed, profileCompleted value:', sessionData.profileCompleted);

          // Phase 2 enforcement is now handled by middleware only for restricted actions
          // Users can browse dashboard freely, but will be redirected when trying to apply/chat

          // No special Calendly flow handling needed anymore

          // User is fully set up, can access dashboard
          console.log('🏠 DashboardLayout - ✅ User is fully set up, allowing dashboard access');
        } else {
          console.log('🏠 DashboardLayout - User not email verified, but emailVerified is:', sessionData.emailVerified);
        }
      }
      
      console.log('🏠 DashboardLayout - Marking routing as checked');
      setHasCheckedRouting(true);
    };

    handleRouting();
  }, [session, status, router, hasCheckedRouting])

  // Fetch credit information for companies
  useEffect(() => {
    const fetchCreditInfo = async () => {
      if (session?.user?.role === 'COMPANY') {
        try {
          const response = await fetch('/api/company/credits')
          if (response.ok) {
            const data = await response.json()
            setCreditInfo(data)
          }
        } catch (error) {
          console.error('Failed to fetch credit info:', error)
        }
      }
    }

    if (session?.user?.role === 'COMPANY') {
      fetchCreditInfo()
      // Refresh credit info every 30 seconds
      const interval = setInterval(fetchCreditInfo, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  // Show loading state
  if (status === 'loading' || !hasCheckedRouting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">Loading your dashboard...</p>
            <div className="flex items-center justify-center gap-1">
              <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="h-1 w-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while redirecting
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // For STUDENT users, use the StudentLayoutWrapper for all pages except the main dashboard
  if (session?.user?.role === 'STUDENT') {
    // Main dashboard has its own layout (AIAssistantCard with sidebar)
    if (pathname === '/dashboard') {
      return <>{children}</>;
    }
    // All other pages use the wrapper with sidebar
    return <StudentLayoutWrapper>{children}</StudentLayoutWrapper>;
  }

  return (
    <div className={`min-h-screen ${session?.user?.role === 'COMPANY' ? 'bg-white' : 'bg-gray-50'}`}>
      {/* Header - Mobile Optimized - Now available for all users */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg overflow-hidden">
                      <img 
                        src="/android-chrome-512x512.png" 
                        alt="Bidaaya Logo" 
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="hidden sm:inline">Bidaaya</span>
                  </Link>
                </h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Credit Counter for Companies */}
                {session?.user?.role === 'COMPANY' && creditInfo && (
                  <div className="hidden sm:flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <div className="text-center">
                      <div className="text-xs text-blue-600 font-medium">Credits</div>
                      <div className="text-sm font-bold text-blue-800">
                        {creditInfo.remaining}/{creditInfo.limit}
                      </div>
                      <div className="text-xs text-blue-500">
                        {creditInfo.plan}
                        {creditInfo.refreshesIn && (
                          <div className="text-xs text-blue-400 mt-0.5">
                            Refills in {creditInfo.refreshesIn}d
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mobile Credit Counter */}
                {session?.user?.role === 'COMPANY' && creditInfo && (
                  <div className="sm:hidden flex items-center bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                    <div className="text-xs text-blue-800 font-bold">
                      {creditInfo.remaining}/{creditInfo.limit}
                    </div>
                  </div>
                )}
                
                {/* User Profile Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-xs sm:text-sm">
                        {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                        {session?.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-32">
                        {session?.user?.email}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

      {/* Mobile Menu - Now available for all users */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-30 sm:hidden" 
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="bg-white shadow-lg border-b relative z-40">
          <div className="px-4 py-3 space-y-1">
            {/* User info on mobile */}
            <div className="sm:hidden border-b border-gray-100 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-sm text-gray-500">{session.user.role}</p>
                </div>
              </div>
            </div>
            
            <Link 
              href="/dashboard" 
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              🏠 Dashboard
            </Link>
            
            {/* Company-specific navigation */}
            {session.user.role === 'COMPANY' && (
              <>
                <Link 
                  href="/dashboard?clear=true" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  🔍 Browse Students
                </Link>
                <Link 
                  href="/dashboard/projects/new" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                >
                  ➕ Create Project
                </Link>
                <Link 
                  href="/dashboard/projects" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  💼 My Projects
                </Link>
                <Link 
                  href="/dashboard/proposals" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  📧 Proposals Inbox
                </Link>
                <Link 
                  href="/dashboard/company-profile" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ⚙️ Company Profile
                </Link>
              </>
            )}
            
            {/* Student-specific navigation - Extensive menu matching student-layout-wrapper */}
            {session.user.role === 'STUDENT' && (
              <>
                <Link 
                  href="/dashboard/companies" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  🏢 Companies
                  <span className="ml-2 text-xs">🔒</span>
                </Link>
                <Link 
                  href="/dashboard/profile" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  👤 Profile
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    alert('🔒 Jobless Meter feature coming soon! Compare your streaks and scores with friends, see who\'s leading, and stay motivated together.');
                  }}
                  className="block w-full text-left px-3 py-3 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  👥 Jobless Meter
                  <span className="ml-2 text-xs">🔒</span>
                </button>
                <Link 
                  href="/dashboard/applications" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  📝 Applications
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    alert('🔒 My CVs feature is currently locked. This feature will be available soon.')
                  }}
                  className="block w-full text-left px-3 py-3 text-base font-medium text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  📄 My CVs 🔒
                </button>
                <Link 
                  href="/student/subscription" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  💎 Land an Internship Faster
                </Link>
                <Link 
                  href="/student/settings" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ⚙️ Settings & Credits
                </Link>
              </>
            )}
            {session.user.role === 'ADMIN' && (
              <>
                <Link 
                  href="/admin/dashboard" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-semibold"
                >
                  🎯 Admin Command Center
                </Link>
                <Link 
                  href="/admin/companies" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                >
                  🏢 Manage Companies
                </Link>
                <Link 
                  href="/dashboard/ai-analysis" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  🔧 Student Processing
                </Link>
                <Link 
                  href="/admin-panel" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  ⚙️ Admin Panel
                </Link>
              </>
            )}
            
            {/* Sign out button */}
            <div className="border-t border-gray-100 pt-3 mt-3">
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  signOut({ callbackUrl: '/auth/login' })
                }}
                className="block w-full text-left px-3 py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                🚪 Sign Out
              </button>
            </div>
                       </div>
          </div>
        </>
      )}

      {/* Main content - Mobile Optimized */}
      <main className={`${session?.user?.role === 'COMPANY' ? 'py-4 px-4 sm:py-6 sm:px-6 lg:px-8 bg-white' : 'max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8'} ${session?.user?.role === 'STUDENT' ? 'pb-20 sm:pb-6' : ''}`}>
        {children}
      </main>

      {/* Bottom navigation removed - using hamburger menu instead */}
    </div>
  )
} 