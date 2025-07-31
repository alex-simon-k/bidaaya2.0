'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Calendar,
  Globe,
  Smartphone,
  Zap,
  RefreshCw
} from 'lucide-react'

interface OnboardingMetrics {
  totalSignups: number
  conversionFunnel: {
    emailVerificationRate: string
    profileCompletionRate: string
    firstLoginRate: string
    studentApplicationRate: string
    companyProjectRate: string
    companyActivationRate: string
    upgradeRate: string
  }
  segmentation: {
    students: number
    companies: number
  }
  averageOnboardingTimes: {
    emailVerification: string | null
    profileCompletion: string | null
  }
  topSources: [string, number][]
  deviceBreakdown: Record<string, number>
  countryBreakdown: [string, number][]
}

export default function OnboardingAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<OnboardingMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState(30)

  useEffect(() => {
    fetchMetrics()
  }, [timeframe])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/onboarding-analytics?days=${timeframe}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const backfillAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/onboarding-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backfill_analytics' })
      })
      
      if (response.ok) {
        await fetchMetrics()
        alert('✅ Analytics backfill completed successfully!')
      } else {
        throw new Error('Failed to backfill analytics')
      }
    } catch (err) {
      alert('❌ Failed to backfill analytics: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!metrics) {
    return <div>No data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Onboarding Analytics</h2>
        <div className="flex items-center gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={backfillAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Zap className="h-4 w-4" />
            Backfill Data
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Signups</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalSignups}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Email Verification</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.conversionFunnel.emailVerificationRate}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Profile Completion</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.conversionFunnel.profileCompletionRate}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Avg. Email Verification</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.averageOnboardingTimes.emailVerification ? `${metrics.averageOnboardingTimes.emailVerification}h` : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Funnel */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Student Journey</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <span className="font-medium">{metrics.segmentation.students}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <span className="font-medium">{metrics.conversionFunnel.emailVerificationRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profile Completed</span>
                  <span className="font-medium">{metrics.conversionFunnel.profileCompletionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">First Application</span>
                  <span className="font-medium">{metrics.conversionFunnel.studentApplicationRate}%</span>
                </div>
              </div>
            </div>

            {/* Company Funnel */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Company Journey</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Companies</span>
                  <span className="font-medium">{metrics.segmentation.companies}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <span className="font-medium">{metrics.conversionFunnel.emailVerificationRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profile Completed</span>
                  <span className="font-medium">{metrics.conversionFunnel.profileCompletionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">First Project Created</span>
                  <span className="font-medium">{metrics.conversionFunnel.companyProjectRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">First Project Activated</span>
                  <span className="font-medium">{metrics.conversionFunnel.companyActivationRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Sources & Device Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Sources */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Top Traffic Sources
          </h3>
          <div className="space-y-3">
            {metrics.topSources.map(([source, count], index) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{source}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / metrics.totalSignups) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium text-sm w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.deviceBreakdown).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{device}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(count / metrics.totalSignups) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium text-sm w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Country Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.countryBreakdown.map(([country, count]) => (
            <div key={country} className="text-center">
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{country}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding Speed Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Speed Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Average Time to Email Verification</p>
            <p className="text-3xl font-bold text-blue-600">
              {metrics.averageOnboardingTimes.emailVerification || 'N/A'}
              {metrics.averageOnboardingTimes.emailVerification && ' hours'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Average Time to Profile Completion</p>
            <p className="text-3xl font-bold text-green-600">
              {metrics.averageOnboardingTimes.profileCompletion || 'N/A'}
              {metrics.averageOnboardingTimes.profileCompletion && ' hours'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 