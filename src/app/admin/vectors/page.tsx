'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface VectorStatus {
  totalStudents: number
  studentsWithVectors: number
  studentsRemaining: number
  completionPercentage: number
}

interface ConfigStatus {
  openaiApiKey: boolean
}

export default function VectorGenerationPage() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<VectorStatus | null>(null)
  const [config, setConfig] = useState<ConfigStatus | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/admin/generate-vectors')
      const data = await response.json()
      
      if (data.status) {
        setStatus(data.status)
      }
      if (data.configured) {
        setConfig(data.configured)
      }
    } catch (error) {
      console.error('Error loading status:', error)
    }
  }

  const generateVectors = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    setLogs(prev => [...prev, '🔮 Starting vector generation...'])

    try {
      const response = await fetch('/api/admin/generate-vectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batchSize: 10 })
      })

      const data = await response.json()

      if (data.success) {
        setLogs(prev => [
          ...prev,
          `✅ Processed ${data.processed} students`,
          `✅ Successful: ${data.successful}`,
          `❌ Failed: ${data.failed}`,
          `📊 Progress: ${data.summary.completionPercentage}% complete`
        ])

        if (data.errors?.length > 0) {
          setLogs(prev => [...prev, '❌ Errors:', ...data.errors])
        }

        // Refresh status
        setStatus(data.summary)
      } else {
        setLogs(prev => [...prev, `❌ Error: ${data.error}`])
      }

    } catch (error) {
      setLogs(prev => [...prev, `❌ Network error: ${(error as Error).message}`])
    } finally {
      setIsGenerating(false)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin access required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Vector Generation</h1>
          
          {/* Configuration Status */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Configuration</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${config?.openaiApiKey ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                <span>OpenAI API Key: {config?.openaiApiKey ? 'Configured' : 'Missing'}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          {status && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Vector Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{status.totalStudents}</div>
                  <div className="text-blue-600">Total Students</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{status.studentsWithVectors}</div>
                  <div className="text-green-600">With Vectors</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-900">{status.studentsRemaining}</div>
                  <div className="text-orange-600">Remaining</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">{status.completionPercentage}%</div>
                  <div className="text-purple-600">Complete</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${status.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="mb-6">
            <button
              onClick={generateVectors}
              disabled={isGenerating || !config?.openaiApiKey}
              className={`px-6 py-3 rounded-lg font-medium ${
                isGenerating || !config?.openaiApiKey
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGenerating ? '🔮 Generating Vectors...' : '🚀 Generate Vector Batch (10 students)'}
            </button>
            
            {!config?.openaiApiKey && (
              <p className="text-red-600 text-sm mt-2">
                OpenAI API key required. Please configure OPENAI_API_KEY in Vercel environment variables.
              </p>
            )}
          </div>

          {/* Logs */}
          {logs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Generation Logs</h2>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
              <button
                onClick={() => setLogs([])}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Logs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
