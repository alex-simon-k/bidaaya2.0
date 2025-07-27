'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Star, 
  Crown, 
  Mail, 
  GraduationCap,
  Briefcase,
  Eye,
  EyeOff,
  TrendingUp,
  Award,
  Lock,
  Sparkles,
  ChevronRight,
  Brain,
  Target,
  Calendar,
  MapPin
} from 'lucide-react'
import { CompanyPaywallModal } from '@/components/company-paywall-modal'
import { getCompanyProjectLimitUpgradePrompt } from '@/lib/subscription'

interface ShortlistedCandidate {
  applicationId: string
  userId: string
  compatibilityScore: number
  ranking: number
  user: {
    id: string
    name: string
    email?: string
    university?: string
    major?: string
    skills: string[]
    bio?: string
    linkedin?: string
    graduationYear?: number
  }
  application: {
    coverLetter?: string
    motivation?: string
    createdAt: Date
  }
  aiInsights?: {
    keyStrengths: string[]
    concerns: string[]
    recommendation: string
  }
}

interface ShortlistData {
  projectId: string
  totalApplications: number
  shortlistedCount: number
  candidates: ShortlistedCandidate[]
  generatedAt: Date
  visibilityLevel: 'shortlisted_only' | 'full_pool' | 'complete_transparency'
  upgradePrompt?: {
    currentTier: string
    benefits: string[]
    nextTier: string
  }
}

interface ShortlistEligibility {
  eligible: boolean
  currentApplications: number
  requiredApplications: number
  remainingNeeded: number
  estimatedTimeToEligibility?: string
}

interface AIShortlistPanelProps {
  projectId: string
  projectTitle: string
  onCandidateSelect?: (candidateId: string) => void
}

export function AIShortlistPanel({ 
  projectId, 
  projectTitle, 
  onCandidateSelect 
}: AIShortlistPanelProps) {
  const [shortlistData, setShortlistData] = useState<ShortlistData | null>(null)
  const [eligibility, setEligibility] = useState<ShortlistEligibility | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)

  useEffect(() => {
    fetchShortlistData()
  }, [projectId])

  const fetchShortlistData = async () => {
    try {
    setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/projects/${projectId}/shortlist`)
      const data = await response.json()

      if (response.ok) {
        setEligibility(data.eligibility)
        setShortlistData(data.shortlist)
      } else {
        setError(data.error || 'Failed to fetch shortlist data')
      }
    } catch (error) {
      setError('Failed to fetch shortlist data')
      console.error('Error fetching shortlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateShortlist = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/shortlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'generate' }),
      })

      const data = await response.json()

      if (response.ok) {
        setShortlistData(data.shortlist)
        // Show success message or animation
        alert(data.message)
      } else {
        setError(data.error || 'Failed to generate shortlist')
      }
    } catch (error) {
      setError('Failed to generate shortlist')
      console.error('Error generating shortlist:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Award className="h-4 w-4" />
    if (score >= 60) return <Star className="h-4 w-4" />
    return <TrendingUp className="h-4 w-4" />
  }

  const isDataLocked = (field: string) => {
    const level = shortlistData?.visibilityLevel
    if (level === 'complete_transparency') return false
    if (level === 'full_pool') return ['aiInsights'].includes(field)
    return ['email', 'linkedin', 'coverLetter', 'motivation', 'aiInsights'].includes(field)
  }

  const LockedField = ({ field, children }: { field: string, children: React.ReactNode }) => {
    const locked = isDataLocked(field)
    
    if (!locked) return <>{children}</>

  return (
      <div className="relative">
        <div className="filter blur-sm pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
          >
            <Lock className="h-3 w-3" />
            Upgrade to View
          </button>
        </div>
          </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-8 w-8" />
          <h2 className="text-2xl font-bold">AI Recruitment Assistant</h2>
        </div>
        <p className="text-blue-100">
          Our AI analyzes all applications and identifies the best candidates for {projectTitle}
        </p>
      </div>

      {/* Eligibility Status */}
      {!eligibility?.eligible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <Target className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-orange-900 mb-2">
                Building Your Candidate Pool
              </h3>
              <p className="text-orange-700 mb-4">
                AI shortlisting activates automatically when you reach 30 applications. 
                You currently have {eligibility?.currentApplications} applications.
              </p>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Applications Progress</span>
                  <span className="text-sm text-orange-600 font-semibold">
                    {eligibility?.currentApplications}/{eligibility?.requiredApplications}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, ((eligibility?.currentApplications || 0) / (eligibility?.requiredApplications || 30)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="text-sm text-orange-600">
                <strong>{eligibility?.remainingNeeded} more applications needed</strong>
                {eligibility?.estimatedTimeToEligibility && (
                  <span className="ml-2">• ETA: {eligibility.estimatedTimeToEligibility}</span>
                )}
              </div>
            </div>
        </div>
        </motion.div>
      )}

      {/* Shortlist Results */}
      {eligibility?.eligible && (
        <div className="bg-white rounded-2xl shadow-sm border">
          {!shortlistData ? (
            <div className="p-8 text-center">
              <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready for AI Shortlisting
              </h3>
              <p className="text-gray-600 mb-6">
                You have {eligibility.currentApplications} applications. Let our AI identify the top candidates.
              </p>
          <button
                onClick={handleGenerateShortlist}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
                {isGenerating ? (
              <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Candidates...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                    Generate AI Shortlist
              </>
            )}
          </button>
            </div>
          ) : (
            <div className="p-6">
              {/* Shortlist Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Top {shortlistData.shortlistedCount} Candidates
                  </h3>
                  <p className="text-gray-600">
                    Selected from {shortlistData.totalApplications} applications • 
                    Generated {new Date(shortlistData.generatedAt).toLocaleDateString()}
                  </p>
        </div>
                
                {shortlistData.visibilityLevel !== 'complete_transparency' && shortlistData.upgradePrompt && (
            <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
            >
                    <Crown className="h-4 w-4" />
                    Upgrade for More Details
            </button>
                )}
          </div>

              {/* Candidates List */}
          <div className="space-y-4">
                {shortlistData.candidates.map((candidate, index) => (
              <motion.div
                    key={candidate.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                    className={`bg-gray-50 rounded-xl p-6 hover:shadow-md transition-all cursor-pointer ${
                      selectedCandidate === candidate.userId ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedCandidate(candidate.userId)
                      onCandidateSelect?.(candidate.userId)
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Ranking Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                          #{candidate.ranking}
                </div>
                      </div>

                      {/* Candidate Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{candidate.user.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {candidate.user.university && (
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="h-4 w-4" />
                                  {candidate.user.university}
                                </span>
                              )}
                              {candidate.user.major && (
                                <span>• {candidate.user.major}</span>
                    )}
                  </div>
                          </div>

                          {/* AI Score */}
                          <div className={`px-3 py-1 rounded-full ${getScoreColor(candidate.compatibilityScore)} flex items-center gap-1`}>
                            {getScoreIcon(candidate.compatibilityScore)}
                            <span className="font-semibold">{candidate.compatibilityScore}%</span>
                          </div>
                    </div>

                        {/* Skills */}
                        {candidate.user.skills.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-2">
                              {candidate.user.skills.slice(0, 5).map((skill, idx) => (
                        <span
                                  key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                              {candidate.user.skills.length > 5 && (
                                <span className="text-xs text-gray-500">
                                  +{candidate.user.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                        )}

                        {/* Bio */}
                        {candidate.user.bio && (
                          <LockedField field="bio">
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {candidate.user.bio}
                            </p>
                          </LockedField>
                        )}

                        {/* Contact Info & Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <LockedField field="email">
                              {candidate.user.email && (
                                <a
                                  href={`mailto:${candidate.user.email}`}
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  <Mail className="h-4 w-4" />
                                  Contact
                                </a>
                              )}
                            </LockedField>

                            <LockedField field="linkedin">
                              {candidate.user.linkedin && (
                                <a
                                  href={candidate.user.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  <Briefcase className="h-4 w-4" />
                                  LinkedIn
                                </a>
                              )}
                            </LockedField>
                          </div>

                          <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
                            View Details
                            <ChevronRight className="h-4 w-4" />
                          </button>
                </div>

                        {/* AI Insights (Premium only) */}
                        <LockedField field="aiInsights">
                          {candidate.aiInsights && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-purple-600" />
                                <span className="font-semibold text-purple-900">AI Analysis</span>
                              </div>
                              <p className="text-sm text-purple-700 mb-2">
                                {candidate.aiInsights.recommendation}
                              </p>
                              {candidate.aiInsights.keyStrengths.length > 0 && (
                                <div className="text-xs text-green-700">
                                  <strong>Strengths:</strong> {candidate.aiInsights.keyStrengths.join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </LockedField>
                    </div>
                    </div>
                  </motion.div>
                ))}
                    </div>

              {/* Upgrade Prompt */}
              {shortlistData.upgradePrompt && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-purple-900">
                        Unlock Complete Candidate Details
                      </h4>
                      <p className="text-sm text-purple-700">
                        Upgrade to {shortlistData.upgradePrompt.nextTier} to see email addresses, 
                        full profiles, and AI insights.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              )}
                </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchShortlistData}
            className="mt-2 text-red-600 hover:text-red-700 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && shortlistData?.upgradePrompt && (
        <CompanyPaywallModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          promptConfig={{
            title: "🔓 Unlock Full Candidate Insights",
            description: "Get complete access to candidate details and AI-powered recruitment insights.",
            benefits: shortlistData.upgradePrompt.benefits,
            currentPlan: shortlistData.upgradePrompt.currentTier,
                         recommendedPlan: {
               id: 'COMPANY_PREMIUM',
               name: 'HR Booster',
               price: 75,
               description: 'Full candidate visibility',
               features: shortlistData.upgradePrompt.benefits,
               applicationsPerMonth: -1
             },
            ctaText: `Upgrade to ${shortlistData.upgradePrompt.nextTier}`,
            urgency: 'Used by leading companies for better hiring'
          }}
                     trigger="project_limit"
        />
      )}
    </div>
  )
} 