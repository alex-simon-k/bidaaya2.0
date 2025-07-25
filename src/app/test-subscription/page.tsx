'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function TestSubscriptionPage() {
  const { data: session, update } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session?.user) {
      fetchCurrentData()
    }
  }, [session])

  const fetchCurrentData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test-subscription-upgrade')
      const result = await response.json()
      setData(result)
      setMessage('Data loaded')
    } catch (error) {
      console.error('Error:', error)
      setMessage('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const fixAllUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test-subscription-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix_all_users' })
      })
      const result = await response.json()
      setMessage(result.message || 'Fixed all users')
      fetchCurrentData() // Refresh data
    } catch (error) {
      console.error('Error:', error)
      setMessage('Error fixing users')
    } finally {
      setLoading(false)
    }
  }

  const testUpgrade = async (planId: string) => {
    try {
      setLoading(true)
      setMessage(`Testing upgrade to ${planId}...`)
      
      const response = await fetch('/api/test-subscription-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, action: 'upgrade' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage(`✅ Successfully upgraded to ${result.subscriptionPlan}`)
        
        // Force session refresh to get updated data
        console.log('🔄 Refreshing session...')
        await update()
        
        // Wait a bit then reload data
        setTimeout(() => {
          fetchCurrentData()
        }, 1000)
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ Test failed')
    } finally {
      setLoading(false)
    }
  }

  const testStripeUpgrade = async (planId: string) => {
    try {
      setLoading(true)
      setMessage(`Testing Stripe upgrade to ${planId}...`)
      
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId,
          testMode: true,
          successUrl: window.location.href
        })
      })
      const result = await response.json()
      
      if (result.testMode) {
        setMessage(`✅ Stripe test mode upgrade successful!`)
        fetchCurrentData()
      } else {
        setMessage(`❌ Stripe test failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('Error testing Stripe upgrade')
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Please log in to test subscriptions</h1>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🧪 Subscription Test Dashboard</h1>
      
      {!session && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">Please log in to test subscription functionality</p>
        </div>
      )}

      {session && (
        <>
          {/* Current Session Data */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                🖥️ Frontend Session Data
              </h2>
              <div className="space-y-2 text-sm">
                <div><strong>User ID:</strong> {session.user?.id}</div>
                <div><strong>Email:</strong> {session.user?.email}</div>
                <div><strong>Role:</strong> {session.user?.role}</div>
                <div><strong>Subscription Plan:</strong> <span className="font-mono bg-blue-100 px-2 py-1 rounded">{(session as any).subscriptionPlan || 'NOT_SET'}</span></div>
                <div><strong>Subscription Status:</strong> <span className="font-mono bg-blue-100 px-2 py-1 rounded">{(session as any).subscriptionStatus || 'NOT_SET'}</span></div>
                <div><strong>Stripe Customer ID:</strong> {(session as any).stripeCustomerId || 'None'}</div>
                <div><strong>Stripe Subscription ID:</strong> {(session as any).stripeSubscriptionId || 'None'}</div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                🗄️ Database Data
              </h2>
              {data ? (
                <div className="space-y-2 text-sm">
                  <div><strong>User ID:</strong> {data.user?.id}</div>
                  <div><strong>Email:</strong> {data.user?.email}</div>
                  <div><strong>Role:</strong> {data.user?.role}</div>
                  <div><strong>Subscription Plan:</strong> <span className="font-mono bg-green-100 px-2 py-1 rounded">{data.user?.subscriptionPlan}</span></div>
                  <div><strong>Subscription Status:</strong> <span className="font-mono bg-green-100 px-2 py-1 rounded">{data.user?.subscriptionStatus}</span></div>
                  <div><strong>Stripe Customer ID:</strong> {data.user?.stripeCustomerId || 'None'}</div>
                  <div><strong>Stripe Subscription ID:</strong> {data.user?.stripeSubscriptionId || 'None'}</div>
                </div>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>
          </div>

          {/* Sync Status */}
          {data && session && (
            <div className="mb-8">
              {(session as any).subscriptionPlan === data.user?.subscriptionPlan && 
               (session as any).subscriptionStatus === data.user?.subscriptionStatus ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✅</span>
                    <span className="text-green-800 font-medium">Session and Database are in sync!</span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-red-600 mr-2">❌</span>
                    <span className="text-red-800 font-medium">Session and Database are out of sync!</span>
                  </div>
                  <button
                    onClick={async () => {
                      console.log('🔄 Manually refreshing session...')
                      await update()
                      setTimeout(fetchCurrentData, 1000)
                      setMessage('Session refresh triggered')
                    }}
                    className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    🔄 Force Session Refresh
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Test Actions */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 Test Subscription Upgrades</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Student Plans */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700">Student Plans</h3>
                  <button
                    onClick={() => testUpgrade('student_premium_monthly')}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
                  >
                    Student Premium ($5/mo)
                  </button>
                  <button
                    onClick={() => testUpgrade('student_pro_monthly')}
                    disabled={loading}
                    className="w-full bg-purple-800 text-white px-3 py-2 rounded-md hover:bg-purple-900 disabled:opacity-50 text-sm"
                  >
                    Student Pro ($15/mo)
                  </button>
                </div>

                {/* Company Plans */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700">Company Plans</h3>
                  <button
                    onClick={() => testUpgrade('company_basic_monthly')}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    Company Basic ($49/mo)
                  </button>
                  <button
                    onClick={() => testUpgrade('company_premium_monthly')}
                    disabled={loading}
                    className="w-full bg-blue-700 text-white px-3 py-2 rounded-md hover:bg-blue-800 disabled:opacity-50 text-sm"
                  >
                    Company Premium ($149/mo)
                  </button>
                  <button
                    onClick={() => testUpgrade('company_pro_monthly')}
                    disabled={loading}
                    className="w-full bg-blue-900 text-white px-3 py-2 rounded-md hover:bg-blue-950 disabled:opacity-50 text-sm"
                  >
                    Company Pro ($299/mo)
                  </button>
                </div>

                {/* Utility Actions */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700">Utility Actions</h3>
                  <button
                    onClick={fetchCurrentData}
                    disabled={loading}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm"
                  >
                    🔄 Reload Data
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const response = await fetch('/api/test-subscription-upgrade', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'fix_all_users' })
                        })
                        const result = await response.json()
                        setMessage(result.message || 'Sync completed')
                        await update()
                        setTimeout(fetchCurrentData, 1000)
                      } catch (error) {
                        setMessage('Error during sync')
                      }
                      setLoading(false)
                    }}
                    className="w-full bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 text-sm"
                  >
                    🔧 Fix All Users
                  </button>
                </div>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`border rounded-lg p-4 ${
                message.includes('✅') || message.includes('Success') 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : message.includes('❌') || message.includes('Error')
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <p className="font-medium">{message}</p>
              </div>
            )}

            {/* Debug Info */}
            {data && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">🔍 Debug Information</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
} 