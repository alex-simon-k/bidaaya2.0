'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Users,
  Building,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  MessageSquare,
  Filter,
  Search,
  ArrowRight,
  Star,
  Award,
  AlertCircle,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface Application {
  id: string
  status: 'PENDING' | 'SHORTLISTED' | 'INTERVIEWED' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
  coverLetter?: string
  motivation?: string
  additionalDocument?: string
  compatibilityScore?: number
  adminNotes?: string
  feedback?: string
  interviewScheduled?: boolean
  interviewDate?: string
  emailSent?: boolean
  user: {
    id: string
    name: string
    email: string
    university?: string
    major?: string
    whatsapp?: string
    linkedin?: string
  }
}

interface Project {
  id: string
  title: string
  status: string
  currentApplications: number
  createdAt: string
  company: {
    name: string
    companyName?: string
  }
  applications: Application[]
}

interface ProjectGroup {
  project: Project
  applications: Application[]
  isExpanded: boolean
}

export default function AdminApplicationsPage() {
  const { data: session } = useSession()
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/applications')
      if (response.ok) {
        const data = await response.json()
        // Group applications by project
        const grouped = data.projects.map((project: Project) => ({
          project,
          applications: project.applications || [],
          isExpanded: false
        }))
        setProjectGroups(grouped)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminNotes: notes })
      })

      if (response.ok) {
        // Update local state
        setProjectGroups(prev => prev.map(group => ({
          ...group,
          applications: group.applications.map(app =>
            app.id === applicationId
              ? { ...app, status: newStatus as any, adminNotes: notes }
              : app
          )
        })))
      }
    } catch (error) {
      console.error('Error updating application:', error)
    }
  }

  const scheduleInterview = async (applicationId: string, date: string) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewDate: date })
      })

      if (response.ok) {
        fetchApplications() // Refresh data
      }
    } catch (error) {
      console.error('Error scheduling interview:', error)
    }
  }

  const toggleProjectExpanded = (projectId: string) => {
    setProjectGroups(prev => prev.map(group =>
      group.project.id === projectId
        ? { ...group, isExpanded: !group.isExpanded }
        : group
    ))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'SHORTLISTED': return <Star className="h-4 w-4 text-blue-500" />
      case 'INTERVIEWED': return <MessageSquare className="h-4 w-4 text-purple-500" />
      case 'ACCEPTED': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'SHORTLISTED': return 'bg-blue-100 text-blue-800'
      case 'INTERVIEWED': return 'bg-purple-100 text-purple-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Filter applications
  const filteredGroups = projectGroups.filter(group => {
    const matchesSearch = !searchTerm ||
      group.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.project.company.companyName || group.project.company.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.applications.some(app =>
        app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )

    const hasMatchingStatus = statusFilter === 'all' ||
      group.applications.some(app => app.status === statusFilter)

    return matchesSearch && hasMatchingStatus
  })

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Management</h1>
          <p className="text-gray-600">Review and manage all project applications</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects, companies, or applicants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEWED">Interviewed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications by Project */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading applications...</span>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'No applications have been submitted yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <motion.div
                key={group.project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border overflow-hidden"
              >
                {/* Project Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleProjectExpanded(group.project.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {group.isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{group.project.title}</h3>
                        <p className="text-gray-600">
                          {group.project.company.companyName || group.project.company.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{group.applications.length}</div>
                        <div className="text-xs text-gray-500">Applications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {group.applications.filter(app => app.status === 'SHORTLISTED').length}
                        </div>
                        <div className="text-xs text-gray-500">Shortlisted</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Applications List */}
                {group.isExpanded && (
                  <div className="border-t">
                    {group.applications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        No applications for this project yet
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {group.applications
                          .filter(app => statusFilter === 'all' || app.status === statusFilter)
                          .map((application) => (
                            <div key={application.id} className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                    {application.user.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{application.user.name}</h4>
                                    <p className="text-sm text-gray-600">{application.user.email}</p>
                                    {application.user.university && (
                                      <p className="text-xs text-gray-500">
                                        {application.user.university} • {application.user.major}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  {application.compatibilityScore && (
                                    <div className="text-center">
                                      <div className={`text-lg font-bold ${getScoreColor(application.compatibilityScore)}`}>
                                        {application.compatibilityScore}%
                                      </div>
                                      <div className="text-xs text-gray-500">Match</div>
                                    </div>
                                  )}

                                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                    <div className="flex items-center gap-1">
                                      {getStatusIcon(application.status)}
                                      {application.status}
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedApplication(application)
                                        setShowDetailsModal(true)
                                      }}
                                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>

                                    {application.status === 'PENDING' && (
                                      <button
                                        onClick={() => updateApplicationStatus(application.id, 'SHORTLISTED')}
                                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                      >
                                        Shortlist
                                      </button>
                                    )}

                                    {application.status === 'SHORTLISTED' && (
                                      <button
                                        onClick={() => updateApplicationStatus(application.id, 'INTERVIEWED')}
                                        className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                      >
                                        Interview
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {application.adminNotes && (
                                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                                  <p className="text-sm text-yellow-800">
                                    <strong>Admin Notes:</strong> {application.adminNotes}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Application Details Modal */}
        {showDetailsModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Application Details</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Applicant Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Applicant Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {selectedApplication.user.name}</p>
                      <p><strong>Email:</strong> {selectedApplication.user.email}</p>
                      {selectedApplication.user.university && (
                        <p><strong>University:</strong> {selectedApplication.user.university}</p>
                      )}
                      {selectedApplication.user.major && (
                        <p><strong>Major:</strong> {selectedApplication.user.major}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Application Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedApplication.status)}`}>
                          {selectedApplication.status}
                        </span>
                      </p>
                      <p><strong>Applied:</strong> {new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                      {selectedApplication.compatibilityScore && (
                        <p><strong>AI Match Score:</strong> 
                          <span className={`ml-2 font-semibold ${getScoreColor(selectedApplication.compatibilityScore)}`}>
                            {selectedApplication.compatibilityScore}%
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Cover Letter</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedApplication.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Status Management</h4>
                  <div className="flex gap-2">
                    {['SHORTLISTED', 'INTERVIEWED', 'ACCEPTED', 'REJECTED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, status)
                          setShowDetailsModal(false)
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedApplication.status === status
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 