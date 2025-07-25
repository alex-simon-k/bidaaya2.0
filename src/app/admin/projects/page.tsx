'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2, 
  MapPin, 
  Calendar,
  Users,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Eye
} from 'lucide-react'

interface ProjectForAdmin {
  id: string
  title: string
  description: string
  skillsRequired: string[]
  department?: string
  duration?: string
  compensation?: string
  location?: string
  remote: boolean
  status: string
  createdAt: string
  company: {
    name: string
    companyName: string
    industry: string
    companySize: string
    contactEmail: string
    calendlyLink?: string
  }
  applicationCount: number
  adminFeedback?: string
}

export default function AdminProjectsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectForAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectForAdmin | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [filter, setFilter] = useState('PENDING_APPROVAL')

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchProjects()
  }, [session, filter])

  const fetchProjects = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/projects?status=${filter}`)
      const data = await response.json()
      
      if (response.ok) {
        setProjects(data.projects || [])
        setError(null)
      } else {
        console.error('Failed to fetch projects:', data.error)
        setProjects([])
        setError(data.error || 'Failed to fetch projects')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
      setError(error instanceof Error ? error.message : 'Database connection error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectDecision = async (projectId: string, action: 'approve' | 'reject') => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          action,
          feedback: feedback.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Remove the project from the list
        setProjects(projects.filter(p => p.id !== projectId))
        setSelectedProject(null)
        setFeedback('')
        alert(`Project ${action}d successfully!`)
      } else if (response.status === 402 && data.requiresUpgrade) {
        // Payment required error
        alert(`❌ Cannot approve project: ${data.error}\n\nThe company needs to upgrade their subscription before this project can be approved.`)
      } else {
        alert(data.error || 'Failed to process project decision')
      }
    } catch (error) {
      alert('An error occurred while processing the decision')
    } finally {
      setIsProcessing(false)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Approvals</h1>
          <p className="text-gray-600">Review and approve projects submitted by companies</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'PENDING_APPROVAL', label: 'Pending Approval', icon: Clock },
                { key: 'LIVE', label: 'Approved', icon: CheckCircle },
                { key: 'REJECTED', label: 'Rejected', icon: XCircle },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="space-y-4">
                {/* Loading skeleton */}
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                ))}
                <div className="text-center py-6">
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium">Loading projects...</span>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border-2 border-red-100">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-700 mb-2">Connection Error</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => fetchProjects()}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (!projects || projects.length === 0) ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Projects Found</h3>
                <p className="text-gray-500">No projects with status "{filter}" at the moment.</p>
                <div className="mt-4 text-sm text-gray-400">
                  <p>💡 Tip: Projects pending approval will show <strong className="text-green-600">Approve</strong> and <strong className="text-red-600">Reject</strong> buttons</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(projects || []).map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md p-6 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {project.company.companyName || project.company.name}
                          </div>
                          {project.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {project.location}
                            </div>
                          )}
                          {project.duration && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {project.duration}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {project.applicationCount > 0 && (
                          <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            <Users className="h-4 w-4" />
                            {project.applicationCount}
                          </div>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'PENDING_APPROVAL'
                            ? 'bg-yellow-100 text-yellow-800'
                            : project.status === 'LIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                    {project.skillsRequired.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.skillsRequired.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {project.skillsRequired.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            +{project.skillsRequired.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => window.open(`/dashboard/projects/${project.id}`, '_blank')}
                        className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Details
                      </button>
                      
                      {project.status === 'PENDING_APPROVAL' ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProjectDecision(project.id, 'approve')
                            }}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {isProcessing ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProjectDecision(project.id, 'reject')
                            }}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            {isProcessing ? 'Processing...' : 'Reject'}
                          </button>
                          <button
                            onClick={() => setSelectedProject(project)}
                            className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Add Feedback
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="flex items-center gap-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Details & Actions */}
          <div className="lg:col-span-1">
            {selectedProject ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">{selectedProject.title}</h3>
                    <p className="text-sm text-gray-600">{selectedProject.company.companyName || selectedProject.company.name}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedProject.description}</p>
                  </div>

                  {selectedProject.skillsRequired.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.skillsRequired.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedProject.department && (
                      <div>
                        <span className="font-medium text-gray-700">Department:</span>
                        <p className="text-gray-600">{selectedProject.department}</p>
                      </div>
                    )}
                    {selectedProject.duration && (
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <p className="text-gray-600">{selectedProject.duration}</p>
                      </div>
                    )}
                    {selectedProject.compensation && (
                      <div>
                        <span className="font-medium text-gray-700">Compensation:</span>
                        <p className="text-gray-600">{selectedProject.compensation}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Remote:</span>
                      <p className="text-gray-600">{selectedProject.remote ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {selectedProject.company.calendlyLink && (
                    <div>
                      <a
                        href={selectedProject.company.calendlyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Company Interview Calendar
                      </a>
                    </div>
                  )}

                  {selectedProject.status === 'PENDING_APPROVAL' && (
                    <>
                      <div>
                        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                          Feedback (Optional)
                        </label>
                        <textarea
                          id="feedback"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Add feedback for the company..."
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => handleProjectDecision(selectedProject.id, 'approve')}
                          disabled={isProcessing}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                        
                        <button
                          onClick={() => handleProjectDecision(selectedProject.id, 'reject')}
                          disabled={isProcessing}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </>
                  )}

                  {selectedProject.adminFeedback && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Admin Feedback</span>
                      </div>
                      <p className="text-sm text-gray-600">{selectedProject.adminFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-500 text-center">Select a project to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 