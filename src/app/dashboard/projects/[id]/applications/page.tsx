'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, Zap, Crown, Mail, Phone, Calendar, Star, 
  Filter, Search, CheckCircle, XCircle, Eye, Linkedin, Download,
  GraduationCap, Building, Clock, TrendingUp, Send, MoreVertical
} from 'lucide-react'

// Import types only (no runtime imports of server-side modules)
interface CandidateInfo {
  id: string
  name: string
  email: string
  university?: string
  major?: string
  skills: string[]
  score?: number
  rank?: number
  applicationId: string
}

interface InterviewAutomationFeatures {
  canSeeAllApplicants: boolean
  canSeeScores: boolean
  automatedEmails: boolean
  fullInterviewService: boolean
  candidatePoolSize: number
  manualEmailsOnly: boolean
}

interface Project {
  id: string
  title: string
  description: string
  status: string
  skillsRequired: string[]
  company: {
    name: string
    email: string
  }
}

export default function EnhancedApplicationManagement() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  // State
  const [project, setProject] = useState<Project | null>(null)
  const [candidates, setCandidates] = useState<CandidateInfo[]>([])
  const [totalApplications, setTotalApplications] = useState(0)
  const [features, setFeatures] = useState<InterviewAutomationFeatures | null>(null)
  const [hasScoring, setHasScoring] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI State
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'name' | 'university'>('rank')
  const [filterBy, setFilterBy] = useState<'all' | 'top10' | 'scored'>('all')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState<CandidateInfo | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load data
  useEffect(() => {
    if (!session?.user?.role || session.user.role !== 'COMPANY') {
      router.push('/dashboard')
      return
    }
    
    fetchData()
  }, [session, projectId, router])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch project details
      const projectRes = await fetch(`/api/projects/${projectId}`)
      if (!projectRes.ok) throw new Error('Failed to fetch project')
      const projectData = await projectRes.json()
      setProject(projectData)

      // Get processed candidates via API call
      const candidatesResponse = await fetch(`/api/projects/${projectId}/candidates?subscription=${(session?.user as any)?.subscriptionPlan || 'FREE'}`)
      if (candidatesResponse.ok) {
        const candidatesData = await candidatesResponse.json()
        setCandidates(candidatesData.candidates || [])
        setTotalApplications(candidatesData.totalApplications || 0)
        setFeatures(candidatesData.features || {})
        setHasScoring(candidatesData.hasScoring || false)
      } else {
        // Fallback: basic data without advanced features
        setCandidates([])
        setTotalApplications(0)
        setFeatures({
          canSeeAllApplicants: false,
          canSeeScores: false,
          automatedEmails: false,
          fullInterviewService: false,
          candidatePoolSize: 0,
          manualEmailsOnly: true
        })
        setHasScoring(false)
      }

    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('Failed to load application data')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort candidates
  const filteredCandidates = candidates
    .filter(candidate => {
      const matchesSearch = !searchTerm || 
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.major?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filterBy === 'all' ||
        (filterBy === 'top10' && candidate.rank && candidate.rank <= 10) ||
        (filterBy === 'scored' && candidate.score !== undefined)

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0)
        case 'rank':
          return (a.rank || 999) - (b.rank || 999)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'university':
          return (a.university || '').localeCompare(b.university || '')
        default:
          return 0
      }
    })

  // Handle interview invitation
  const handleSendInterview = async (applicationId: string) => {
    if (!features?.automatedEmails) {
      setShowUpgradeModal(true)
      return
    }

    try {
      setIsProcessing(true)
      const response = await fetch('/api/interview/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          interviewType: 'initial'
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert('✅ Interview invitation sent!')
        fetchData() // Refresh data
      } else {
        alert(`❌ ${result.message || result.error}`)
      }
    } catch (error) {
      alert('Failed to send interview invitation')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle bulk shortlist
  const handleBulkShortlist = async () => {
    if (!features?.automatedEmails) {
      setShowUpgradeModal(true)
      return
    }

    try {
      setIsProcessing(true)
      const response = await fetch('/api/applications/bulk-shortlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationIds: selectedCandidates
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ ${result.message}`)
        setSelectedCandidates([])
        fetchData()
      } else {
        alert(`❌ ${result.message || result.error}`)
      }
    } catch (error) {
      alert('Failed to shortlist candidates')
    } finally {
      setIsProcessing(false)
    }
  }

  // Get subscription tier info
  const getSubscriptionInfo = () => {
    const currentPlan = (session?.user as any)?.subscriptionPlan || 'FREE'
    
    const upgradePrompts: { [key: string]: any } = {
      'FREE': {
        showUpgrade: true,
        message: 'Upgrade to Company Basic to see top 10 candidate emails and start hiring!',
        targetPlan: 'COMPANY_BASIC',
        features: [
          'Access to top 10 candidate emails',
          'Manual interview scheduling',
          'Basic application management',
          '1 active project'
        ]
      },
      'COMPANY_BASIC': {
        showUpgrade: true,
        message: 'Upgrade to HR Booster for automated interview scheduling and full candidate visibility!',
        targetPlan: 'COMPANY_PREMIUM',
        features: [
          'See ALL candidate details',
          'AI-powered candidate scoring',
          'Automated interview emails',
          'Bulk candidate actions',
          'Up to 5 active projects'
        ]
      },
      'COMPANY_PREMIUM': {
        showUpgrade: true,
        message: 'Upgrade to HR Agent for hands-off hiring with interview service!',
        targetPlan: 'COMPANY_PRO',
        features: [
          'We conduct interviews for you',
          'Interview transcript analysis',
          'Team recommendations',
          'Unlimited projects',
          'Dedicated account manager'
        ]
      }
    }
    
    return {
      current: currentPlan,
      ...(upgradePrompts[currentPlan] || { showUpgrade: false, message: '', targetPlan: '', features: [] })
    }
  }

  if (!session || session.user?.role !== 'COMPANY') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is for company accounts only.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const subscriptionInfo = getSubscriptionInfo()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {project?.title || 'Project Applications'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {totalApplications} applications
              </span>
              {hasScoring && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Zap className="w-4 h-4" />
                  AI Scoring
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Status Bar */}
        <div className={`px-4 py-2 text-sm ${
          subscriptionInfo.current === 'FREE' ? 'bg-red-50 text-red-700' :
          subscriptionInfo.current === 'COMPANY_BASIC' ? 'bg-yellow-50 text-yellow-700' :
          subscriptionInfo.current === 'COMPANY_PREMIUM' ? 'bg-blue-50 text-blue-700' :
          'bg-purple-50 text-purple-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {subscriptionInfo.current === 'COMPANY_PRO' ? (
                <Crown className="w-4 h-4" />
              ) : (
                <Building className="w-4 h-4" />
              )}
              {subscriptionInfo.current === 'FREE' ? 'Free Trial' :
               subscriptionInfo.current === 'COMPANY_BASIC' ? 'Company Basic' :
               subscriptionInfo.current === 'COMPANY_PREMIUM' ? 'HR Booster' :
               'HR Agent'}
            </span>
            {subscriptionInfo.showUpgrade && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-xs px-2 py-1 bg-white rounded font-medium"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter - Mobile First */}
      <div className="bg-white border-b px-4 py-3">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm whitespace-nowrap"
            >
              <option value="rank">Sort by Rank</option>
              {hasScoring && <option value="score">Sort by Score</option>}
              <option value="name">Sort by Name</option>
              <option value="university">Sort by University</option>
            </select>

            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm whitespace-nowrap"
            >
              <option value="all">All Candidates</option>
              <option value="top10">Top 10</option>
              {hasScoring && <option value="scored">With Scores</option>}
            </select>

            {features?.automatedEmails && selectedCandidates.length > 0 && (
              <button
                onClick={handleBulkShortlist}
                disabled={isProcessing}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm whitespace-nowrap disabled:opacity-50"
              >
                Shortlist ({selectedCandidates.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Application Counter & Email Instructions */}
      <div className="mx-4 mt-4 space-y-4">
        {/* Email Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">📧 Begin to email your candidates for interviews</h3>
              <p className="text-sm text-blue-800 mt-1">
                You can contact candidates manually using the emails shown below, or{' '}
                <span className="font-semibold">upgrade to automate interview scheduling</span> using Bidaaya's email system with branded templates and Calendly integration.
              </p>
            </div>
          </div>
        </div>

        {/* AI Scoring Counter */}
        {!hasScoring && totalApplications < 20 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">🤖 AI Candidate Ranking</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Smart candidate ranking will be available when you reach 20+ applications for statistical accuracy.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 bg-yellow-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (totalApplications / 20) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-yellow-800">
                    {totalApplications}/20
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Begin Shortlisting Button (appears at 20+ applications) */}
        {hasScoring && totalApplications >= 20 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">🎯 AI Ranking Active</h3>
                  <p className="text-sm text-green-800">
                    Candidates are now ranked by AI compatibility scores
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Refresh Rankings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidates List */}
      <div className="px-4 py-4 space-y-3">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No applications received yet'}
            </p>
          </div>
        ) : (
          filteredCandidates.map((candidate, index) => (
            <motion.div
              key={candidate.applicationId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Candidate Header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {features?.automatedEmails && (
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.applicationId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCandidates([...selectedCandidates, candidate.applicationId])
                          } else {
                            setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.applicationId))
                          }
                        }}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{candidate.name}</h3>
                        {candidate.rank && candidate.rank <= 3 && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {candidate.email}
                        </div>
                        {candidate.university && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {candidate.university}
                            {candidate.major && ` - ${candidate.major}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                                     {/* Score/Rank */}
                   <div className="text-right">
                     {hasScoring && candidate.score !== undefined ? (
                       <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                         {candidate.score}%
                       </div>
                     ) : totalApplications >= 20 && candidate.rank ? (
                       <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                         #{candidate.rank}
                       </div>
                     ) : (
                       <div className="bg-gray-50 text-gray-500 px-2 py-1 rounded text-xs">
                         ?
                       </div>
                     )}
                   </div>
                </div>

                {/* Skills */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                          +{candidate.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                                 {/* Actions */}
                 <div className="flex gap-2">
                   {features?.automatedEmails ? (
                     <button
                       onClick={() => handleSendInterview(candidate.applicationId)}
                       disabled={isProcessing}
                       className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                     >
                       <Send className="w-4 h-4" />
                       Send Interview
                     </button>
                   ) : (
                     <button
                       onClick={() => setShowUpgradeModal(true)}
                       className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 text-sm font-medium"
                     >
                       <Crown className="w-4 h-4" />
                       Upgrade to Automate
                     </button>
                   )}
                   
                   <button 
                     onClick={() => setShowDetailsModal(candidate)}
                     className="px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 text-xs font-medium"
                   >
                     See More Details?
                   </button>
                 </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

             {/* Upgrade Modal */}
       <AnimatePresence>
         {showUpgradeModal && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
             onClick={() => setShowUpgradeModal(false)}
           >
             <motion.div
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               onClick={(e) => e.stopPropagation()}
               className="bg-white rounded-xl p-6 max-w-md w-full"
             >
               <div className="text-center">
                 <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                 <h3 className="text-xl font-semibold text-gray-900 mb-2">
                   Automate Interview Scheduling
                 </h3>
                 <p className="text-gray-600 mb-6">
                   {subscriptionInfo.message}
                 </p>
                 
                 <div className="space-y-2 mb-6 text-left">
                   {subscriptionInfo.features.map((feature: string, idx: number) => (
                     <div key={idx} className="flex items-center gap-2 text-sm">
                       <CheckCircle className="w-4 h-4 text-green-500" />
                       {feature}
                     </div>
                   ))}
                 </div>

                 <div className="flex gap-3">
                   <button
                     onClick={() => setShowUpgradeModal(false)}
                     className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                   >
                     Later
                   </button>
                   <button
                     onClick={() => router.push('/subscription')}
                     className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                   >
                     Upgrade Now
                   </button>
                 </div>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Details Modal */}
       <AnimatePresence>
         {showDetailsModal && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
             onClick={() => setShowDetailsModal(null)}
           >
             <motion.div
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               onClick={(e) => e.stopPropagation()}
               className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
             >
               <div className="text-center">
                 <Eye className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                 <h3 className="text-xl font-semibold text-gray-900 mb-2">
                   Want to see more details?
                 </h3>
                 <p className="text-gray-600 mb-6">
                   Upgrade for greater transparency and detailed candidate insights
                 </p>

                 {/* Current Plan Info */}
                 <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                   <h4 className="font-semibold text-gray-900 mb-2">Current Access ({subscriptionInfo.current}):</h4>
                   <div className="space-y-1 text-sm text-gray-700">
                     <div className="flex items-center gap-2">
                       <CheckCircle className="w-4 h-4 text-green-500" />
                       Basic candidate information
                     </div>
                     <div className="flex items-center gap-2">
                       <CheckCircle className="w-4 h-4 text-green-500" />
                       {subscriptionInfo.current === 'FREE' ? 'No email access' : 
                        subscriptionInfo.current === 'COMPANY_BASIC' ? 'Top 10 candidate emails' : 
                        'All candidate emails'}
                     </div>
                   </div>
                 </div>

                 {/* Upgrade Benefits */}
                 <div className="space-y-4 mb-6">
                   <div className="bg-blue-50 rounded-lg p-4 text-left">
                     <h4 className="font-semibold text-blue-900 mb-2">🚀 HR Booster ($75/month):</h4>
                     <div className="space-y-1 text-sm text-blue-800">
                       <div>• Complete candidate profiles & portfolios</div>
                       <div>• AI compatibility scores & detailed analytics</div>
                       <div>• Resume & cover letter access</div>
                       <div>• Automated interview scheduling</div>
                       <div>• Advanced filtering & search</div>
                     </div>
                   </div>

                   <div className="bg-purple-50 rounded-lg p-4 text-left">
                     <h4 className="font-semibold text-purple-900 mb-2">👑 HR Agent ($175/month):</h4>
                     <div className="space-y-1 text-sm text-purple-800">
                       <div>• Everything in HR Booster PLUS:</div>
                       <div>• We conduct interviews for you</div>
                       <div>• Interview transcript analysis</div>
                       <div>• Candidate assessment reports</div>
                       <div>• Team recommendations delivered</div>
                       <div>• Dedicated account manager</div>
                     </div>
                   </div>
                 </div>

                 <div className="flex gap-3">
                   <button
                     onClick={() => setShowDetailsModal(null)}
                     className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                   >
                     Maybe Later
                   </button>
                   <button
                     onClick={() => {
                       setShowDetailsModal(null)
                       router.push('/subscription')
                     }}
                     className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium"
                   >
                     See Pricing
                   </button>
                 </div>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  )
} 