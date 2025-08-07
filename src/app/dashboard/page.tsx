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

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    if (session?.user) {
      loadDashboardStats()
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

  // Student Dashboard - Chat-based interface
  if (userRole === 'STUDENT') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Main Chat Interface */}
        <StudentProposalChat />
      </div>
    )
  }

  // Company Dashboard - Existing AI Chat interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Company Stats Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Company Dashboard
              </h1>
              <p className="text-gray-600">Find the perfect talent for your projects</p>
            </div>
          </div>
          
          {/* Company Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Applications Received</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.applications}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Active Projects</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.projects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Successful Hires</p>
                  <p className="text-2xl font-bold text-green-900">{stats.connections}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Interface for Companies */}
      <AIDashboardChat />
    </div>
  )
} 