'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Crown, 
  ExternalLink, 
  Star, 
  Building, 
  MapPin, 
  DollarSign,
  Search as MagnifyingGlassIcon,
  Filter as FunnelIcon,
  ChevronDown as ChevronDownIcon,
  AlertTriangle as ExclamationTriangleIcon,
  CheckCircle as CheckCircleIcon,
  X as XMarkIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Briefcase as BriefcaseIcon,
  Plus as PlusIcon,
  Star as StarIcon,
  Eye,
  Users,
  Filter,
  FileText as DocumentTextIcon,
  MessageSquare as ChatBubbleLeftRightIcon,
  GraduationCap as AcademicCapIcon,
  TrendingUp as TrendingUpIcon,
  Mail as EnvelopeIcon,
  Phone as PhoneIcon,
  Link as LinkIcon,
  CalendarDays as CalendarDaysIcon,
  Cpu as CpuChipIcon,
  Sparkles as SparklesIcon,
  List as ListBulletIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  BarChart3 as ChartBarIcon
} from 'lucide-react'
import React from 'react'

interface Application {
  id: string
  status: string
  createdAt: string
  coverLetter?: string
  additionalDocument?: string
  applicationData?: {
    personalStatement?: string
    whyInterested?: string
    relevantExperience?: string
    projectUnderstanding?: string
    proposedApproach?: string
    deliverableTimeline?: string
    weeklyAvailability?: string
    startDate?: string
    commitmentLevel?: string
    coverLetter?: string
    additionalNotes?: string
    uploadedFiles?: Record<string, string>
    applicationVersion?: string
  }
  compatibilityScore?: number
  aiAnalysis?: {
    strengths: string[]
    concerns: string[]
    recommendation: string
    score: number
  }
  project: {
    id: string
    title: string
    category?: string
    company: {
      name: string
    }
  }
  user: {
    id: string
    name: string
    email: string
    university?: string
    major?: string
    skills?: string[]
    bio?: string
    linkedin?: string
  }
}

// Interview Invite Modal Component
function InterviewInviteModal({ 
  selectedApplications, 
  applications, 
  onSend, 
  onClose, 
  loading 
}: {
  selectedApplications: string[]
  applications: Application[]
  onSend: (applicationIds: string[], data: any) => Promise<void>
  onClose: () => void
  loading: boolean
}) {
  const [message, setMessage] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewType, setInterviewType] = useState('video')
  const [meetingLink, setMeetingLink] = useState('')

  const selectedApps = applications.filter(app => selectedApplications.includes(app.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSend(selectedApplications, {
      message,
      interviewDate: interviewDate || null,
      interviewType,
      meetingLink: meetingLink || null
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Send Interview Invitations
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Selected Candidates ({selectedApplications.length})
            </h3>
            <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
              {selectedApps.map(app => (
                <div key={app.id} className="text-sm text-gray-700 mb-1">
                  {app.user.name} - {app.project.title}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Type
            </label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
              <option value="in-person">In-Person</option>
            </select>
          </div>

          {interviewType === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link (Optional)
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message for the candidates..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              Send Invitations
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EnhancedApplicationsPage() {
  const { data: session } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Company-specific state
  const [applicationsMeta, setApplicationsMeta] = useState<any>(null)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showApplicationDetail, setShowApplicationDetail] = useState(false)
  
  // Bulk operations state
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  
  // Enhanced filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (session?.user?.role === 'COMPANY') {
      fetchCompanyApplications()
    }
  }, [session])

  const fetchCompanyApplications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        
        if (data.applications) {
          // Company API returns structured data with meta
          setApplications(data.applications)
          setApplicationsMeta(data.meta)
        } else {
          // Legacy response format
          setApplications(data)
        }
      }
    } catch (error) {
      console.error('Error fetching company applications:', error)
      setError('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update application status')
      }

      const updatedApplication = await response.json()
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? updatedApplication : app
        )
      )
      
      // Refresh data after status update
      fetchCompanyApplications()
    } catch (error) {
      setError('Failed to update application status')
    }
  }

  const handleBulkAction = async (applicationIds: string[], action: string, feedback?: string) => {
    try {
      setBulkActionLoading(true)
      const response = await fetch('/api/applications/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationIds, action, feedback }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Bulk action success:', result.message)
        setSelectedApplications([])
        fetchCompanyApplications()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to perform bulk action')
      }
    } catch (error) {
      setError('Failed to perform bulk action')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleSendInterviewInvites = async (applicationIds: string[], interviewData: any) => {
    try {
      setBulkActionLoading(true)
      const response = await fetch('/api/applications/interview-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          applicationIds, 
          ...interviewData 
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Interview invites sent:', result.message)
        setSelectedApplications([])
        setShowInterviewModal(false)
        fetchCompanyApplications()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to send interview invites')
      }
    } catch (error) {
      setError('Failed to send interview invites')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    )
  }

  const selectAllApplications = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id))
    }
  }

  const shortlistTopCandidates = async (count: number = 10) => {
    const topApplications = filteredApplications
      .filter(app => app.status === 'PENDING')
      .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
      .slice(0, count)
      .map(app => app.id)
    
    if (topApplications.length > 0) {
      await handleBulkAction(topApplications, 'SHORTLISTED')
    }
  }

  // Filter applications based on search and filters
  const filteredApplications = applications.filter(application => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        application.user.name?.toLowerCase().includes(searchLower) ||
        application.user.email?.toLowerCase().includes(searchLower) ||
        application.project.title?.toLowerCase().includes(searchLower) ||
        application.user.university?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== 'all' && application.status !== statusFilter) {
      return false
    }

    // Project filter
    if (projectFilter !== 'all' && application.project.id !== projectFilter) {
      return false
    }

    return true
  })

  const getUniqueProjects = () => {
    const projectMap = new Map()
    applications.forEach(app => {
      if (!projectMap.has(app.project.id)) {
        projectMap.set(app.project.id, app.project)
      }
    })
    return Array.from(projectMap.values())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'SHORTLISTED':
        return 'bg-blue-100 text-blue-800'
      case 'INTERVIEWED':
        return 'bg-purple-100 text-purple-800'
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending'
      case 'SHORTLISTED':
        return 'Shortlisted'
      case 'INTERVIEWED':
        return 'Interviewed'
      case 'ACCEPTED':
        return 'Accepted'
      case 'REJECTED':
        return 'Rejected'
      default:
        return status
    }
  }

  if (session?.user?.role !== 'COMPANY') {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-gray-500">This page is only available for companies.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Company Applications</h1>
        <div className="mt-3 sm:mt-0 flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Application Stats */}
      {!isLoading && applications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BriefcaseIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Applications
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(app => app.status === 'PENDING').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-8 w-8 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Shortlisted
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(app => app.status === 'SHORTLISTED').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-8 w-8 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Interviewed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(app => app.status === 'INTERVIEWED').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Accepted
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(app => app.status === 'ACCEPTED').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEWED">Interviewed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Projects</option>
                {getUniqueProjects().map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Applications Display */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Applications will appear here once students apply to your projects.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedApplications.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedApplications.length} application(s) selected
                    </span>
                    <button
                      onClick={() => setSelectedApplications([])}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear selection
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkAction(selectedApplications, 'SHORTLISTED')}
                      disabled={bulkActionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      Shortlist Selected
                    </button>
                    <button
                      onClick={() => setShowInterviewModal(true)}
                      disabled={bulkActionLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      Send Interview Invites
                    </button>
                    <button
                      onClick={() => handleBulkAction(selectedApplications, 'REJECTED')}
                      disabled={bulkActionLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                    >
                      Reject Selected
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {filteredApplications.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => shortlistTopCandidates(10)}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                  >
                    Shortlist Top 10
                  </button>
                  <button
                    onClick={() => shortlistTopCandidates(5)}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                  >
                    Shortlist Top 5
                  </button>
                  <button
                    onClick={selectAllApplications}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                  >
                    {selectedApplications.length === filteredApplications.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
            )}

            {/* Applications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApplications.map((application) => (
                <div 
                  key={application.id} 
                  className={`bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
                    selectedApplications.includes(application.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(application.id)}
                          onChange={() => toggleApplicationSelection(application.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {application.user.name?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {application.user.name || 'Anonymous'}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {application.user.university || application.user.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}
                      >
                        {formatStatus(application.status)}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        {application.project.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Applied {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {application.compatibilityScore && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Compatibility Score</span>
                          <span className="font-medium">{Math.round(application.compatibilityScore)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${application.compatibilityScore}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedApplication(application)
                            setShowApplicationDetail(true)
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                        {application.status === 'SHORTLISTED' && (
                          <button
                            onClick={() => {
                              setSelectedApplications([application.id])
                              setShowInterviewModal(true)
                            }}
                            className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                          >
                            <CalendarIcon className="h-3 w-3" />
                            Interview
                          </button>
                        )}
                      </div>
                      <select
                        value={application.status}
                        onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="SHORTLISTED">Shortlist</option>
                        <option value="INTERVIEWED">Interview</option>
                        <option value="ACCEPTED">Accept</option>
                        <option value="REJECTED">Reject</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Application Detail Modal */}
        {showApplicationDetail && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedApplication.user.name}'s Application
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedApplication.project.title}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedApplication.status}
                    onChange={(e) => handleStatusUpdate(selectedApplication.id, e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="INTERVIEWED">Interviewed</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <button
                    onClick={() => {
                      setShowApplicationDetail(false)
                      setSelectedApplication(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Applicant Information</h3>
                      <p className="text-sm text-gray-600">Name: {selectedApplication.user.name}</p>
                      <p className="text-sm text-gray-600">Email: {selectedApplication.user.email}</p>
                      {selectedApplication.user.university && (
                        <p className="text-sm text-gray-600">University: {selectedApplication.user.university}</p>
                      )}
                      {selectedApplication.user.major && (
                        <p className="text-sm text-gray-600">Major: {selectedApplication.user.major}</p>
                      )}
                      {selectedApplication.user.linkedin && (
                        <p className="text-sm text-gray-600">
                          LinkedIn: <a href={selectedApplication.user.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedApplication.user.linkedin}</a>
                        </p>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Application Details</h3>
                      <p className="text-sm text-gray-600">Applied: {new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Status: {formatStatus(selectedApplication.status)}</p>
                      {selectedApplication.compatibilityScore && (
                        <p className="text-sm text-gray-600">Compatibility: {Math.round(selectedApplication.compatibilityScore)}%</p>
                      )}
                    </div>
                  </div>
                  
                  {selectedApplication.applicationData?.personalStatement && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Personal Statement</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedApplication.applicationData.personalStatement}</p>
                    </div>
                  )}
                  
                  {selectedApplication.coverLetter && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Cover Letter</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                    </div>
                  )}

                  {selectedApplication.applicationData?.whyInterested && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Why Interested</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedApplication.applicationData.whyInterested}</p>
                    </div>
                  )}

                  {selectedApplication.applicationData?.relevantExperience && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Relevant Experience</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedApplication.applicationData.relevantExperience}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview Invitation Modal */}
        {showInterviewModal && (
          <InterviewInviteModal
            selectedApplications={selectedApplications}
            applications={applications}
            onSend={handleSendInterviewInvites}
            onClose={() => {
              setShowInterviewModal(false)
              setSelectedApplications([])
            }}
            loading={bulkActionLoading}
          />
        )}
      </div>
    </div>
  )
}
