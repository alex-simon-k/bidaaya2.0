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

  // Manual popup trigger for testing
  useEffect(() => {
    const handleShowPopup = () => {
      setShowMembershipPopup(true)
    }
    
    window.addEventListener('showMembershipPopup', handleShowPopup)
    return () => window.removeEventListener('showMembershipPopup', handleShowPopup)
  }, [])

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

  // Student Dashboard - Chat-based interface
  if (userRole === 'STUDENT') {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          {/* Main Chat Interface */}
          <StudentProposalChat />
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

  // Company Dashboard - Existing AI Chat interface
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Simplified Header with Just Navigation Buttons */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
                <p className="text-gray-600">Find the perfect talent for your projects</p>
              </div>
              
              {/* Simple Navigation Buttons */}
              <div className="flex items-center gap-3">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  AI Search
                </button>
                <button 
                  onClick={() => window.location.href = '/dashboard/proposals'}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Proposals Inbox
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main AI Interface */}
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