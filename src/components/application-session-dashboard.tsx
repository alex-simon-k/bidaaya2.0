'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'

interface ApplicationSessionAnalytics {
  summary: {
    totalSessions: number
    completedSessions: number
    abandonedSessions: number
    inProgressSessions: number
    completionRate: number
    abandonmentRate: number
    avgTimeToComplete: number
  }
  stepAnalysis: {
    step1Completions: number
    step2Completions: number
    step3Completions: number
    step4Completions: number
    step1Rate: number
    step2Rate: number
    step3Rate: number
    step4Rate: number
  }
  sessions: Array<{
    id: string
    sessionId: string
    startedAt: string
    completedAt?: string
    abandonedAt?: string
    timeSpentMinutes?: number
    stepReached: number
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    step1Completed: boolean
    step2Completed: boolean
    step3Completed: boolean
    step4Completed: boolean
    wasRestored: boolean
    saveCount: number
    deviceType?: string
    browserInfo?: string
    user: {
      name: string
      email: string
    }
    project: {
      title: string
      category: string
    }
  }>
}

export default function ApplicationSessionDashboard() {
  const [analytics, setAnalytics] = useState<ApplicationSessionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('7d')
  const [projectFilter, setProjectFilter] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe, projectFilter])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      
      // Set date filters based on timeframe
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeframe) {
        case '24h':
          startDate.setHours(-24)
          break
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
      }
      
      params.append('startDate', startDate.toISOString())
      params.append('endDate', endDate.toISOString())
      
      if (projectFilter) {
        params.append('projectId', projectFilter)
      }

      const response = await fetch(`/api/admin/application-analytics?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data.data)
      } else {
        setError(data.error || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching application analytics:', error)
      setError('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-50'
      case 'ABANDONED': return 'text-red-600 bg-red-50'
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4" />
          <p>No data available</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📊 Application Session Analytics
            </h2>
            <p className="text-gray-600">
              Track application completion rates, time-to-complete, and drop-off points
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* Timeframe Filter */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            
            <button
              onClick={fetchAnalytics}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalSessions}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-green-600">{analytics.summary.completionRate}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abandonment Rate</p>
              <p className="text-3xl font-bold text-red-600">{analytics.summary.abandonmentRate}%</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Time to Complete</p>
              <p className="text-3xl font-bold text-purple-600">{formatTime(analytics.summary.avgTimeToComplete)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Step Analysis */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Step-by-Step Drop-off Analysis</h3>
        
        <div className="space-y-4">
          {[
            { step: 1, name: "Why Interested", completions: analytics.stepAnalysis.step1Completions, rate: analytics.stepAnalysis.step1Rate },
            { step: 2, name: "Proposed Approach", completions: analytics.stepAnalysis.step2Completions, rate: analytics.stepAnalysis.step2Rate },
            { step: 3, name: "Availability Info", completions: analytics.stepAnalysis.step3Completions, rate: analytics.stepAnalysis.step3Rate },
            { step: 4, name: "File Upload", completions: analytics.stepAnalysis.step4Completions, rate: analytics.stepAnalysis.step4Rate }
          ].map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {step.step}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Step {step.step}: {step.name}</h4>
                  <p className="text-sm text-gray-600">{step.completions} completions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{step.rate}%</p>
                  <p className="text-sm text-gray-600">completion rate</p>
                </div>
                
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${step.rate}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Application Sessions</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Project</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Time Spent</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Steps</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Device</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Started</th>
              </tr>
            </thead>
            <tbody>
              {analytics.sessions.slice(0, 10).map((session, index) => (
                <motion.tr
                  key={session.sessionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{session.user.name}</p>
                      <p className="text-gray-600 text-xs">{session.user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{session.project.title}</p>
                      <p className="text-gray-600 text-xs">{session.project.category}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium">{formatTime(session.timeSpentMinutes)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((step) => {
                        const completed = session[`step${step}Completed` as keyof typeof session] as boolean
                        return (
                          <div
                            key={step}
                            className={`w-3 h-3 rounded-full ${
                              completed ? 'bg-green-500' : 
                              session.stepReached >= step ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}
                            title={`Step ${step}: ${completed ? 'Completed' : session.stepReached >= step ? 'Reached' : 'Not reached'}`}
                          />
                        )
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">{session.deviceType}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">
                      {new Date(session.startedAt).toLocaleDateString()} {new Date(session.startedAt).toLocaleTimeString()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {analytics.sessions.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-gray-600">Showing 10 of {analytics.sessions.length} sessions</p>
          </div>
        )}
      </div>
    </motion.div>
  )
} 