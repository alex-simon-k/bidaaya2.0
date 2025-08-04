'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Database, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Tag,
  Lightbulb,
  Clock
} from 'lucide-react'

interface AnalysisResult {
  success: boolean
  fromCache: boolean
  summary: {
    studentsAnalyzed: number
    tagsGenerated: number
    recommendationsCount: number
    lastRun: string
    topTags: Array<{
      category: string
      value: string
      frequency: number
    }>
  }
  analysis: {
    recommendations: string[]
  }
}

export function AIAnalysisAdminPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setIsRunning(true)
    setError(null)
    setResults(null)

    try {
      console.log('🔍 Starting AI database analysis...')
      
      const response = await fetch('/api/ai-database/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{}'
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Analysis completed:', data)
      
      setResults(data)
    } catch (err) {
      console.error('❌ Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsRunning(false)
    }
  }

  const testSearch = async () => {
    try {
      console.log('🔍 Testing intelligent search...')
      
      const response = await fetch('/api/ai-database/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'Business students in Dubai interested in marketing',
          limit: 10
        })
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('🎯 Search Results:', data)
      
      alert(`Found ${data.results.length} students matching your criteria!\nCheck console for details.`)
    } catch (err) {
      console.error('❌ Search error:', err)
      alert('Search test failed. Check console for details.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Database Analysis</h1>
        </div>
        <p className="text-gray-600">
          Analyze your student database and create intelligent tags for better matching
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={runAnalysis}
          disabled={isRunning}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
          size="lg"
        >
          {isRunning ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Database className="h-5 w-5" />
          )}
          {isRunning ? 'Analyzing Database...' : 'Run AI Analysis'}
        </Button>

        <Button
          onClick={testSearch}
          variant="outline"
          className="flex items-center gap-2 px-6 py-3"
          size="lg"
        >
          <Brain className="h-5 w-5" />
          Test Intelligent Search
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Analysis Failed</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <p className="text-sm text-red-600 mt-1">
            Make sure you're logged in as a company user and try again.
          </p>
        </motion.div>
      )}

      {/* Results Display */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Success Header */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                {results.fromCache ? 'Cache Hit! Analysis Retrieved' : 'Analysis Completed Successfully!'}
              </span>
            </div>
            {results.fromCache && (
              <p className="text-green-700 mt-1">
                Using cached results from {new Date(results.summary.lastRun).toLocaleString()}
              </p>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{results.summary.studentsAnalyzed}</div>
              <div className="text-sm text-blue-700">Students Analyzed</div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <Tag className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">{results.summary.tagsGenerated}</div>
              <div className="text-sm text-purple-700">Smart Tags Created</div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <Lightbulb className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-900">{results.summary.recommendationsCount}</div>
              <div className="text-sm text-yellow-700">Recommendations</div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-gray-900">Last Run</div>
              <div className="text-xs text-gray-700">
                {new Date(results.summary.lastRun).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Top Tags */}
          {results.summary.topTags && results.summary.topTags.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">🏷️ Top Generated Tags</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.summary.topTags.slice(0, 9).map((tag, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">{tag.value}</div>
                    <div className="text-sm text-gray-600">{tag.category}</div>
                    <div className="text-xs text-gray-500">{tag.frequency} students</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {results.analysis.recommendations && results.analysis.recommendations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">💡 AI Recommendations</h3>
              <ul className="space-y-2">
                {results.analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">🚀 What's Next?</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Your AI chat can now understand natural language queries</li>
              <li>• Try searching: "Business students in Dubai interested in marketing"</li>
              <li>• The system will automatically use these smart tags for matching</li>
              <li>• Analysis cache expires in 24 hours and will auto-refresh</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  )
} 