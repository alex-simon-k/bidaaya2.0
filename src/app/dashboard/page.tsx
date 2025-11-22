'use client'

import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  MessageCircle,
  FileText,
  Building2,
  Star,
  Zap,
  Target,
  ArrowRight
} from 'lucide-react'

// Import components based on user role
import AIDashboardChat from '@/components/ai-dashboard-chat'
import StudentProposalChat from '@/components/student-proposal-chat'
import CompanyProposalsInbox from '@/components/company-proposals-inbox'
import { MembershipSelectionPopup } from '@/components/membership-selection-popup'
import CreditBalanceWidget from '@/components/credit-balance-widget'
import AIChatBot from '@/components/ai-chat-bot'
import { AIAssistantCard } from '@/components/ui/ai-assistant-card'
import { OpportunityDashboard } from '@/components/opportunity-dashboard'
import { ChatWidget } from '@/components/ui/chat-widget'
import { BottomNavigation } from '@/components/ui/bottom-navigation'

interface DashboardStats {
  applications: number
  projects: number
  connections: number
  proposals?: number
}

export default function DashboardPage() {
  const { data: session, status, update } = useSession()
  const searchParams = useSearchParams()
  const cvEditParam = searchParams.get('cv_edit') // Check if user wants to edit CV
  const [stats, setStats] = useState<DashboardStats>({
    applications: 0,
    projects: 0,
    connections: 0,
    proposals: 0
  })
  const [showMembershipPopup, setShowMembershipPopup] = useState(false)
  // Get onboarding phase from session first, fallback to state
  const sessionOnboardingPhase = (session?.user as any)?.onboardingPhase
  const [onboardingPhase, setOnboardingPhase] = useState<string>(sessionOnboardingPhase || 'structured_chat')
  const [chatWidgetOpen, setChatWidgetOpen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  const userRole = (session?.user as any)?.role
  
  // Sync local state with session onboarding phase
  useEffect(() => {
    if (sessionOnboardingPhase) {
      console.log('📌 Dashboard: Syncing onboarding phase from session:', sessionOnboardingPhase)
      setOnboardingPhase(sessionOnboardingPhase)
    }
  }, [sessionOnboardingPhase])

  // Only check onboarding phase on initial load, not on every session change
  useEffect(() => {
    if (session?.user && !sessionOnboardingPhase) {
      // Only fetch from DB if session doesn't have the phase
      console.log('📊 Session missing onboarding phase, fetching from DB...')
      checkOnboardingPhase()
    }
  }, [session?.user])
  
  useEffect(() => {
    if (session?.user) {
      loadDashboardStats()
    }
  }, [session])

  const checkOnboardingPhase = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        const dbPhase = data.profile.onboardingPhase || 'structured_chat'
        console.log('📊 Fetched onboarding phase from DB:', dbPhase)
        setOnboardingPhase(dbPhase)
      }
    } catch (error) {
      console.error('Failed to check onboarding phase:', error)
      setOnboardingPhase('structured_chat')
    }
  }

  const handlePhase1Complete = async () => {
    // Phase 1 completed - transition to Phase 2 (CV Building)
    console.log('✅ Phase 1 complete, transitioning to Phase 2 (CV Building)...')
    
    // Update local state immediately for instant transition
    setOnboardingPhase('cv_building')
    
    // Refresh session to ensure it has the updated onboardingPhase
    await update()
    
    // DON'T re-fetch from DB - causes race condition where old phase is fetched
    console.log('🎯 Phase 1 → Phase 2 transition complete')
  }

  const handlePhase2Complete = async () => {
    setOnboardingPhase('complete')
  }

  // Show membership popup every 30 minutes for students and companies
  // BUT NOT during Phase 1 onboarding
  useEffect(() => {
    if (session?.user?.role === 'STUDENT' || session?.user?.role === 'COMPANY') {
      // Don't show popup during Phase 1 onboarding
      if (onboardingPhase === 'structured_chat') {
        return
      }
      
      const lastShownKey = `membership_popup_last_shown_${session.user.email}`
      const lastShown = localStorage.getItem(lastShownKey)
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000) // 30 minutes in milliseconds
      
      if (!lastShown || parseInt(lastShown) < thirtyMinutesAgo) {
        // Show membership popup after a short delay
        const timer = setTimeout(() => {
          setShowMembershipPopup(true)
          localStorage.setItem(lastShownKey, Date.now().toString())
        }, 5000) // 5 second delay after page load
        
        return () => clearTimeout(timer)
      }
    }
  }, [session, onboardingPhase])

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Student Dashboard - Three-Phase Onboarding
  if (userRole === 'STUDENT') {
    // Phase 2: CV Building Chat (Conversational, with sidebar unlocked but features locked)
    // Also show CV builder if user clicked "+" to edit CV from CV page
    if (onboardingPhase === 'cv_building' || cvEditParam) {
      return (
        <>
          <div className="flex h-screen w-screen overflow-hidden bg-bidaaya-dark fixed inset-0">
            <AIAssistantCard />
          </div>

          {/* Membership Popup */}
          <MembershipSelectionPopup
            isOpen={showMembershipPopup}
            onClose={() => setShowMembershipPopup(false)}
            userRole="STUDENT"
            userName={session?.user?.name?.split(' ')[0] || 'Student'}
          />
        </>
      )
    }

    // Phase 1 & 3: Show Opportunity Dashboard
    // Phase 1 questions appear as modal overlay on top of dashboard
    return (
      <>
        <OpportunityDashboard
          onChatClick={() => setChatWidgetOpen(!chatWidgetOpen)}
          onSidebarClick={() => setShowSidebar(!showSidebar)}
        />

        {/* Phase 1 removed - users go directly to Phase 2 (CV builder) or Phase 3 (dashboard) */}

        {/* Chat Widget - ONLY show when NOT in Phase 1 */}
        {onboardingPhase !== 'structured_chat' && (
          <ChatWidget
            isOpen={chatWidgetOpen}
            onToggle={() => setChatWidgetOpen(!chatWidgetOpen)}
          />
        )}

        {/* Membership Popup - ONLY show when NOT in Phase 1 */}
        {onboardingPhase !== 'structured_chat' && (
          <MembershipSelectionPopup
            isOpen={showMembershipPopup}
            onClose={() => setShowMembershipPopup(false)}
            userRole="STUDENT"
            userName={session?.user?.name?.split(' ')[0] || 'Student'}
          />
        )}
      </>
    )
  }

  // Company Dashboard - Full Screen AI Interface
  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Main AI Interface - Full Screen */}
        <AIDashboardChat />
      </div>

      {/* Membership Popup */}
      <MembershipSelectionPopup
        isOpen={showMembershipPopup}
        onClose={() => setShowMembershipPopup(false)}
        userRole="COMPANY"
        userName={session?.user?.name?.split(' ')[0] || 'Company'}
      />
    </>
  )
} 