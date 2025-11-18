'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Database
} from 'lucide-react'

interface CategorizationStatus {
  total: number
  categorized: number
  uncategorized: number
  percentage: number
}

export default function AICategorization Page() {
  const { data: session } = useSession()
  const router = useRouter()
  const [status, setStatus] = useState<CategorizationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchStatus()
  }, [session])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/categorize-opportunities')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    }
  }

  const handleCategorize = async (mode: 'uncategorized' | 'all', limit?: number) => {
    if (!confirm(`Categorize ${mode === 'all' ? 'ALL' : 'uncategorized'} opportunities? This will use AI API credits.`)) {
      return
    }

    setIsLoading(true)
    setProgress('Starting AI categorization...')
    setResult(null)

    try {
      const response = await fetch('/api/admin/categorize-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, limit })
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        setProgress('✅ Categorization complete!')
        fetchStatus()
      } else {
        const error = await response.json()
        setProgress(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error categorizing:', error)
      setProgress('❌ Failed to categorize')
    } finally {
      setIsLoading(false)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI Opportunity Categorization
          </h1>
          <p className="text-gray-600">
            Use AI to automatically categorize opportunities for smart student matching
          </p>
        </div>

        {/* Status Card */}
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Categorization Status</h2>
              <button
                onClick={fetchStatus}
                className="text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <Database className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{status.total}</div>
                <div className="text-sm text-gray-600">Total Active</div>
              </div>
              <div className="text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{status.categorized}</div>
                <div className="text-sm text-gray-600">Categorized</div>
              </div>
              <div className="text-center">
                <AlertCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{status.uncategorized}</div>
                <div className="text-sm text-gray-600">Uncategorized</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${status.percentage}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 text-right">{status.percentage}% categorized</div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCategorize('uncategorized', 100)}
            disabled={isLoading || status?.uncategorized === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <TrendingUp className="h-5 w-5" />
            )}
            Categorize Uncategorized (Up to 100)
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCategorize('all', 100)}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            Re-categorize All (Up to 100)
          </motion.button>
        </div>

        {/* Progress/Result Display */}
        {(isLoading || progress) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
            
            {isLoading && (
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                <span className="text-gray-600">Processing opportunities with AI...</span>
              </div>
            )}

            <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded">
              {progress}
            </div>

            {result && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Total Processed:</span>
                    <span className="ml-2 font-semibold text-gray-900">{result.total}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Successful:</span>
                    <span className="ml-2 font-semibold text-green-600">{result.successful}</span>
                  </div>
                </div>

                {result.results && result.results.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Sample Categorizations:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.results.slice(0, 5).map((r: any, i: number) => (
                        <div key={i} className="text-xs bg-gray-50 p-2 rounded">
                          <div className="font-semibold text-gray-900">
                            {r.categorization.category.join(', ')}
                          </div>
                          <div className="text-gray-600 truncate">
                            {r.categorization.educationMatch.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">How It Works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• AI analyzes each opportunity's title, company, and description</li>
            <li>• Categorizes by industry, required skills, and matching education fields</li>
            <li>• Students see match scores based on their profile (major, interests, skills)</li>
            <li>• Early access opportunities show match scores before credit unlock</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

