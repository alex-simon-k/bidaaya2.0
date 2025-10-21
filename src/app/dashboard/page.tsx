'use client'

import { useSession } from 'next-auth/react'
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
import { StructuredOnboardingChat } from '@/components/ui/structured-onboarding-chat'

interface DashboardStats {
  applications: number
  projects: number
  connections: number
  proposals?: number
}

export default function DashboardPage() {
  const { data: session, status, update } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    applications: 0,
    projects: 0,
    connections: 0,
    proposals: 0
  })
  const [showMembershipPopup, setShowMembershipPopup] = useState(false)
  const [onboardingPhase, setOnboardingPhase] = useState<string>('structured_chat')
  const [chatWidgetOpen, setChatWidgetOpen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    if (session?.user) {
      loadDashboardStats()
      checkOnboardingPhase()
    }
  }, [session])

  const checkOnboardingPhase = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setOnboardingPhase(data.onboardingPhase || 'structured_chat')
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
    
    // Double-check the phase from database
    await checkOnboardingPhase()
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
    if (onboardingPhase === 'cv_building') {
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

        {/* Phase 1: Structured Onboarding Chat Modal Overlay */}
        {onboardingPhase === 'structured_chat' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bidaaya-dark/80 backdrop-blur-md">
            <div className="w-full max-w-2xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden m-4">
              <StructuredOnboardingChat onComplete={handlePhase1Complete} />
            </div>
          </div>
        )}

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