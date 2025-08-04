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

  const testEnhancedCategorization = async () => {
    setIsProcessing(true)
    setError('')
    setMessage('')

    try {
      const sampleData = {
        university: 'GMU',
        major: 'CS',
        skills: ['javascript', 'photoshop', 'leadership'],
        location: 'DXB',
        interests: ['technology', 'startups'],
        goal: ['software engineer'],
        bio: 'Passionate computer science student interested in web development and startups'
      }

      const response = await fetch('/api/admin/enhanced-categorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_single', studentData: sampleData })
      })

      if (!response.ok) throw new Error('Test failed')

      const data = await response.json()
      setMessage(`🧪 Test Results:
University: ${data.categorization.university.standard} (${Math.round(data.categorization.university.confidence * 100)}% confidence)
Major: ${data.categorization.major.standard} (${Math.round(data.categorization.major.confidence * 100)}% confidence)
Tags Generated: ${data.categorization.semanticTags.length}
Improvements: ${data.categorization.suggestedImprovements.length} suggestions`)
      
    } catch (err) {
      console.error('Test error:', err)
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const runEnhancedBulkProcessing = async () => {
    setIsProcessing(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/enhanced-categorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enhanced_bulk_process' })
      })

      if (!response.ok) throw new Error('Enhanced processing failed')

      const data = await response.json()
      setMessage(`🚀 Enhanced Processing Complete:
- Processed: ${data.results.studentsProcessed} students
- Improved: ${data.results.studentsImproved} students (${data.results.improvementRate}%)
- Needs Review: ${data.results.studentsNeedingReview} students
- New Semantic Tags: ${data.results.newSemanticTags}`)
      
      // Reload stats after processing
      setTimeout(loadStats, 2000)
      
    } catch (err) {
      console.error('Enhanced processing error:', err)
      setError(err instanceof Error ? err.message : 'Enhanced processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const analyzeDataQuality = async () => {
    setIsProcessing(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/enhanced-categorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_data_quality' })
      })

      if (!response.ok) throw new Error('Quality analysis failed')

      const data = await response.json()
      const analysis = data.analysis
      setMessage(`📊 Data Quality Analysis:
- Sample Size: ${analysis.sampleSize} students
- Incomplete Profiles: ${analysis.dataQualityIssues.incompleteProfiles} (${analysis.dataQualityIssues.incompletePercentage}%)
- University Variations: ${analysis.variationAnalysis.universities.uniqueCount}
- Major Variations: ${analysis.variationAnalysis.majors.uniqueCount}
- Potential Merges: ${analysis.variationAnalysis.universities.potentialMerges.length} universities, ${analysis.variationAnalysis.majors.potentialMerges.length} majors`)
      
    } catch (err) {
      console.error('Quality analysis error:', err)
      setError(err instanceof Error ? err.message : 'Quality analysis failed')
    } finally {
      setIsProcessing(false)
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

          {/* Test Enhanced Categorization */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">🧪 Test Enhanced AI Categorization</h3>
            <div className="space-y-3">
              <Button
                onClick={() => testEnhancedCategorization()}
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                🧠 Test with Sample Data
              </Button>
              <Button
                onClick={() => runEnhancedBulkProcessing()}
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                🚀 Run Enhanced Processing
              </Button>
              <Button
                onClick={() => analyzeDataQuality()}
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                📊 Analyze Data Quality
              </Button>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">🚀 Enhanced AI System</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• **Smart Recognition:** "GMU" → "Gulf Medical University" automatically</li>
              <li>• **Confidence Scoring:** Know which categorizations need manual review</li>
              <li>• **Semantic Understanding:** Groups similar majors, skills, and universities</li>
              <li>• **DeepSeek AI Enhancement:** Industry alignment and career trajectory prediction</li>
              <li>• **Quality Analysis:** Identifies data inconsistencies and suggests improvements</li>
              <li>• **Hybrid Approach:** Knowledge base + AI + manual verification where needed</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  )
} 