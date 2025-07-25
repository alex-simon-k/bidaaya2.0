'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Building, 
  TrendingUp,
  AlertCircle,
  Eye,
  MessageSquare,
  Filter,
  Search,
  BarChart3,
  Settings
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  category?: string
  status: string
  createdAt: string
  updatedAt: string
  teamSize?: number
  durationMonths?: number
  experienceLevel?: string
  skillsRequired: string[]
  requirements: string[]
  deliverables: string[]
  company: {
    name: string
    email: string
    companyName?: string
  }
  adminFeedback?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  emailVerified: boolean
  profileCompleted: boolean
}

const STATUS_COLORS = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  LIVE: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  CLOSED: 'bg-gray-100 text-gray-800'
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('projects')
  const [filterStatus, setFilterStatus] = useState('PENDING_APPROVAL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!session?.user?.role) {
      return // Still loading
    }
    
    const userRole = session.user.role.toUpperCase()
    if (userRole !== 'ADMIN') {
      console.log('Access denied - User role:', session.user.role, 'Expected: ADMIN')
      router.push('/dashboard')
      return
    }
    
    fetchData()
  }, [session, router])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [projectsRes, usersRes] = await Promise.all([
        fetch('/api/admin/projects'),
        fetch('/api/admin/users')
      ])

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectAction = async (projectId: string, action: 'approve' | 'reject') => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/projects/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          action,
          feedback: feedbackText.trim() || null
        }),
      })

      if (response.ok) {
        await fetchData() // Refresh data
        setSelectedProject(null)
        setFeedbackText('')
        alert(`Project ${action}d successfully!`)
      } else {
        const data = await response.json().catch(() => ({}))
        if (response.status === 402 && data.requiresUpgrade) {
          alert(`❌ Cannot approve project: ${data.error}\n\nThe company needs to upgrade their subscription before this project can be approved.`)
        } else {
          alert(data.error || 'Failed to process project decision')
        }
      }
    } catch (error) {
      console.error('Error updating project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesStatus = !filterStatus || project.status === filterStatus
    const matchesSearch = !searchTerm || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.company.companyName || project.company.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const stats = {
    totalProjects: projects.length,
    pendingProjects: projects.filter(p => p.status === 'PENDING_APPROVAL').length,
    liveProjects: projects.filter(p => p.status === 'LIVE').length,
    totalUsers: users.length,
    companies: users.filter(u => u.role === 'COMPANY').length,
    students: users.filter(u => u.role === 'STUDENT').length
  }

  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {session.user?.name}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingProjects}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Live Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.liveProjects}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Companies</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.companies}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.students}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Project Management
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'projects' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="LIVE">Live</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>

                {/* Projects List */}
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProjects.map((project) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                                {project.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <span>Company: {project.company.companyName || project.company.name}</span>
                              <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                              {project.teamSize && <span>Team: {project.teamSize} students</span>}
                              {project.durationMonths && <span>Duration: {project.durationMonths} months</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                              className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                              View Project
                            </button>
                            <button
                              onClick={() => setSelectedProject(project)}
                              className="flex items-center gap-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Quick Approve
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {filteredProjects.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No projects found matching your criteria.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Platform Users</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'COMPANY' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'STUDENT' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {user.emailVerified && (
                                <span className="text-green-600 text-xs">✓ Verified</span>
                              )}
                              {user.profileCompleted && (
                                <span className="text-blue-600 text-xs">✓ Complete</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Platform Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Project Status Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Pending Approval</span>
                        <span className="font-medium">{stats.pendingProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Live Projects</span>
                        <span className="font-medium">{stats.liveProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Projects</span>
                        <span className="font-medium">{stats.totalProjects}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">User Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Students</span>
                        <span className="font-medium">{stats.students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Companies</span>
                        <span className="font-medium">{stats.companies}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Users</span>
                        <span className="font-medium">{stats.totalUsers}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Review Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Review Project</h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedProject.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>Company: {selectedProject.company.companyName || selectedProject.company.name}</span>
                    <span>Status: {selectedProject.status}</span>
                    <span>Created: {new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedProject.description}</p>
                </div>

                {selectedProject.requirements?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedProject.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProject.deliverables?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Deliverables</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedProject.deliverables.map((deliverable, index) => (
                        <li key={index}>{deliverable}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProject.skillsRequired?.length > 0 && (
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

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Admin Feedback</h4>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Provide feedback for the company (optional)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleProjectAction(selectedProject.id, 'approve')}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isSubmitting ? 'Processing...' : 'Approve Project'}
                  </button>
                  <button
                    onClick={() => handleProjectAction(selectedProject.id, 'reject')}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    {isSubmitting ? 'Processing...' : 'Reject Project'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 