'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building, 
  Users, 
  Eye, 
  Star, 
  Edit3, 
  TrendingUp, 
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  ArrowLeft,
  Save,
  RotateCcw,
  Zap,
  Crown,
  CheckCircle
} from 'lucide-react'

interface Application {
  id: string
  userId: string
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
  }
  whyInterested?: string
  proposedApproach?: string
  coverLetter?: string
  motivation?: string
}

interface ProjectWithApplications {
  id: string
  title: string
  description: string
  category?: string
  status: string
  createdAt: string
  teamSize?: number
  durationMonths?: number
  experienceLevel?: string
  paymentAmount?: number
  compensation?: string
  currentApplications?: number
  maxApplications?: number
  company: {
    name: string
    email: string
    companyName?: string
  }
  applications: Application[]
}

interface EnhancedAdminProjectManagementProps {
  onBack?: () => void
}

export default function EnhancedAdminProjectManagement({ onBack }: EnhancedAdminProjectManagementProps) {
  const [projects, setProjects] = useState<ProjectWithApplications[]>([])
  const [selectedProject, setSelectedProject] = useState<ProjectWithApplications | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('LIVE')
  const [sortedApplications, setSortedApplications] = useState<Application[]>([])
  const [editingScores, setEditingScores] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      // Sort applications by compatibility score (highest first), then by date
      const sorted = [...selectedProject.applications].sort((a, b) => {
        const scoreA = editingScores[a.id] ?? a.compatibilityScore ?? 0
        const scoreB = editingScores[b.id] ?? b.compatibilityScore ?? 0
        if (scoreA !== scoreB) return scoreB - scoreA
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      setSortedApplications(sorted)
    }
  }, [selectedProject, editingScores])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/projects?includeApplications=true')
      if (response.ok) {
        const data = await response.json()
        setProjects(Array.isArray(data) ? data : data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateCompatibilityScore = async (applicationId: string, newScore: number) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compatibilityScore: newScore })
      })

      if (response.ok) {
        // Update local state
        setEditingScores(prev => ({ ...prev, [applicationId]: newScore }))
        
        // Update the project's applications
        if (selectedProject) {
          const updatedApplications = selectedProject.applications.map(app => 
            app.id === applicationId ? { ...app, compatibilityScore: newScore } : app
          )
          setSelectedProject({ ...selectedProject, applications: updatedApplications })
        }
      }
    } catch (error) {
      console.error('Failed to update compatibility score:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const triggerAIShortlisting = async (projectId: string) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/projects/${projectId}/shortlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        // Refresh project data
        const updatedProject = projects.find(p => p.id === projectId)
        if (updatedProject) {
          const projectResponse = await fetch(`/api/admin/projects/${projectId}?includeApplications=true`)
          if (projectResponse.ok) {
            const projectData = await projectResponse.json()
            setSelectedProject(projectData)
            setProjects(prev => prev.map(p => p.id === projectId ? projectData : p))
          }
        }
      }
    } catch (error) {
      console.error('Failed to trigger AI shortlisting:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesStatus = !statusFilter || project.status === statusFilter
    const matchesSearch = !searchTerm || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.company.companyName || project.company.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-green-100 text-green-800'
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'SHORTLISTED': return 'bg-blue-100 text-blue-800'
      case 'INTERVIEWED': return 'bg-purple-100 text-purple-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (selectedProject) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedProject(null)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedProject.title}</h2>
              <p className="text-gray-600">{selectedProject.company.companyName || selectedProject.company.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedProject.status)}`}>
              {selectedProject.status.replace('_', ' ')}
            </span>
            <button
              onClick={() => triggerAIShortlisting(selectedProject.id)}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Zap className="h-4 w-4" />
              {isUpdating ? 'Processing...' : 'Run AI Shortlisting'}
            </button>
          </div>
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Project Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Size: {selectedProject.teamSize || 1} students
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration: {selectedProject.durationMonths || 3} months
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Experience: {selectedProject.experienceLevel || 'High School'}
                </div>
                {selectedProject.paymentAmount && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment: {selectedProject.paymentAmount} AED
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Applications</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Total: {selectedProject.applications.length}</div>
                <div>Pending: {selectedProject.applications.filter(a => a.status === 'PENDING').length}</div>
                <div>Shortlisted: {selectedProject.applications.filter(a => a.status === 'SHORTLISTED').length}</div>
                <div>Interviewed: {selectedProject.applications.filter(a => a.status === 'INTERVIEWED').length}</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600 line-clamp-4">{selectedProject.description}</p>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Applications ({sortedApplications.length})
            </h3>
            <p className="text-sm text-gray-600">Sorted by compatibility score (highest first)</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {sortedApplications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{application.user.name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getApplicationStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                                                 {index < 3 && (
                           <span title="Top candidate">
                             <Crown className="h-4 w-4 text-yellow-500" />
                           </span>
                         )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p>{application.user.email}</p>
                        {application.user.university && (
                          <p>{application.user.university} - {application.user.major}</p>
                        )}
                        {application.user.linkedin && (
                          <a 
                            href={application.user.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            LinkedIn Profile
                          </a>
                        )}
                      </div>
                      
                      <div>
                        <p>Applied: {new Date(application.createdAt).toLocaleDateString()}</p>
                        {application.whyInterested && (
                          <p className="mt-2">
                            <span className="font-medium">Why Interested:</span><br />
                            <span className="line-clamp-2">{application.whyInterested}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-6">
                    {/* Compatibility Score Editor */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Score:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingScores[application.id] ?? application.compatibilityScore ?? 0}
                          onChange={(e) => {
                            const newScore = parseInt(e.target.value) || 0
                            setEditingScores(prev => ({ ...prev, [application.id]: newScore }))
                          }}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => updateCompatibilityScore(application.id, editingScores[application.id] ?? application.compatibilityScore ?? 0)}
                          disabled={isUpdating}
                          className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-50"
                          title="Save score"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Score Bar */}
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((editingScores[application.id] ?? application.compatibilityScore ?? 0), 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {sortedApplications.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No applications yet for this project.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
        <button
          onClick={fetchProjects}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="LIVE">Live</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="DRAFT">Draft</option>
          <option value="REJECTED">Rejected</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{project.applications.length}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {project.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {project.description}
                </p>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span className="truncate">{project.company.companyName || project.company.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{project.durationMonths || 3}m</span>
                    </div>
                    {project.paymentAmount && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{project.paymentAmount} AED</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">Manage</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No projects found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  )
} 