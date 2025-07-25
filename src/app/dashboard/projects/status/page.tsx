'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Send, 
  AlertCircle,
  MessageSquare,
  Calendar,
  Users,
  TrendingUp,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'LIVE' | 'REJECTED' | 'CLOSED'
  createdAt: string
  updatedAt: string
  adminFeedback?: string
  approvedAt?: string
  approvedBy?: string
  category?: string
  teamSize?: number
  durationMonths?: number
  experienceLevel?: string
  requirements: string[]
  deliverables: string[]
  skillsRequired: string[]
  currentApplications: number
  maxApplications: number
}

const STATUS_CONFIG = {
  DRAFT: { 
    label: 'Draft', 
    color: 'gray', 
    icon: FileText,
    description: 'Project saved but not submitted for review'
  },
  PENDING_APPROVAL: { 
    label: 'Pending Review', 
    color: 'yellow', 
    icon: Clock,
    description: 'Under admin review - approval pending'
  },
  LIVE: { 
    label: 'Live & Active', 
    color: 'green', 
    icon: CheckCircle,
    description: 'Approved and visible to students'
  },
  REJECTED: { 
    label: 'Needs Changes', 
    color: 'red', 
    icon: XCircle,
    description: 'Requires modifications before resubmission'
  },
  CLOSED: { 
    label: 'Completed', 
    color: 'gray', 
    icon: CheckCircle,
    description: 'Project successfully completed'
  }
}

export default function ProjectStatusPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    if (session?.user?.role !== 'COMPANY') {
      router.push('/dashboard')
      return
    }
    
    fetchProjects()
  }, [session, router])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects?companyId=${session?.user?.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch company projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResubmit = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        await fetchProjects() // Refresh the list
        setSelectedProject(null)
      }
    } catch (error) {
      console.error('Failed to resubmit project:', error)
    }
  }

  const filteredProjects = projects.filter(project => {
    if (!filterStatus) return true
    return project.status === filterStatus
  })

  const stats = {
    total: projects.length,
    draft: projects.filter(p => p.status === 'DRAFT').length,
    pending: projects.filter(p => p.status === 'PENDING_APPROVAL').length,
    live: projects.filter(p => p.status === 'LIVE').length,
    rejected: projects.filter(p => p.status === 'REJECTED').length,
    totalApplications: projects.reduce((sum, p) => sum + p.currentApplications, 0)
  }

  if (!session || session.user?.role !== 'COMPANY') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need a company account to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Project Status</h1>
            <button
              onClick={fetchProjects}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
          <p className="text-gray-600">Track your project submissions and approval status</p>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-4 sm:p-6"
          >
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-4 sm:p-6"
          >
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-xl sm:text-2xl font-semibold text-yellow-600">{stats.pending}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-4 sm:p-6"
          >
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Live Projects</p>
              <p className="text-xl sm:text-2xl font-semibold text-green-600">{stats.live}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-4 sm:p-6 col-span-2 sm:col-span-1"
          >
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Need Changes</p>
              <p className="text-xl sm:text-2xl font-semibold text-red-600">{stats.rejected}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-4 sm:p-6 col-span-2 sm:col-span-2 lg:col-span-1"
          >
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-xl sm:text-2xl font-semibold text-blue-600">{stats.totalApplications}</p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <button
              onClick={() => router.push('/dashboard/projects/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              New Project
            </button>
          </div>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600 mb-6">
              {filterStatus ? 'No projects match your filter criteria.' : "You haven't created any projects yet."}
            </p>
            <button
              onClick={() => router.push('/dashboard/projects/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const statusConfig = STATUS_CONFIG[project.status]
              const StatusIcon = statusConfig.icon

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                          <div className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            statusConfig.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            statusConfig.color === 'green' ? 'bg-green-100 text-green-800' :
                            statusConfig.color === 'red' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                          <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                          {project.teamSize && <span>Team: {project.teamSize} students</span>}
                          {project.durationMonths && <span>Duration: {project.durationMonths} months</span>}
                        </div>

                        {project.status === 'LIVE' && (
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600 font-medium">
                              {project.currentApplications} applications received
                            </span>
                            <span className="text-gray-500">
                              Max: {project.maxApplications}
                            </span>
                          </div>
                        )}

                        {project.adminFeedback && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-blue-800 mb-1">Admin Feedback</p>
                                <p className="text-sm text-blue-700">{project.adminFeedback}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        
                        {(project.status === 'DRAFT' || project.status === 'REJECTED') && (
                          <button
                            onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
                            className="flex items-center gap-1 px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm"
                          >
                            <Edit3 className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        )}

                        {project.status === 'REJECTED' && (
                          <button
                            onClick={() => handleResubmit(project.id)}
                            className="flex items-center gap-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                          >
                            <Send className="h-4 w-4" />
                            <span className="hidden sm:inline">Resubmit</span>
                          </button>
                        )}

                        {project.status === 'LIVE' && (
                          <button
                            onClick={() => router.push(`/dashboard/projects/${project.id}/applications`)}
                            className="flex items-center gap-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm"
                          >
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Applications</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Project Details</h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedProject.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      STATUS_CONFIG[selectedProject.status].color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      STATUS_CONFIG[selectedProject.status].color === 'green' ? 'bg-green-100 text-green-800' :
                      STATUS_CONFIG[selectedProject.status].color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {STATUS_CONFIG[selectedProject.status].label}
                    </span>
                  </div>
                  <p className="text-gray-700">{selectedProject.description}</p>
                </div>

                {selectedProject.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedProject.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProject.deliverables.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Deliverables</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedProject.deliverables.map((deliverable, index) => (
                        <li key={index}>{deliverable}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProject.skillsRequired.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Skills Required</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.skillsRequired.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProject.adminFeedback && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Admin Feedback</h4>
                    <p className="text-blue-800">{selectedProject.adminFeedback}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 