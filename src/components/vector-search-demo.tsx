'use client'

import { useState } from 'react'
import { Search, Sparkles, Users, Clock, TrendingUp, Brain } from 'lucide-react'

interface VectorSearchResult {
  userId: string
  student: any
  vectorSimilarity: number
  profileMatch: number
  skillsMatch: number
  academicMatch: number
  overallScore: number
  matchReasons: string[]
  confidenceLevel: 'high' | 'medium' | 'low'
}

export default function VectorSearchDemo() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'vector' | 'hybrid'>('hybrid')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<VectorSearchResult[]>([])
  const [searchMetadata, setSearchMetadata] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/vector-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: searchQuery.trim(),
          searchType,
          limit: 10,
          threshold: 0.6
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      if (data.success) {
        const matches = data.vectorMatches || data.hybridMatches || []
        setResults(matches)
        setSearchMetadata(data.searchMetadata || {})
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-purple-600" />
          Vector-Based Talent Search Demo
        </h1>
        <p className="text-gray-600">
          Experience the next generation of AI-powered talent matching using semantic similarity
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., 'Marketing students with social media experience in Dubai'"
                className="pl-10 w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Type
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'vector' | 'hybrid')}
                className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="hybrid">Hybrid (Vector + Rule-based)</option>
                <option value="vector">Pure Vector Search</option>
              </select>
            </div>

            <button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="text-red-600">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Search Metadata */}
      {searchMetadata && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Search Metadata</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Processing Time:</span>
              <span className="ml-1 font-medium">{searchMetadata.processingTime || 0}ms</span>
            </div>
            <div>
              <span className="text-blue-600">Total Vectors:</span>
              <span className="ml-1 font-medium">{searchMetadata.totalVectors || 0}</span>
            </div>
            <div>
              <span className="text-blue-600">Matches Found:</span>
              <span className="ml-1 font-medium">{searchMetadata.matchesFound || 0}</span>
            </div>
            <div>
              <span className="text-blue-600">Search Type:</span>
              <span className="ml-1 font-medium capitalize">{searchType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Search Results ({results.length})
          </h2>

          <div className="grid gap-4">
            {results.map((result, index) => (
              <div key={result.userId} className="bg-white rounded-lg shadow border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-purple-600">
                        {result.student.name?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {result.student.name || 'Anonymous'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {result.student.university || 'University not specified'}
                        {result.student.major && ` • ${result.student.major}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}>
                      {Math.round(result.overallScore)}%
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(result.confidenceLevel)}`}>
                      {result.confidenceLevel} confidence
                    </span>
                  </div>
                </div>

                {/* Detailed Scores */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {Math.round(result.profileMatch * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Profile Match</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {Math.round(result.skillsMatch * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Skills Match</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {Math.round(result.academicMatch * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Academic Match</div>
                  </div>
                </div>

                {/* Match Reasons */}
                {result.matchReasons && result.matchReasons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Why this is a good match:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.matchReasons.slice(0, 4).map((reason, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {result.student.bio && (
                      <p className="mb-2">{result.student.bio.substring(0, 150)}...</p>
                    )}
                    {result.student.skills && result.student.skills.length > 0 && (
                      <p>
                        <span className="font-medium">Skills:</span> {result.student.skills.slice(0, 5).join(', ')}
                        {result.student.skills.length > 5 && ` +${result.student.skills.length - 5} more`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && results.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search query or lowering the similarity threshold
          </p>
        </div>
      )}

      {/* Instructions */}
      {!searchQuery && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How to Use Vector Search</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Natural Language Queries</p>
                <p>Describe what you're looking for in natural language. Example: "Marketing students with social media experience"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">Semantic Understanding</p>
                <p>Vector search understands meaning, not just keywords. It can match "programming" with "coding" or "software development"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Hybrid Approach</p>
                <p>Combines vector similarity with rule-based matching for more comprehensive results</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
