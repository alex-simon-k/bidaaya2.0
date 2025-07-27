'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StudentPaywallModal } from '@/components/student-paywall-modal'
import { CompanyPaywallModal } from '@/components/company-paywall-modal'
import CompanyOnboardingChecklist from '@/components/company-onboarding-checklist'
import { MembershipSelectionPopup } from '@/components/membership-selection-popup'
import { 
  BookOpen, 
  FileText, 
  User, 
  Plus, 
  TrendingUp, 
  Users, 
  Shield, 
  Briefcase,
  Target,
  Star,
  Calendar,
  Award
} from 'lucide-react'
import { UsageStatsCard } from '@/components/upgrade-prompt'
import { DashboardStatsWidget } from '@/components/dashboard-stats-widget'
import { useSessionRefresh } from '@/lib/session-utils'
import { useRouter, useSearchParams } from 'next/navigation'


export default function DashboardPage() {
  const { data: session, status, update } = useSession()
  const { refreshSession: refreshSessionUtils } = useSessionRefresh()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userRole = session?.user?.role
  const [showPaywallModal, setShowPaywallModal] = useState(false)
  const [showCompanyPaywallModal, setShowCompanyPaywallModal] = useState(false)
  const [showOnboardingChecklist, setShowOnboardingChecklist] = useState(false)
  const [showMembershipPopup, setShowMembershipPopup] = useState(false)

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard - Session status:', status)
    console.log('Dashboard - User role:', userRole)
    console.log('Dashboard - Subscription plan:', (session?.user as any)?.subscriptionPlan)
  }





  // Check for subscription success and refresh session
  useEffect(() => {
    const success = searchParams.get('success')
    const upgraded = searchParams.get('upgraded')
    
    if (success === 'true' || upgraded === 'true') {
      console.log('🎉 Subscription success detected, refreshing session...')
      
      // Wait a moment for webhook to process, then refresh
      setTimeout(async () => {
        await refreshSessionUtils()
        console.log('✅ Session refreshed after subscription success')
        // Clean up URL parameters
        router.replace('/dashboard', { scroll: false })
      }, 2000)
    }
  }, [searchParams, refreshSessionUtils, router])



  // Show membership selection popup every time they visit dashboard
  useEffect(() => {
    console.log('Membership popup check - session?.user?.role:', session?.user?.role)
    
    if (session?.user?.role === 'STUDENT' || session?.user?.role === 'COMPANY') {
      // Show membership selection popup
      console.log('Showing membership popup for:', session.user.role)
      setShowMembershipPopup(true)
    }
  }, [session])

  // Show onboarding checklist for companies
  useEffect(() => {
    if (session?.user?.role === 'COMPANY') {
      setShowOnboardingChecklist(true);
    }
  }, [session]);

  if (status === "loading") return <div>Loading...</div>

  // Show if no session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-red-500 to-pink-600 px-8 py-12 text-center">
            <Shield className="h-16 w-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Session Not Found
            </h2>
            <p className="text-red-100">
              Unable to load user session data.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Show if no user role
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-12 text-center">
            <User className="h-16 w-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Welcome, {session?.user?.name}!
            </h2>
            <p className="text-blue-100 mb-4">
              Your account is being set up. User role: {userRole || 'Not set'}
            </p>
          </div>
          <div className="px-8 py-6">
            <p className="text-sm text-gray-500 text-center">
              Session data: {JSON.stringify(session, null, 2)}
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  const studentContent = (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6"
            >
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-lg">
                <Target className="text-white h-8 w-8" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-3xl font-bold text-white mb-3"
            >
              Welcome back, {session?.user?.name?.split(' ')[0]}!
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-emerald-100 text-lg leading-relaxed mb-6"
            >
              Find your next internship opportunity and start building your career
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl shadow-lg hover:bg-white/30 transition-all duration-300 border border-white/20"
              >
                <BookOpen className="h-5 w-5" />
                Browse Projects
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Dashboard Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Usage Stats Card */}
          <div className="lg:col-span-1">
            <UsageStatsCard />
          </div>

          {/* Applications Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="text-white h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Your Applications</h3>
                  <p className="text-gray-600 text-sm">Track your progress</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Track the status of your project applications and stay updated on your opportunities.
              </p>
              
              <Link
                href="/dashboard/applications"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group-hover:gap-3 transition-all duration-300"
              >
                View Applications
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="text-white h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Your Profile</h3>
                  <p className="text-gray-600 text-sm">Stand out to employers</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Keep your profile up to date to increase your chances of landing great opportunities.
              </p>
              
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold group-hover:gap-3 transition-all duration-300"
              >
                Update Profile
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )

  const companyContent = (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6"
            >
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-lg">
                <Briefcase className="text-white h-8 w-8" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-3xl font-bold text-white mb-3"
            >
              Welcome back, {session?.user?.name?.split(' ')[0]}!
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-blue-100 text-lg leading-relaxed mb-6"
            >
              Post new projects and manage your existing opportunities
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl shadow-lg hover:bg-white/30 transition-all duration-300 border border-white/20"
              >
                <Plus className="h-5 w-5" />
                Post New Project
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Onboarding Checklist */}
        {showOnboardingChecklist && (
          <CompanyOnboardingChecklist
            companyName={session?.user?.name || "Your Company"}
            onDismiss={() => setShowOnboardingChecklist(false)}
          />
        )}

        {/* Dashboard Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Active Projects Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="text-white h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Active Projects</h3>
                  <p className="text-gray-600 text-sm">Manage opportunities</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Manage your current projects and review applications from talented students.
              </p>
              
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold group-hover:gap-3 transition-all duration-300"
              >
                View Projects
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Company Profile Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="text-white h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Company Profile</h3>
                  <p className="text-gray-600 text-sm">Attract top talent</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Update your company information and preferences to attract the best candidates.
              </p>
              
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold group-hover:gap-3 transition-all duration-300"
              >
                Update Profile
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )

  const adminContent = (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6"
            >
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-lg">
                <Shield className="text-white h-8 w-8" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-3xl font-bold text-white mb-3"
            >
              Welcome back, Admin!
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-purple-100 text-lg leading-relaxed"
            >
              Manage projects, applications, and user accounts across the platform
            </motion.p>
          </div>
        </motion.div>

        {/* Dashboard Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Projects Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="text-white h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Projects</h3>
                  <p className="text-gray-600 text-sm">Platform oversight</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Review and manage all projects across the platform.
              </p>
              
              <Link
                href="/admin/projects"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold group-hover:gap-3 transition-all duration-300"
              >
                Manage Projects
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Applications Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="text-white h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Applications</h3>
                  <p className="text-gray-600 text-sm">Review submissions</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Review and process applications from students.
              </p>
              
              <Link
                href="/dashboard/applications"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group-hover:gap-3 transition-all duration-300"
              >
                Manage Applications
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Users Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="text-white h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Users</h3>
                  <p className="text-gray-600 text-sm">Account management</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Manage user accounts and permissions.
              </p>
              
              <Link
                href="/dashboard/users"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold group-hover:gap-3 transition-all duration-300"
              >
                Manage Users
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )

  const handleCompanyPlanSelect = async (planId: string, price: number) => {
    console.log('Company selected plan:', planId, 'price:', price)
    
    if (!session) {
      window.location.href = '/auth/login'
      return
    }

    try {
      if (price === 0) {
        // Handle free plan - just update user's plan
        const response = await fetch('/api/subscription/free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planId }),
        })

        if (response.ok) {
          setShowCompanyPaywallModal(false)
          console.log(`✅ Successfully upgraded to free ${planId}`)
        } else {
          console.error('❌ Failed to upgrade to free plan')
        }
      } else {
        // Handle paid plans - redirect to Stripe Checkout
        const { getStripePriceId } = await import('@/lib/stripe-config')
        
        const response = await fetch('/api/subscription/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            priceId: getStripePriceId(planId.replace('company_', 'company-'), false), // Convert to kebab-case
            successUrl: `${window.location.origin}/dashboard?success=true`,
            cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
          }),
        })

        if (response.ok) {
          const { url } = await response.json()
          console.log('✅ Redirecting to Stripe checkout:', url)
          window.location.href = url
        } else {
          const errorData = await response.json()
          console.error('❌ Failed to create checkout session:', errorData)
          
          // Show user-friendly error message
          if (errorData.code === 'STRIPE_CONFIG_ERROR' || errorData.code === 'STRIPE_PRICE_ERROR') {
            alert('Payment system is currently being set up. Please try again later or contact support.')
          } else if (errorData.code === 'PRICE_NOT_FOUND') {
            alert('This plan is currently unavailable. Please try a different plan or contact support.')
          } else {
            alert('Unable to start checkout process. Please try again or contact support.')
          }
        }
      }
    } catch (error) {
      console.error('❌ Error selecting plan:', error)
      alert('An unexpected error occurred. Please try again or contact support.')
    }
  }

  const handleCompanyPaywallClose = () => {
    setShowCompanyPaywallModal(false)
  }

  return (
    <>


      {/* Original Dashboard Content */}
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {userRole === 'STUDENT' && studentContent}
          {userRole === 'COMPANY' && companyContent}
          {userRole === 'ADMIN' && adminContent}
        </div>
      </div>

      {/* Membership Selection Popup */}
      <MembershipSelectionPopup
        isOpen={showMembershipPopup}
        onClose={() => setShowMembershipPopup(false)}
        userRole={userRole as 'STUDENT' | 'COMPANY'}
        userName={session?.user?.name || 'User'}
      />

      {/* Paywall Modal - Temporarily disabled for testing */}
      {/*
      <StudentPaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        promptConfig={{
          title: "Upgrade Required",
          description: "You need to upgrade to access this feature."
        }}
      />
      */}
    </>
  )
} 