"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSessionRefresh } from '@/lib/session-utils'

interface DebugData {
  user: {
    id: string
    role: string
    subscriptionPlan: string
    subscriptionStatus: string
  }
  plan: {
    id: string
    name: string
    price: number
    features: any
  }
  subscription: {
    planName: string
    planPrice: number
    isPaid: boolean
    isActive: boolean
    features: string[]
  }
  limits: any
  debug: any
}

export function SubscriptionDebug() {
  const { data: session } = useSession()
  const { refreshSession } = useSessionRefresh()
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const fetchDebugData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/limits')
      if (response.ok) {
        const data = await response.json()
        setDebugData(data)
      }
    } catch (error) {
      console.error('Error fetching debug data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshSession = async () => {
    setIsRefreshing(true)
    try {
      await refreshSession()
      await fetchDebugData()
      console.log('✅ Session and debug data refreshed')
    } catch (error) {
      console.error('❌ Failed to refresh session:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchDebugData()
    }
  }, [session])

  if (!session?.user) {
    return null
  }

  const sessionPlan = (session.user as any)?.subscriptionPlan || 'Unknown'
  const sessionStatus = (session.user as any)?.subscriptionStatus || 'Unknown'
  const dbPlan = debugData?.user?.subscriptionPlan || 'Loading...'
  const dbStatus = debugData?.user?.subscriptionStatus || 'Loading...'

  const isInconsistent = debugData && (sessionPlan !== dbPlan || sessionStatus !== dbStatus)

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-yellow-800">
          🔍 Subscription Debug Panel
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          <button
            onClick={handleRefreshSession}
            disabled={isRefreshing}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-xs text-gray-600 font-medium">Frontend Session</div>
          <div className="text-sm">
            <span className={`font-mono ${isInconsistent ? 'text-red-600' : 'text-green-600'}`}>
              {sessionPlan}
            </span>
            <span className="text-gray-500 ml-1">({sessionStatus})</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 font-medium">Database</div>
          <div className="text-sm">
            <span className={`font-mono ${isInconsistent ? 'text-red-600' : 'text-green-600'}`}>
              {dbPlan}
            </span>
            <span className="text-gray-500 ml-1">({dbStatus})</span>
          </div>
        </div>
      </div>

      {/* Inconsistency Warning */}
      {isInconsistent && (
        <div className="bg-red-100 border border-red-200 rounded p-2 mb-3">
          <div className="text-xs font-semibold text-red-800 mb-1">⚠️ Inconsistency Detected!</div>
          <div className="text-xs text-red-700">
            Frontend session data doesn't match database. Click "Refresh" to sync.
          </div>
        </div>
      )}

      {/* Current Plan Info */}
      {debugData?.subscription && (
        <div className="bg-white rounded border p-3 mb-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">Current Plan Status</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Plan:</span> 
              <span className="font-semibold ml-1">{debugData.subscription.planName}</span>
            </div>
            <div>
              <span className="text-gray-500">Price:</span> 
              <span className="font-semibold ml-1">${debugData.subscription.planPrice}/mo</span>
            </div>
            <div>
              <span className="text-gray-500">Paid:</span> 
              <span className={`font-semibold ml-1 ${debugData.subscription.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                {debugData.subscription.isPaid ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Application Limits (for students) */}
      {debugData?.limits && (
        <div className="bg-white rounded border p-3 mb-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">Application Limits</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Used:</span> 
              <span className="font-semibold ml-1">{debugData.limits.applicationsUsed}</span>
            </div>
            <div>
              <span className="text-gray-500">Max:</span> 
              <span className="font-semibold ml-1">
                {debugData.limits.maxApplications === -1 ? 'Unlimited' : debugData.limits.maxApplications}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Can Apply:</span> 
              <span className={`font-semibold ml-1 ${debugData.limits.canApply ? 'text-green-600' : 'text-red-600'}`}>
                {debugData.limits.canApply ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Debug Info */}
      {showDetails && debugData && (
        <div className="bg-gray-50 rounded border p-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">Full Debug Data</div>
          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-2">
          <div className="text-xs text-gray-500">Loading debug data...</div>
        </div>
      )}
    </div>
  )
} 