'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Eye, 
  Phone, 
  CheckCircle, 
  XCircle,
  Clock,
  Star,
  MessageSquare,
  Calendar,
  FileText,
  Upload,
  Download,
  Filter,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  Send,
  ArrowRight,
  ArrowLeft,
  Target,
  Award,
  AlertCircle
} from 'lucide-react'

interface Candidate {
  id: string
  name: string
  email: string
  university?: string
  major?: string
  whatsapp?: string
  linkedin?: string
  status: 'PENDING' | 'SHORTLISTED' | 'INTERVIEWED' | 'ACCEPTED' | 'REJECTED'
  appliedAt: string
  updatedAt: string
  coverLetter?: string
  resumeUrl?: string
  adminNotes?: string
  aiScore?: number
  aiEvaluation?: string
  interviewNotes?: string
  interviewScore?: number
  interviewDate?: string
  transcriptUrl?: string
  finalScore?: number
  rejectionReason?: string
}

interface TeamSelectionFunnelProps {
  projectId: string
  projectTitle: string
  isCompanyView?: boolean
}

const CANDIDATE_STATUSES = [
  { 
    id: 'PENDING', 
    label: 'Applicants', 
    icon: Users, 
    color: 'blue',
    description: 'Initial applications received'
  },
  { 
    id: 'SHORTLISTED', 
    label: 'Shortlisted', 
    icon: Eye, 
    color: 'yellow',
    description: 'Candidates selected for interview'
  },
  { 
    id: 'INTERVIEWED', 
    label: 'Interviewed', 
    icon: Phone, 
    color: 'purple',
    description: 'Completed interviews'
  },
  { 
    id: 'ACCEPTED', 
    label: 'Selected', 
    icon: CheckCircle, 
    color: 'green',
    description: 'Final team members'
  },
  { 
    id: 'REJECTED', 
    label: 'Rejected', 
    icon: XCircle, 
    color: 'red',
    description: 'Not progressed'
  }
]

export function TeamSelectionFunnel({ projectId, projectTitle, isCompanyView = false }: TeamSelectionFunnelProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('PENDING')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchCandidates()
  }, [projectId])

  const fetchCandidates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/applications`)
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.applications || [])
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateCandidateStatus = async (candidateId: string, newStatus: string, notes?: string) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/applications/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          adminNotes: notes,
          updatedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        await fetchCandidates()
      }
    } catch (error) {
      console.error('Failed to update candidate status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const bulkUpdateStatus = async (candidateIds: string[], newStatus: string) => {
    try {
      setIsUpdating(true)
      await Promise.all(
        candidateIds.map(id => updateCandidateStatus(id, newStatus))
      )
      setSelectedCandidates([])
      setShowBulkActions(false)
    } catch (error) {
      console.error('Failed to bulk update candidates:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredCandidates = candidates
    .filter(candidate => candidate.status === activeStatus)
    .filter(candidate => 
      candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.university?.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const getCandidateCount = (status: string) => {
    return candidates.filter(candidate => candidate.status === status).length
  }

  const getStatusColor = (status: string) => {
    const statusConfig = CANDIDATE_STATUSES.find(s => s.id === status)
    return statusConfig?.color || 'gray'
  }

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = CANDIDATE_STATUSES.findIndex(s => s.id === currentStatus)
    if (currentIndex < CANDIDATE_STATUSES.length - 2) { // Exclude REJECTED
      return CANDIDATE_STATUSES[currentIndex + 1].id
    }
    return null
  }

  const getPreviousStatus = (currentStatus: string) => {
    const currentIndex = CANDIDATE_STATUSES.findIndex(s => s.id === currentStatus)
    if (currentIndex > 0) {
      return CANDIDATE_STATUSES[currentIndex - 1].id
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Team Selection Funnel</h2>
            <p className="text-gray-600">{projectTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {candidates.length} total candidates
            </span>
            {selectedCandidates.length > 0 && (
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                {selectedCandidates.length} selected
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {CANDIDATE_STATUSES.map((status, index) => {
            const count = getCandidateCount(status.id)
            const Icon = status.icon
            const isActive = activeStatus === status.id
            
            return (
              <motion.button
                key={status.id}
                onClick={() => setActiveStatus(status.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  isActive
                    ? `border-${status.color}-500 bg-${status.color}-50 text-${status.color}-700`
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{status.label}</div>
                  <div className="text-sm opacity-75">{count} candidates</div>
                </div>
                {index < CANDIDATE_STATUSES.length - 1 && (
                  <ArrowRight className="h-4 w-4 ml-2 opacity-50" />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Conversion Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{getCandidateCount('PENDING')}</p>
            <p className="text-sm text-gray-600">Applications</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{getCandidateCount('SHORTLISTED')}</p>
            <p className="text-sm text-gray-600">Shortlisted</p>
            <p className="text-xs text-green-600">
              {getCandidateCount('PENDING') > 0 ? 
                `${((getCandidateCount('SHORTLISTED') / getCandidateCount('PENDING')) * 100).toFixed(1)}%` : 
                '0%'
              } rate
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{getCandidateCount('INTERVIEWED')}</p>
            <p className="text-sm text-gray-600">Interviewed</p>
            <p className="text-xs text-green-600">
              {getCandidateCount('SHORTLISTED') > 0 ? 
                `${((getCandidateCount('INTERVIEWED') / getCandidateCount('SHORTLISTED')) * 100).toFixed(1)}%` : 
                '0%'
              } rate
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{getCandidateCount('ACCEPTED')}</p>
            <p className="text-sm text-gray-600">Selected</p>
            <p className="text-xs text-green-600">
              {getCandidateCount('INTERVIEWED') > 0 ? 
                `${((getCandidateCount('ACCEPTED') / getCandidateCount('INTERVIEWED')) * 100).toFixed(1)}%` : 
                '0%'
              } rate
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {showBulkActions && selectedCandidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-blue-900 font-medium">
                {selectedCandidates.length} candidate(s) selected
              </p>
              <div className="flex gap-2">
                {getNextStatus(activeStatus) && (
                  <button
                    onClick={() => bulkUpdateStatus(selectedCandidates, getNextStatus(activeStatus)!)}
                    disabled={isUpdating}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    Move to {CANDIDATE_STATUSES.find(s => s.id === getNextStatus(activeStatus))?.label}
                  </button>
                )}
                <button
                  onClick={() => bulkUpdateStatus(selectedCandidates, 'REJECTED')}
                  disabled={isUpdating}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => setSelectedCandidates([])}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No candidates in {CANDIDATE_STATUSES.find(s => s.id === activeStatus)?.label}
            </h3>
            <p className="text-gray-600">
              {activeStatus === 'PENDING' 
                ? 'Waiting for applications to come in...'
                : `Move candidates here from previous stages.`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCandidates.map((candidate) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCandidates([...selectedCandidates, candidate.id])
                        } else {
                          setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.id))
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                      <p className="text-sm text-gray-600">{candidate.email}</p>
                      {candidate.university && (
                        <p className="text-sm text-gray-500">{candidate.university} • {candidate.major}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Applied {new Date(candidate.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* AI Score */}
                    {candidate.aiScore && (
                      <div className="text-center">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          candidate.aiScore >= 80 ? 'bg-green-100 text-green-800' :
                          candidate.aiScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {candidate.aiScore}/100
                        </div>
                        <p className="text-xs text-gray-500 mt-1">AI Score</p>
                      </div>
                    )}

                    {/* Interview Score */}
                    {candidate.interviewScore && activeStatus === 'INTERVIEWED' && (
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < candidate.interviewScore! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Interview</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowDetails(showDetails === candidate.id ? null : candidate.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Quick Actions */}
                      {getNextStatus(activeStatus) && (
                        <button
                          onClick={() => updateCandidateStatus(candidate.id, getNextStatus(activeStatus)!)}
                          disabled={isUpdating}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg disabled:opacity-50"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => updateCandidateStatus(candidate.id, 'REJECTED')}
                        disabled={isUpdating}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>

                      <button className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {showDetails === candidate.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                          {candidate.coverLetter && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Cover Letter</h5>
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                {candidate.coverLetter}
                              </p>
                            </div>
                          )}

                          {candidate.linkedin && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Contact Information</h5>
                              <div className="space-y-1 text-sm">
                                <p>LinkedIn: <a href={candidate.linkedin} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{candidate.linkedin}</a></p>
                                {candidate.whatsapp && <p>WhatsApp: {candidate.whatsapp}</p>}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          {candidate.aiEvaluation && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">AI Evaluation</h5>
                              <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                                {candidate.aiEvaluation}
                              </p>
                            </div>
                          )}

                          {candidate.interviewNotes && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Interview Notes</h5>
                              <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg">
                                {candidate.interviewNotes}
                              </p>
                            </div>
                          )}

                          {candidate.adminNotes && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Admin Notes</h5>
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                {candidate.adminNotes}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            {candidate.resumeUrl && (
                              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                                <FileText className="h-4 w-4" />
                                View Resume
                              </button>
                            )}
                            {candidate.transcriptUrl && (
                              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                                <FileText className="h-4 w-4" />
                                View Transcript
                              </button>
                            )}
                            <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                              <MessageSquare className="h-4 w-4" />
                              Send Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 