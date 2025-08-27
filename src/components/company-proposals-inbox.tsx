'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Inbox, 
  User, 
  Calendar, 
  ExternalLink, 
  Star,
  MapPin,
  GraduationCap,
  FileText,
  Eye,
  MessageSquare,
  Filter,
  X
} from 'lucide-react'

interface StudentProposal {
  id: string
  studentName: string
  studentEmail: string
  studentUniversity: string
  studentMajor: string
  proposalContent: {
    personalIntro: string
    proudAchievement: string
    valueProposition: string
    specificRole: string
    availability: string
    portfolio?: string
  }
  submittedAt: Date
  status: 'new' | 'viewed' | 'responded'
}

export default function CompanyProposalsInbox() {
  const { data: session } = useSession()
  const [proposals, setProposals] = useState<StudentProposal[]>([])
  const [selectedProposal, setSelectedProposal] = useState<StudentProposal | null>(null)
  const [filter, setFilter] = useState<'all' | 'new' | 'viewed'>('all')
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactSubject, setContactSubject] = useState('')
  const [isContacting, setIsContacting] = useState(false)

  useEffect(() => {
    loadProposals()
  }, [])

  const loadProposals = async () => {
    try {
      console.log('📥 Loading company proposals...')
      const response = await fetch('/api/proposals')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load proposals')
      }
      
      const data = await response.json()
      console.log(`✅ Loaded ${data.proposals.length} proposals`)
      
      setProposals(data.proposals || [])
    } catch (error) {
      console.error('❌ Error loading proposals:', error)
      // Show empty state on error
      setProposals([])
    }
  }

  const markAsViewed = (proposalId: string) => {
    setProposals(prev => prev.map(p => 
      p.id === proposalId ? { ...p, status: 'viewed' } : p
    ))
  }

  const handleContactStudent = () => {
    if (!selectedProposal) return
    setContactSubject(`Regarding your proposal for ${selectedProposal.proposalContent.specificRole}`)
    setContactMessage('')
    setShowContactModal(true)
  }

  const sendContactMessage = async () => {
    if (!selectedProposal || !contactMessage.trim() || !contactSubject.trim()) return

    setIsContacting(true)
    try {
      const response = await fetch('/api/proposals/contact-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: selectedProposal.id,
          message: contactMessage,
          subject: contactSubject
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to contact student')
      }

      // Mark proposal as responded
      setProposals(prev => prev.map(p => 
        p.id === selectedProposal.id ? { ...p, status: 'responded' } : p
      ))

      setShowContactModal(false)
      setContactMessage('')
      setContactSubject('')
      
      // Show success message or notification here
      alert('Message sent successfully to student!')

    } catch (error) {
      console.error('Failed to contact student:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsContacting(false)
    }
  }

  const filteredProposals = proposals.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  const newProposalsCount = proposals.filter(p => p.status === 'new').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Inbox className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Proposals Inbox</h1>
                <p className="text-gray-600">
                  {newProposalsCount} new proposal{newProposalsCount !== 1 ? 's' : ''} from students
                </p>
              </div>
            </div>
            
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Proposals</option>
                <option value="new">New</option>
                <option value="viewed">Viewed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proposals List */}
          <div className="lg:col-span-1 space-y-4">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
                <p className="text-gray-600">Students will be able to send you proposals directly.</p>
              </div>
            ) : (
              filteredProposals.map((proposal) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                    selectedProposal?.id === proposal.id ? 'border-blue-500 shadow-md' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedProposal(proposal)
                    if (proposal.status === 'new') {
                      markAsViewed(proposal.id)
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{proposal.studentName}</h3>
                        <p className="text-sm text-gray-600">{proposal.studentMajor}</p>
                      </div>
                    </div>
                    {proposal.status === 'new' && (
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {proposal.studentUniversity}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                    {proposal.proposalContent.personalIntro}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Role: {proposal.proposalContent.specificRole}</span>
                    <span>{new Date(proposal.submittedAt).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Proposal Details */}
          <div className="lg:col-span-2">
            {selectedProposal ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-gray-200 rounded-xl p-6"
              >
                {/* Student Header */}
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedProposal.studentName}</h2>
                        <p className="text-gray-600">{selectedProposal.studentEmail}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            {selectedProposal.studentUniversity}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {selectedProposal.studentMajor}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Applied for</p>
                      <p className="font-semibold text-gray-900">{selectedProposal.proposalContent.specificRole}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(selectedProposal.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proposal Content */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Introduction</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedProposal.proposalContent.personalIntro}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Achievement</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedProposal.proposalContent.proudAchievement}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Value Proposition</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedProposal.proposalContent.valueProposition}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
                      <p className="text-gray-700">{selectedProposal.proposalContent.availability}</p>
                    </div>

                    {selectedProposal.proposalContent.portfolio && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Portfolio & Links</h3>
                        <div className="text-gray-700 whitespace-pre-line">
                          {selectedProposal.proposalContent.portfolio}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleContactStudent}
                      disabled={selectedProposal?.status === 'responded'}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        selectedProposal?.status === 'responded' 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {selectedProposal?.status === 'responded' ? 'Already Contacted' : 'Contact Student'}
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                      Save for Later
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 transition-colors">
                      Mark as Not Interested
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a proposal to view</h3>
                <p className="text-gray-600">Click on a proposal from the list to see the full details.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Student Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Contact {selectedProposal?.studentName}
                </h3>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Enter email subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Write your message to the student..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    📧 This message will be sent to <strong>{selectedProposal?.studentEmail}</strong> with you CC'd for transparency.
                    The student can reply directly to continue the conversation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={sendContactMessage}
                  disabled={isContacting || !contactMessage.trim() || !contactSubject.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isContacting ? 'Sending...' : 'Send Message'}
                </button>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 