'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  CheckCircle, 
  Calendar, 
  Trophy,
  ArrowRight,
  Filter,
  Search,
  MoreVertical,
  UserCheck,
  MessageSquare,
  Mail,
  Phone
} from 'lucide-react'
import { AIShortlistPanel } from './ai-shortlist-panel'

type CandidateStatus = 'PENDING' | 'SHORTLISTED' | 'INTERVIEWED' | 'SELECTED' | 'REJECTED'

interface Candidate {
  id: string
  applicationId: string
  user: {
    id: string
    name: string
    email: string
    university?: string
    major?: string
    skills: string[]
    bio?: string
    graduationYear?: number
  }
  status: CandidateStatus
  compatibilityScore: number
  appliedDate: Date
  notes?: string
  interviewDate?: Date
  interviewNotes?: string
}

interface CompanyRecruitmentWorkflowProps {
  projectId: string
  projectTitle: string
  onStatusUpdate?: (candidateId: string, newStatus: CandidateStatus) => void
}

export function CompanyRecruitmentWorkflow({ 
  projectId, 
  projectTitle,
  onStatusUpdate 
}: CompanyRecruitmentWorkflowProps) {
  const [activeTab, setActiveTab] = useState<CandidateStatus>('PENDING')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  const statusConfig = {
    PENDING: { 
      label: 'All Applicants', 
      color: 'bg-gray-100 text-gray-800',
      icon: Users 
    },
    SHORTLISTED: { 
      label: 'Shortlisted', 
      color: 'bg-blue-100 text-blue-800',
      icon: UserCheck 
    },
    INTERVIEWED: { 
      label: 'Interviewed', 
      color: 'bg-purple-100 text-purple-800',
      icon: MessageSquare 
    },
    SELECTED: { 
      label: 'Selected', 
      color: 'bg-green-100 text-green-800',
      icon: Trophy 
    },
    REJECTED: { 
      label: 'Rejected', 
      color: 'bg-red-100 text-red-800',
      icon: CheckCircle 
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [projectId])

  useEffect(() => {
    // Filter candidates based on search and active tab
    let filtered = candidates.filter(candidate => 
      candidate.status === activeTab || activeTab === 'PENDING'
    )

    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.user.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.user.major?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCandidates(filtered)
  }, [candidates, activeTab, searchTerm])

  const fetchCandidates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/applications`)
      const data = await response.json()

      if (response.ok) {
        setCandidates(data.applications || [])
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateCandidateStatus = async (candidateId: string, newStatus: CandidateStatus) => {
    try {
      const response = await fetch(`/api/applications/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setCandidates(prev => 
          prev.map(candidate => 
            candidate.applicationId === candidateId 
              ? { ...candidate, status: newStatus }
              : candidate
          )
        )
        onStatusUpdate?.(candidateId, newStatus)
      }
    } catch (error) {
      console.error('Failed to update candidate status:', error)
    }
  }

  const handleBulkStatusUpdate = async (newStatus: CandidateStatus) => {
    try {
      await Promise.all(
        selectedCandidates.map(candidateId => 
          updateCandidateStatus(candidateId, newStatus)
        )
      )
      setSelectedCandidates([])
      setShowBulkActions(false)
    } catch (error) {
      console.error('Failed to bulk update candidates:', error)
    }
  }

  const getCandidatesByStatus = (status: CandidateStatus) => {
    return candidates.filter(candidate => candidate.status === status).length
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Recruitment Pipeline - {projectTitle}
        </h2>
        
        {/* Status Tabs */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon
            const count = status === 'PENDING' ? candidates.length : getCandidatesByStatus(status as CandidateStatus)
            
            return (
              <motion.button
                key={status}
                onClick={() => setActiveTab(status as CandidateStatus)}
                className={`p-4 rounded-xl text-left transition-all ${
                  activeTab === status 
                    ? 'bg-blue-50 border-2 border-blue-200' 
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${activeTab === status ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className={`text-2xl font-bold ${activeTab === status ? 'text-blue-600' : 'text-gray-900'}`}>
                    {count}
                  </span>
                </div>
                <div className={`text-sm font-medium ${activeTab === status ? 'text-blue-900' : 'text-gray-700'}`}>
                  {config.label}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          
          {selectedCandidates.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedCandidates.length} selected
              </span>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Bulk Actions
              </button>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  Bulk Actions for {selectedCandidates.length} candidates:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate('SHORTLISTED')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('INTERVIEWED')}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                  >
                    Mark Interviewed
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('REJECTED')}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Candidates List */}
        <div className="space-y-4">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No candidates found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria' : 'No applications in this status yet'}
              </p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => (
              <motion.div
                key={candidate.applicationId}
                layout
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate.applicationId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCandidates(prev => [...prev, candidate.applicationId])
                        } else {
                          setSelectedCandidates(prev => prev.filter(id => id !== candidate.applicationId))
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{candidate.user.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[candidate.status].color}`}>
                          {statusConfig[candidate.status].label}
                        </span>
                        {candidate.compatibilityScore && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {candidate.compatibilityScore}% match
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {candidate.user.university && (
                          <span>{candidate.user.university}</span>
                        )}
                        {candidate.user.major && (
                          <span> • {candidate.user.major}</span>
                        )}
                        {candidate.user.graduationYear && (
                          <span> • Class of {candidate.user.graduationYear}</span>
                        )}
                      </div>
                      
                      {candidate.user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {candidate.user.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {skill}
                            </span>
                          ))}
                          {candidate.user.skills.length > 3 && (
                            <span className="px-2 py-1 text-xs text-gray-500">
                              +{candidate.user.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600">
                      <Mail className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600">
                      <Calendar className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* AI Shortlisting Panel */}
      {activeTab === 'SHORTLISTED' && (
        <AIShortlistPanel 
          projectId={projectId} 
          projectTitle={projectTitle}
          onCandidateSelect={(candidateId) => {
            // Handle candidate selection for detailed view
            console.log('Selected candidate:', candidateId)
          }}
        />
      )}
    </div>
  )
} 