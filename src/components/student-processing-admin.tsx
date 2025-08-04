'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { 
  Users, 
  Database, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Play,
  BarChart3,
  Zap
} from 'lucide-react'

interface ProcessingStats {
  totalStudents: number
  studentsWithTags: number
  studentsWithoutTags: number
  totalSmartTags: number
  processingPercentage: number
  recentProcessingActivity: number
}

export function StudentProcessingAdmin() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState<ProcessingStats | null>(null)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/process-students')
      if (!response.ok) throw new Error('Failed to load stats')
      
      const data = await response.json()
      setStats(data.processingStats)
    } catch (err) {
      console.error('Error loading stats:', err)
      setError('Failed to load processing statistics')
    }
  }

  const startBulkProcessing = async () => {
    setIsProcessing(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/process-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_process' })
      })

      if (!response.ok) throw new Error('Processing failed')

      const data = await response.json()
      setMessage(data.message)
      
      // Reload stats after starting processing
      setTimeout(loadStats, 2000)
      
    } catch (err) {
      console.error('Processing error:', err)
      setError(err instanceof Error ? err.message : 'Processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/admin/process-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      })

      if (!response.ok) throw new Error('Status check failed')

      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Status check error:', err)
      setError('Failed to check processing status')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Student Processing Engine</h1>
        </div>
        <p className="text-gray-600">
          Automated student categorization, tagging, and matching preparation
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={startBulkProcessing}
          disabled={isProcessing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          size="lg"
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Play className="h-5 w-5" />
          )}
          {isProcessing ? 'Processing Students...' : 'Process All Students'}
        </Button>

        <Button
          onClick={checkStatus}
          variant="outline"
          className="flex items-center gap-2 px-6 py-3"
          size="lg"
        >
          <BarChart3 className="h-5 w-5" />
          Check Status
        </Button>

        <Button
          onClick={loadStats}
          variant="outline"
          className="flex items-center gap-2 px-6 py-3"
          size="lg"
        >
          <Database className="h-5 w-5" />
          Load Statistics
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Success</span>
          </div>
          <p className="text-green-700 mt-2">{message}</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Error</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </motion.div>
      )}

      {/* Statistics Display */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{stats.totalStudents}</div>
              <div className="text-sm text-blue-700">Total Students</div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{stats.studentsWithTags}</div>
              <div className="text-sm text-green-700">Students Processed</div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-900">{stats.studentsWithoutTags}</div>
              <div className="text-sm text-yellow-700">Pending Processing</div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">{stats.processingPercentage}%</div>
              <div className="text-sm text-purple-700">Completion Rate</div>
            </div>
          </div>

          {/* Processing Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">📊 Processing Progress</h3>
            
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Students Processed</span>
                  <span>{stats.studentsWithTags} / {stats.totalStudents}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${stats.processingPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Smart Tags Created:</span>
                  <span className="font-medium ml-2">{stats.totalSmartTags}</span>
                </div>
                <div>
                  <span className="text-gray-600">Recent Activity:</span>
                  <span className="font-medium ml-2">{stats.recentProcessingActivity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">🚀 How It Works</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• **Automatic Processing:** New students are processed when they register</li>
              <li>• **Smart Categorization:** AI creates tags for universities, majors, skills, and locations</li>
              <li>• **Activity Scoring:** Students get ranked by platform engagement and profile completeness</li>
              <li>• **Instant Matching:** Companies get immediate, intelligent search results</li>
              <li>• **No Manual Work:** Everything runs automatically in the background</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  )
} 