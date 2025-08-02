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
import EnhancedAdminProjectManagement from '@/components/enhanced-admin-project-management'
import OnboardingAnalyticsDashboard from '@/components/onboarding-analytics-dashboard'
import ApplicationSessionDashboard from '@/components/application-session-dashboard'

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
  
  // Add states for new admin tools
  const [isGeneratingProjects, setIsGeneratingProjects] = useState(false)
  const [isSlackEnabled, setIsSlackEnabled] = useState(false)
  const [showTools, setShowTools] = useState(false)

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
        // Handle both object and array responses
        setProjects(Array.isArray(projectsData) ? projectsData : projectsData.projects || [])
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        // Handle both object and array responses
        setUsers(Array.isArray(usersData) ? usersData : usersData.users || [])
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

  // Add admin tools functions
  const handleGenerateFakeProjects = async () => {
    if (!confirm('This will create 15 fake projects with companies. Continue?')) return
    
    setIsGeneratingProjects(true)
    try {
      const response = await fetch('/api/admin/fake-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      })
      
      const data = await response.json()
      if (response.ok) {
        alert(`✅ ${data.message}\n${data.description}`)
        fetchData() // Refresh the dashboard
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      alert('❌ Failed to generate projects')
    } finally {
      setIsGeneratingProjects(false)
    }
  }

  const handleCleanupFakeProjects = async () => {
    if (!confirm('This will DELETE all fake projects and companies. This cannot be undone!')) return
    
    try {
      const response = await fetch('/api/admin/fake-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      })
      
      const data = await response.json()
      if (response.ok) {
        alert(`✅ ${data.message}`)
        fetchData() // Refresh the dashboard
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      alert('❌ Failed to cleanup projects')
    }
  }

  const handleSlackTest = async () => {
    try {
      const response = await fetch('/api/admin/slack-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test' })
      })
      
      const data = await response.json()
      if (response.ok) {
        alert('✅ Slack test message sent!')
      } else {
        alert(`❌ Slack Error: ${data.error}`)
      }
    } catch (error) {
      alert('❌ Failed to send Slack test')
    }
  }

  const filteredProjects = (Array.isArray(projects) ? projects : []).filter(project => {
    const matchesStatus = !filterStatus || project.status === filterStatus
    const matchesSearch = !searchTerm || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.company.companyName || project.company.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const stats = {
    totalProjects: Array.isArray(projects) ? projects.length : 0,
    pendingProjects: Array.isArray(projects) ? projects.filter(p => p.status === 'PENDING_APPROVAL').length : 0,
    liveProjects: Array.isArray(projects) ? projects.filter(p => p.status === 'LIVE').length : 0,
    totalUsers: Array.isArray(users) ? users.length : 0,
    companies: Array.isArray(users) ? users.filter(u => u.role === 'COMPANY').length : 0,
    students: Array.isArray(users) ? users.filter(u => u.role === 'STUDENT').length : 0
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

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building className="inline-block w-4 h-4 mr-2" />
                Projects ({stats.totalProjects})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="inline-block w-4 h-4 mr-2" />
                Users ({stats.totalUsers})
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tools'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="inline-block w-4 h-4 mr-2" />
                Admin Tools
              </button>
              <button
                onClick={() => setActiveTab('onboarding')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'onboarding'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="inline-block w-4 h-4 mr-2" />
                Onboarding Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Onboarding Analytics Tab Content */}
        {activeTab === 'onboarding' && (
          <OnboardingAnalyticsDashboard />
        )}

        {/* Admin Tools Tab Content */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Platform Management Tools</h3>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Fake Projects Generator */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">🎭 Fake Projects Generator</h4>
                    <p className="text-xs text-gray-600 mb-4">
                      Generate 15 realistic projects with companies for testing and demonstration
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={handleGenerateFakeProjects}
                        disabled={isGeneratingProjects}
                        className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isGeneratingProjects ? 'Generating...' : 'Generate 15 Projects'}
                      </button>
                      <button
                        onClick={handleCleanupFakeProjects}
                        className="w-full bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
                      >
                        Cleanup Fake Data
                      </button>
                    </div>
                  </div>

                  {/* Slack Integration */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">📱 Slack Integration</h4>
                    <p className="text-xs text-gray-600 mb-4">
                      Daily summaries and live signup notifications
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={handleSlackTest}
                        className="w-full bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700"
                      >
                        Test Slack Integration
                      </button>
                      <button
                        onClick={() => window.open('/api/admin/slack-summary', '_blank')}
                        className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                      >
                        Send Daily Summary
                      </button>
                    </div>
                  </div>

                  {/* Email & Calendly Tools */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">📧 Email & Calendly</h4>
                    <p className="text-xs text-gray-600 mb-4">
                      Email automation and interview scheduling
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => router.push('/admin/applications')}
                        className="w-full bg-indigo-600 text-white py-2 px-3 rounded text-sm hover:bg-indigo-700"
                      >
                        View Applications
                      </button>
                      <button
                        onClick={() => alert('Calendly integration: Check company profiles for individual Calendly links')}
                        className="w-full bg-yellow-600 text-white py-2 px-3 rounded text-sm hover:bg-yellow-700"
                      >
                        Calendly Setup Info
                      </button>
                    </div>
                  </div>

                  {/* Database Tools */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">🗄️ Database Tools</h4>
                    <p className="text-xs text-gray-600 mb-4">
                      Analytics and data management
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => window.open('/api/admin/analytics', '_blank')}
                        className="w-full bg-teal-600 text-white py-2 px-3 rounded text-sm hover:bg-teal-700"
                      >
                        View Analytics
                      </button>
                      <button
                        onClick={() => window.open('/api/admin/debug-users', '_blank')}
                        className="w-full bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700"
                      >
                        Debug Users
                      </button>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">⚡ System Status</h4>
                    <p className="text-xs text-gray-600 mb-4">
                      Current system health and statistics
                    </p>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Projects:</span>
                        <span className="font-semibold">{stats.totalProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Companies:</span>
                        <span className="font-semibold">{stats.companies}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Students:</span>
                        <span className="font-semibold">{stats.students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending:</span>
                        <span className="font-semibold text-yellow-600">{stats.pendingProjects}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">🚀 Quick Actions</h4>
                    <p className="text-xs text-gray-600 mb-4">
                      Common administrative tasks
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => fetchData()}
                        className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                      >
                        Refresh Data
                      </button>
                      <button
                        onClick={() => window.open('/dashboard/projects', '_blank')}
                        className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                      >
                        View Public Projects
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

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
              <button
                onClick={() => setActiveTab('application-sessions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'application-sessions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Application Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'projects' && (
              <EnhancedAdminProjectManagement />
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

            {activeTab === 'application-sessions' && (
              <ApplicationSessionDashboard />
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