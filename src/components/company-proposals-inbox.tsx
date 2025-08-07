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
  Filter
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

  useEffect(() => {
    loadProposals()
  }, [])

  const loadProposals = async () => {
    // Mock data for now - in production this would be an API call
    const mockProposals: StudentProposal[] = [
      {
        id: '1',
        studentName: 'Sarah Ahmed',
        studentEmail: 'sarah.ahmed@student.ac.ae',
        studentUniversity: 'American University of Dubai',
        studentMajor: 'Computer Science',
        proposalContent: {
          personalIntro: 'I am a passionate Computer Science student with a strong interest in fintech and artificial intelligence. I have been following your company\'s work in payment solutions and am excited about the opportunity to contribute.',
          proudAchievement: 'I developed a mobile expense tracking app that gained over 2,000 downloads and won the university\'s innovation competition. The app uses machine learning to categorize expenses automatically.',
          valueProposition: 'I can bring fresh perspectives on user experience design and help develop mobile-first solutions that appeal to younger demographics. My technical skills in React Native and Python would be valuable for your development team.',
          specificRole: 'Mobile Developer Intern',
          availability: 'Available immediately for 6-month internship, 40 hours per week',
          portfolio: 'GitHub: github.com/sarahdev\nPortfolio: sarahahmed.dev'
        },
        submittedAt: new Date('2024-08-05'),
        status: 'new'
      },
      {
        id: '2',
        studentName: 'Omar Hassan',
        studentEmail: 'omar.hassan@university.ae',
        studentUniversity: 'Khalifa University',
        studentMajor: 'Business Administration',
        proposalContent: {
          personalIntro: 'Business Administration student with a focus on digital marketing and strategy. I have been researching fintech trends in the MENA region and am particularly interested in payment innovation.',
          proudAchievement: 'Led a team of 5 students in developing a comprehensive market analysis for a local startup, which helped them secure their first round of funding. Our recommendations increased their user acquisition by 150%.',
          valueProposition: 'I can help bridge the gap between technical development and business strategy. My market research skills and understanding of the local business environment would be valuable for expanding your customer base.',
          specificRole: 'Business Development Intern',
          availability: 'Part-time during semester (20 hours/week), full-time during summer',
          portfolio: 'LinkedIn: linkedin.com/in/omar-hassan\nProject portfolio available upon request'
        },
        submittedAt: new Date('2024-08-04'),
        status: 'viewed'
      }
    ]
    setProposals(mockProposals)
  }

  const markAsViewed = (proposalId: string) => {
    setProposals(prev => prev.map(p => 
      p.id === proposalId ? { ...p, status: 'viewed' } : p
    ))
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
                    <span>{proposal.submittedAt.toLocaleDateString()}</span>
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
                        {selectedProposal.submittedAt.toLocaleDateString()}
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
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Contact Student
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
    </div>
  )
} 