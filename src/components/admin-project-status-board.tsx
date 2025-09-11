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
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'close' | null>(null)
  const [feedback, setFeedback] = useState('')
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
        setActionType(null)
        setFeedback('')
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

  const getStatusActions = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return [
          { label: 'Move to Review', action: 'PENDING_APPROVAL', icon: ArrowRight, color: 'yellow' }
        ]
      case 'PENDING_APPROVAL':
        return [
          { label: 'Approve', action: 'LIVE', icon: CheckCircle, color: 'green' },
          { label: 'Request Changes', action: 'REJECTED', icon: XCircle, color: 'red' }
        ]
      case 'LIVE':
        return [
          { label: 'Close Project', action: 'CLOSED', icon: Archive, color: 'slate' }
        ]
      case 'REJECTED':
        return [
          { label: 'Move to Review', action: 'PENDING_APPROVAL', icon: RotateCcw, color: 'yellow' }
        ]
      case 'CLOSED':
        return [
          { label: 'Reopen', action: 'LIVE', icon: RotateCcw, color: 'green' }
        ]
      default:
        return []
    }
  }

  const ProjectCard = ({ project }: { project: Project }) => {
    const statusConfig = STATUS_CONFIG[project.status]
    const Icon = statusConfig.icon

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => {
          setSelectedProject(project)
          if (onProjectClick) onProjectClick(project)
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
              {project.title}
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              {project.company.companyName || project.company.name}
            </p>
          </div>
          <div className="ml-2">
            <Icon className={`h-4 w-4 ${statusConfig.textColor}`} />
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

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
          {project.status === 'LIVE' && (
            <span className="text-green-600 font-medium">
              {project.currentApplications}/{project.maxApplications} applications
            </span>
          )}
        </div>
      </motion.div>
    )
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
              <ProjectCard key={project.id} project={project} />
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

      {/* Project Action Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
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
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
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
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {getStatusActions(selectedProject.status).map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.action}
                    onClick={() => {
                      if (action.action === 'REJECTED') {
                        setActionType('reject')
                      } else if (action.action === 'CLOSED') {
                        setActionType('close')
                      } else if (action.action === 'LIVE') {
                        handleStatusChange(selectedProject, action.action)
                      } else {
                        handleStatusChange(selectedProject, action.action)
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      action.color === 'green' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                      action.color === 'red' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                      action.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                      'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </button>
                )
              })}
            </div>

            {/* Feedback Input for Rejection */}
            {actionType === 'reject' && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-2">Provide Feedback</h3>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Explain what needs to be changed..."
                  rows={3}
                  className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleStatusChange(selectedProject, 'REJECTED', feedback)}
                    disabled={isProcessing || !feedback.trim()}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Send Feedback'}
                  </button>
                  <button
                    onClick={() => setActionType(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
