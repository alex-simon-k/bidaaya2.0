'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Search, 
  Sparkles, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap,
  Activity,
  Zap,
  Lock,
  Star,
  Target,
  TrendingUp,
  Users,
  Crown,
  MessageSquare,
  Eye,
  ArrowRight
} from 'lucide-react'

interface TalentMatch {
  candidate: {
    id: string
    name: string
    university?: string
    major?: string
    bio?: string
    image?: string
    activityScore: number
    engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  }
  overallScore: number
  contactCredits: number
  aiExplanation: string
  strengths: string[]
}

export default function NextGenAITalentSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [matches, setMatches] = useState<TalentMatch[]>([])
  const [selectedMatch, setSelectedMatch] = useState<TalentMatch | null>(null)
  const [credits, setCredits] = useState({ available: 15, used: 0, tier: 'FREE' })
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'chat' | 'results'>('chat')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return
    
    setIsSearching(true)
    setViewMode('results')
    
    try {
      const response = await fetch('/api/ai-matching/search-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: searchQuery })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMatches(data.data.matches || [])
        setSuggestions(data.data.suggestions || [])
        setCredits(data.data.credits || credits)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const revealContact = async (candidateId: string) => {
    try {
      const response = await fetch('/api/ai-matching/search-v2', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reveal_contact', 
          candidateId 
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCredits(prev => ({ ...prev, available: data.creditsRemaining }))
        // Handle contact reveal
      }
    } catch (error) {
      console.error('Contact reveal failed:', error)
    }
  }

  const quickSearches = [
    "Computer Science students at AUD",
    "Marketing interns with high activity", 
    "Business students ready for internships",
    "Active users in Dubai",
    "Recent graduates interested in startups"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Talent Discovery</h1>
                <p className="text-sm text-gray-600">Find perfect candidates effortlessly</p>
              </div>
            </div>
            
            {/* Credit Display */}
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200/50">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {credits.available} credits
                  </span>
                  <span className="text-xs text-gray-500">
                    ({credits.tier})
                  </span>
                </div>
              </div>
              
              {credits.tier === 'FREE' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {viewMode === 'chat' ? (
          /* Chat-like Search Interface */
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200/50 mb-6">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Next-Generation AI Powered</span>
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Describe your ideal candidate
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Use natural language to find perfect talent matches. Our AI understands context, skills, and personality.
              </p>
            </motion.div>

            {/* Search Input */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative mb-8"
            >
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., 'Computer Science students interested in AI with high activity scores'"
                  className="w-full px-6 py-6 text-lg bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none shadow-lg placeholder-gray-400"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="absolute right-3 top-3 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Search className="h-6 w-6" />
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Quick Search Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <p className="text-sm text-gray-600 mb-4">💡 Try these examples:</p>
              <div className="flex flex-wrap gap-3">
                {quickSearches.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSearchQuery(suggestion)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Features Showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-3 gap-6"
            >
              <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-3 bg-blue-100 rounded-xl w-fit mb-4">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Activity Intelligence</h3>
                <p className="text-gray-600 text-sm">Real-time engagement scoring based on platform activity and application patterns.</p>
              </div>
              
              <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-3 bg-emerald-100 rounded-xl w-fit mb-4">
                  <Target className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Matching</h3>
                <p className="text-gray-600 text-sm">AI analyzes profiles, education, and goals to find the most relevant candidates.</p>
              </div>
              
              <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Credit System</h3>
                <p className="text-gray-600 text-sm">Fair usage with credits. Reveal contacts only when you find the perfect match.</p>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Search Results</h3>
                <p className="text-gray-600">Found {matches.length} candidates matching "{searchQuery}"</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setViewMode('chat')}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-200"
              >
                New Search
              </motion.button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-50 rounded-xl border border-blue-200"
              >
                <p className="text-sm font-medium text-blue-900 mb-2">💡 Try these for better results:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(suggestion)}
                      className="text-xs px-3 py-1 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Results Grid */}
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {matches.map((match, index) => (
                  <motion.div
                    key={match.candidate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    {/* Candidate Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                        {match.candidate.name.charAt(0)}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{match.candidate.name}</h4>
                        {match.candidate.university && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {match.candidate.university}
                          </p>
                        )}
                        {match.candidate.major && (
                          <p className="text-xs text-gray-500">{match.candidate.major}</p>
                        )}
                      </div>

                      {/* Engagement Badge */}
                      <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        match.candidate.engagementLevel === 'HIGH' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : match.candidate.engagementLevel === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {match.candidate.engagementLevel}
                      </div>
                    </div>

                    {/* AI Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">AI Match Score</span>
                        <span className="text-lg font-bold text-gray-900">{Math.round(match.overallScore)}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${match.overallScore}%` }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                          className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                        />
                      </div>
                    </div>

                    {/* AI Explanation */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{match.aiExplanation}</p>
                    </div>

                    {/* Strengths */}
                    {match.strengths.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-600 mb-2">Key Strengths:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.strengths.slice(0, 3).map((strength, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Reveal */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Zap className="h-3 w-3" />
                        {match.contactCredits} credits to reveal
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => revealContact(match.candidate.id)}
                        disabled={credits.available < match.contactCredits}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Reveal Contact
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {matches.length === 0 && !isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or use broader terms</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setViewMode('chat')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl"
                >
                  Try Again
                </motion.button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 