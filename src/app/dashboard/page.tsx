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
import { BottomNavigation } from '@/components/ui/bottom-navigation'

interface DashboardStats {
  applications: number
  projects: number
  connections: number
  proposals?: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    applications: 0,
    projects: 0,
    connections: 0,
    proposals: 0
  })
  const [showMembershipPopup, setShowMembershipPopup] = useState(false)

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    if (session?.user) {
      loadDashboardStats()
    }
  }, [session])

  // Show membership popup every 30 minutes for students and companies
  useEffect(() => {
    if (session?.user?.role === 'STUDENT' || session?.user?.role === 'COMPANY') {
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
  }, [session])

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

  // Student Dashboard - ChatGPT-like Interface
  if (userRole === 'STUDENT') {
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