'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Archive,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Users,
  Calendar,
  DollarSign,
  MapPin,
  Filter,
  Search,
  MoreHorizontal,
  ChevronDown,
  ArrowRight,
  Send,
  RotateCcw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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
  compensation?: string
  currentApplications: number
  maxApplications: number
  company: {
    id: string
    name: string
    companyName?: string
    email: string
  }
}

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-50 border-gray-200',
    icon: FileText,
    textColor: 'text-gray-700',
    badgeColor: 'bg-gray-100 text-gray-800',
    description: 'Projects saved but not submitted'
  },
  PENDING_APPROVAL: {
    label: 'Pending Review',
    color: 'bg-yellow-50 border-yellow-200',
    icon: Clock,
    textColor: 'text-yellow-700',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    description: 'Submitted and awaiting admin approval'
  },
  LIVE: {
    label: 'Live & Active',
    color: 'bg-green-50 border-green-200',
    icon: CheckCircle,
    textColor: 'text-green-700',
    badgeColor: 'bg-green-100 text-green-800',
    description: 'Approved and visible to students'
  },
  REJECTED: {
    label: 'Needs Changes',
    color: 'bg-red-50 border-red-200',
    icon: XCircle,
    textColor: 'text-red-700',
    badgeColor: 'bg-red-100 text-red-800',
    description: 'Requires modifications before approval'
  },
  CLOSED: {
    label: 'Completed',
    color: 'bg-slate-50 border-slate-200',
    icon: Archive,
    textColor: 'text-slate-700',
    badgeColor: 'bg-slate-100 text-slate-800',
    description: 'Project completed or no longer active'
  }
}

interface AdminProjectStatusBoardProps {
  onProjectClick?: (project: Project) => void
  onStatusChange?: (projectId: string, newStatus: string, feedback?: string) => void
}

export function AdminProjectStatusBoard({ onProjectClick, onStatusChange }: AdminProjectStatusBoardProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.company.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || project.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const projectsByStatus = Object.keys(STATUS_CONFIG).reduce((acc, status) => {
    acc[status] = filteredProjects.filter(p => p.status === status)
    return acc
  }, {} as Record<string, Project[]>)

  const handleStatusChange = async (project: Project, newStatus: string, feedback?: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/projects/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          action: newStatus === 'LIVE' ? 'approve' : newStatus === 'REJECTED' ? 'reject' : 'update',
          feedback: feedback || undefined,
          newStatus
        })
      })

      if (response.ok) {
        await fetchProjects()
        setSelectedProject(null)
        if (onStatusChange) {
          onStatusChange(project.id, newStatus, feedback)
        }
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating project status:', error)
      alert('Failed to update project status')
    } finally {
      setIsProcessing(false)
    }
  }



  const StatusColumn = ({ status, projects }: { status: string, projects: Project[] }) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    const Icon = config.icon

    return (
      <div className={`${config.color} rounded-lg border-2 border-dashed p-4 min-h-[500px]`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.textColor}`} />
            <h3 className={`font-semibold ${config.textColor}`}>
              {config.label}
            </h3>
            <span className={`text-sm px-2 py-1 rounded-full ${config.badgeColor}`}>
              {projects.length}
            </span>
          </div>
        </div>
        
        <p className={`text-sm ${config.textColor} mb-4 opacity-75`}>
          {config.description}
        </p>

        <div className="space-y-3">
          <AnimatePresence>
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {project.company.companyName || project.company.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {project.category && (
                    <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {project.category}
                    </span>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {project.teamSize && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project.teamSize}
                      </div>
                    )}
                    {project.durationMonths && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {project.durationMonths}m
                      </div>
                    )}
                    {project.compensation && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {project.compensation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {status === 'DRAFT' && (
                    <button
                      onClick={() => handleStatusChange(project, 'PENDING_APPROVAL')}
                      className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                    >
                      → Review
                    </button>
                  )}
                  {status === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(project, 'LIVE')}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => {
                          const feedback = prompt('Provide feedback for rejection:')
                          if (feedback) handleStatusChange(project, 'REJECTED', feedback)
                        }}
                        className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                  {status === 'LIVE' && (
                    <button
                      onClick={() => handleStatusChange(project, 'CLOSED')}
                      className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200"
                    >
                      → Close
                    </button>
                  )}
                  {status === 'REJECTED' && (
                    <button
                      onClick={() => handleStatusChange(project, 'PENDING_APPROVAL')}
                      className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                    >
                      → Review Again
                    </button>
                  )}
                  {status === 'CLOSED' && (
                    <button
                      onClick={() => handleStatusChange(project, 'LIVE')}
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                    >
                      → Reopen
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
                  {project.status === 'LIVE' && (
                    <span className="text-green-600 font-medium">
                      {project.currentApplications}/{project.maxApplications} applications
                    </span>
                  )}
                </div>

                {/* View/Edit Button */}
                <button
                  onClick={() => {
                    setSelectedProject(project)
                    if (onProjectClick) onProjectClick(project)
                  }}
                  className="w-full mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                >
                  View Details
                </button>
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects or companies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          <option value="MARKETING">Marketing</option>
          <option value="BUSINESS_DEVELOPMENT">Business Development</option>
          <option value="COMPUTER_SCIENCE">Computer Science</option>
          <option value="FINANCE">Finance</option>
          <option value="PSYCHOLOGY">Psychology</option>
        </select>
      </div>

      {/* Status Board */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <StatusColumn
              key={status}
              status={status}
              projects={projectsByStatus[status] || []}
            />
          ))}
        </div>
      )}

      {/* Simple Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedProject.title}
                </h2>
                <p className="text-gray-600">
                  {selectedProject.company.companyName || selectedProject.company.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedProject.status].badgeColor}`}>
                  {STATUS_CONFIG[selectedProject.status].label}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {selectedProject.description}
                </p>
              </div>

              {selectedProject.adminFeedback && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Admin Feedback</h3>
                  <p className="text-gray-700 text-sm bg-yellow-50 p-3 rounded">
                    {selectedProject.adminFeedback}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Team Size:</strong> {selectedProject.teamSize || 'Not specified'}
                </div>
                <div>
                  <strong>Duration:</strong> {selectedProject.durationMonths || 'Not specified'} months
                </div>
                <div>
                  <strong>Experience:</strong> {selectedProject.experienceLevel || 'Not specified'}
                </div>
                <div>
                  <strong>Category:</strong> {selectedProject.category || 'Not specified'}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => window.open(`/dashboard/projects/${selectedProject.id}`, '_blank')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Open Project Page
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
