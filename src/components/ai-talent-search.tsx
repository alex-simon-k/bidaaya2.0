'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Brain, 
  Sparkles, 
  Users, 
  TrendingUp, 
  Clock, 
  Star,
  Eye,
  MessageCircle,
  Crown,
  Zap,
  Target,
  MapPin,
  GraduationCap,
  Code,
  Briefcase,
  Calendar,
  ArrowRight,
  Filter,
  SortDesc,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { useSession } from 'next-auth/react'

interface MatchResult {
  id: string
  overallScore: number
  profileMatchScore: number
  engagementScore: number
  behavioralScore: number
  skillsAlignment: number
  experienceMatch: number
  educationMatch: number
  locationMatch: number
  interestAlignment: number
  responselikelihood: number
  aiExplanation: string
  strengthsHighlight: string[]
  potentialConcerns: string[]
  recommendedApproach: string
  student: {
    id: string
    name: string
    email: string
    university: string
    major: string
    graduationYear: number
    skills: string[]
    bio: string
    location: string
    goal: string[]
    interests: string[]
    image: string
  }
}

interface SearchMetadata {
  totalCandidatesEvaluated: number
  processingTime: number
  parsedIntent: any
  tier: string
  matchesFound: number
  maxAllowed: number
}

interface UpgradeInfo {
  currentTier: string
  currentLimit: number
  availableTiers: any[]
}

export default function AITalentSearch() {
  const { data: session } = useSession()
  const [searchPrompt, setSearchPrompt] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [metadata, setMetadata] = useState<SearchMetadata | null>(null)
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null)
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)
  const [filterScore, setFilterScore] = useState(0)
  const [sortBy, setSortBy] = useState<'score' | 'engagement' | 'skills'>('score')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Load search history on component mount
  useEffect(() => {
    loadSearchHistory()
  }, [])

  const loadSearchHistory = async () => {
    try {
      const response = await fetch('/api/ai-matching/search')
      if (response.ok) {
        const data = await response.json()
        setSearchHistory(data.data.slice(0, 5)) // Show last 5 searches
      }
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }

  const performSearch = async () => {
    if (!searchPrompt.trim() || searchPrompt.length < 10) {
      alert('Please provide a more detailed search prompt (minimum 10 characters)')
      return
    }

    setIsSearching(true)
    setMatches([])
    setMetadata(null)

    try {
      const response = await fetch('/api/ai-matching/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: searchPrompt,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMatches(result.data.matches)
        setMetadata(result.data.metadata)
        setUpgradeInfo(result.data.upgradeInfo)
        loadSearchHistory() // Refresh history
        
        console.log('🎯 Search completed:', result.data.matches.length, 'matches found')
      } else {
        alert(`Search failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Failed to perform search. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-blue-100 text-blue-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const filteredAndSortedMatches = matches
    .filter(match => match.overallScore >= filterScore)
    .sort((a, b) => {
      switch (sortBy) {
        case 'engagement':
          return b.engagementScore - a.engagementScore
        case 'skills':
          return b.skillsAlignment - a.skillsAlignment
        default:
          return b.overallScore - a.overallScore
      }
    })

  const samplePrompts = [
    "Looking for a React developer with 2+ years experience in Dubai",
    "Need a data scientist with Python skills for a startup environment",
    "Seeking a marketing intern with social media experience",
    "Want a senior backend engineer familiar with Node.js and AWS",
    "Looking for a UI/UX designer with Figma experience for remote work"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
              <Brain className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Talent Search
            </h1>
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Describe your ideal candidate in natural language and let AI find the perfect matches based on skills, 
            behavior, and engagement patterns.
          </p>
        </motion.div>

        {/* Tier Info & Upgrade Banner */}
        {upgradeInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl border border-purple-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-gray-800">
                  Current Plan: {upgradeInfo.currentTier} 
                  <span className="text-gray-600 ml-2">
                    ({metadata?.matchesFound || 0}/{upgradeInfo.currentLimit} searches used)
                  </span>
                </span>
              </div>
              {upgradeInfo.availableTiers.length > 0 && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade for More Searches
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Main Search Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          
          {/* Search Input */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Describe Your Ideal Candidate
            </label>
            <div className="relative">
              <textarea
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                placeholder="e.g., Looking for a senior React developer with 3+ years experience, familiar with TypeScript and Next.js, preferably in Dubai or remote. Should have startup experience and be passionate about fintech..."
                className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-gray-700"
                disabled={isSearching}
              />
              <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                {searchPrompt.length}/500
              </div>
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Quick Start Examples:
            </label>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setSearchPrompt(prompt)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  disabled={isSearching}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={performSearch}
            disabled={isSearching || searchPrompt.length < 10}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSearching ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Searching with AI...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Find Talent with AI
              </>
            )}
          </button>
        </motion.div>

        {/* Search Metadata */}
        {metadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          >
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-800">Candidates Evaluated</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{metadata.totalCandidatesEvaluated}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-gray-800">Matches Found</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{metadata.matchesFound}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-gray-800">Processing Time</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{metadata.processingTime}ms</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-gray-800">Plan Tier</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{metadata.tier}</p>
            </div>
          </motion.div>
        )}

        {/* Filters and Sorting */}
        {matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-4 mb-6"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Min Score:</span>
                <select
                  value={filterScore}
                  onChange={(e) => setFilterScore(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={0}>All Matches</option>
                  <option value={40}>40%+ (Good)</option>
                  <option value={60}>60%+ (Very Good)</option>
                  <option value={80}>80%+ (Excellent)</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <SortDesc className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="score">Overall Score</option>
                  <option value="engagement">Engagement</option>
                  <option value="skills">Skills Match</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {filteredAndSortedMatches.length} of {matches.length} matches
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Grid */}
        <AnimatePresence>
          {filteredAndSortedMatches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8"
            >
              {filteredAndSortedMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedMatch(match)}
                >
                  {/* Student Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {match.student.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800">{match.student.name}</h3>
                        <p className="text-gray-600">{match.student.major} at {match.student.university}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{match.student.location}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBadgeColor(match.overallScore)}`}>
                        {Math.round(match.overallScore)}% Match
                      </div>
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(match.profileMatchScore * 100).split(' ')[0]}`}>
                          {Math.round(match.profileMatchScore * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Profile</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(match.engagementScore * 100).split(' ')[0]}`}>
                          {Math.round(match.engagementScore * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(match.behavioralScore * 100).split(' ')[0]}`}>
                          {Math.round(match.behavioralScore * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Behavioral</div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.student.skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {match.student.skills.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{match.student.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI Insights Preview */}
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {match.aiExplanation}
                    </div>

                    {/* Response Likelihood */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-600">
                          {Math.round(match.responselikelihood * 100)}% likely to respond
                        </span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results */}
        {!isSearching && matches.length === 0 && metadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No matches found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or use different keywords
            </p>
          </motion.div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Searches
            </h3>
            <div className="space-y-3">
              {searchHistory.map((search, index) => (
                <div
                  key={search.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setSearchPrompt(search.searchPrompt)}
                >
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium line-clamp-1">
                      {search.searchPrompt}
                    </p>
                    <p className="text-sm text-gray-500">
                      {search.resultsCount} matches • {new Date(search.searchTimestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Detailed Match Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal content would go here - detailed candidate view */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedMatch.student.name}
                </h2>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {/* Detailed candidate information */}
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">AI Analysis</h3>
                  <p className="text-blue-700">{selectedMatch.aiExplanation}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {selectedMatch.strengthsHighlight.map((strength, idx) => (
                        <li key={idx} className="text-green-700 flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Recommended Approach</h4>
                    <p className="text-gray-700">{selectedMatch.recommendedApproach}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  )
} 