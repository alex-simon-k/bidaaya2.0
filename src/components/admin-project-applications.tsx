'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Eye, 
  Mail, 
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Bot,
  Filter,
  Search,
  MoreHorizontal,
  ExternalLink,
  Calendar,
  User,
  Building,
  MapPin,
  Phone,
  Linkedin,
  ArrowLeft,
  Zap,
  Crown,
  Check,
  X
} from 'lucide-react'

interface Application {
  id: string
  userId?: string
  status: string
  compatibilityScore?: number
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    university?: string
    major?: string
    linkedin?: string
    whatsapp?: string
    bio?: string
  }
  whyInterested?: string
  proposedApproach?: string
  coverLetter?: string
  motivation?: string
  relevantExperience?: string
  portfolioUrl?: string
  availableStartDate?: string
  expectedCompensation?: string
}

interface Project {
  id: string
  title: string
  company: {
    name?: string
    companyName?: string
  }
  applications?: Application[]
}

interface AdminProjectApplicationsProps {
  project: Project
  onBack: () => void
}

export default function AdminProjectApplications({ project, onBack }: AdminProjectApplicationsProps) {
  const [applications, setApplications] = useState<Application[]>(project.applications || [])
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [isAIShortlisting, setIsAIShortlisting] = useState(false)
  const [emailsSent, setEmailsSent] = useState<Record<string, boolean>>({})
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.major?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? { ...app, status: newStatus as any } : app
          )
        )
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const sendInterviewEmail = async (application: Application) => {
    try {
      const response = await fetch('/api/admin/applications/interview-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          projectId: project.id,
          studentEmail: application.user.email,
          studentName: application.user.name,
          projectTitle: project.title,
          companyName: project.company.companyName || project.company.name
        })
      })

      if (response.ok) {
        setEmailsSent(prev => ({ ...prev, [application.id]: true }))
        alert(`Interview invitation sent to ${application.user.name}!`)
      } else {
        throw new Error('Failed to send email')
      }
    } catch (error) {
      console.error('Error sending interview email:', error)
      alert('Failed to send interview email. Please try again.')
    }
  }

  const triggerAIShortlisting = async () => {
    try {
      setIsAIShortlisting(true)
      const response = await fetch(`/api/projects/${project.id}/shortlist-unified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchType: 'unified',
          maxResults: 10
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh applications to get updated scores and status
        window.location.reload()
      } else {
        throw new Error('AI shortlisting failed')
      }
    } catch (error) {
      console.error('Error with AI shortlisting:', error)
      alert('AI shortlisting failed. Please try again.')
    } finally {
      setIsAIShortlisting(false)
    }
  }

  const bulkUpdateStatus = async (applicationIds: string[], newStatus: string) => {
    try {
      setIsUpdating(true)
      const response = await fetch('/api/admin/applications/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds,
          status: newStatus
        })
      })

      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            applicationIds.includes(app.id) ? { ...app, status: newStatus as any } : app
          )
        )
        setSelectedApplications([])
      } else {
        throw new Error('Bulk update failed')
      }
    } catch (error) {
      console.error('Error with bulk update:', error)
      alert('Bulk update failed. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'SHORTLISTED': return 'bg-green-100 text-green-800 border-green-200'
      case 'INTERVIEWED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'HIRED': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600">{project.company.companyName || project.company.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              <Crown className="h-4 w-4 mr-1" />
              Admin View
            </span>
            <span className="text-lg font-semibold text-gray-900">
              {applications.length} Applications
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEWED">Interviewed</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {selectedApplications.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedApplications.length} selected
                </span>
                <button
                  onClick={() => bulkUpdateStatus(selectedApplications, 'SHORTLISTED')}
                  disabled={isUpdating}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => bulkUpdateStatus(selectedApplications, 'REJECTED')}
                  disabled={isUpdating}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  Reject
                </button>
              </div>
            )}
            
            <button
              onClick={triggerAIShortlisting}
              disabled={isAIShortlisting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Zap className="h-4 w-4" />
              {isAIShortlisting ? 'Processing...' : 'AI Shortlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="p-6">
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application.id)}
                      onChange={() => toggleApplicationSelection(application.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.user.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(application.status)}`}>
                          {application.status.replace('_', ' ')}
                        </span>
                        {application.compatibilityScore && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {Math.round(application.compatibilityScore)}% match
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {application.user.email}
                          </p>
                          {application.user.university && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {application.user.university} - {application.user.major}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">
                            Applied: {new Date(application.createdAt).toLocaleDateString()}
                          </p>
                          {application.user.linkedin && (
                            <a 
                              href={application.user.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Linkedin className="h-4 w-4" />
                              LinkedIn Profile
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Application Details */}
                      <div className="space-y-3">
                        {application.whyInterested && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-1">Why Interested:</h4>
                            <p className="text-sm text-gray-700">{application.whyInterested}</p>
                          </div>
                        )}
                        
                        {application.proposedApproach && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-1">Proposed Approach:</h4>
                            <p className="text-sm text-gray-700">{application.proposedApproach}</p>
                          </div>
                        )}
                        
                        {application.relevantExperience && (
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-1">Relevant Experience:</h4>
                            <p className="text-sm text-gray-700">{application.relevantExperience}</p>
                          </div>
                        )}
                        
                        {application.coverLetter && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-1">Cover Letter:</h4>
                            <p className="text-sm text-gray-700">{application.coverLetter}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Change Dropdown */}
                    <select
                      value={application.status}
                      onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                      disabled={isUpdating}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="INTERVIEWED">Interviewed</option>
                      <option value="HIRED">Hired</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Interview Email Button */}
                    {(application.status === 'SHORTLISTED' || application.status === 'INTERVIEWED') && (
                      <button
                        onClick={() => sendInterviewEmail(application)}
                        disabled={emailsSent[application.id]}
                        className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                          emailsSent[application.id] 
                            ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Mail className="h-4 w-4" />
                        {emailsSent[application.id] ? 'Email Sent' : 'Send Interview'}
                      </button>
                    )}

                    {/* Contact Actions */}
                    <button
                      onClick={() => window.open(`mailto:${application.user.email}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Send Email"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    
                    {application.user.whatsapp && (
                      <button
                        onClick={() => window.open(`https://wa.me/${application.user.whatsapp}`, '_blank')}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="WhatsApp"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'No applications match your filters' 
                : 'No applications yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
