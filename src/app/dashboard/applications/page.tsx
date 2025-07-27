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
import { ExternalApplicationModal } from '@/components/external-application-modal'

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
  }
}

interface ExternalApplication {
  id: string
  jobTitle: string
  company: string
  status: string
  appliedDate: string
  location?: string
  salary?: string
  jobUrl?: string
  notes?: string
  source?: string
  createdAt: string
}

interface Analytics {
  period: number
  bidaaya: {
    applications: number
    shortlisted: number
    interviews: number
    offers: number
    responseRate: number
  }
  total: {
    applications: number
    interviews: number
    offers: number
    responseRate: number
  }
  summary: {
    totalApplicationsThisMonth: number
    averageApplicationsPerWeek: number
    successRate: number
  }
  upgradeAvailable?: {
    message: string
    features: string[]
  }
}

type ApplicationStatus = 'PENDING' | 'SHORTLISTED' | 'INTERVIEWED' | 'ACCEPTED' | 'REJECTED'
type SortField = 'date' | 'score' | 'name' | 'status'
type SortDirection = 'asc' | 'desc'

export default function ApplicationsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'bidaaya' | 'external'>('bidaaya')
  const [applications, setApplications] = useState<Application[]>([])
  const [externalApplications, setExternalApplications] = useState<ExternalApplication[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExternalModal, setShowExternalModal] = useState(false)
  const [canAccessExternal, setCanAccessExternal] = useState(false)
  
  // Company-specific state
  const [applicationsMeta, setApplicationsMeta] = useState<any>(null)
  const [projectGroups, setProjectGroups] = useState<any[]>([])
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showApplicationDetail, setShowApplicationDetail] = useState(false)
  
  // Enhanced filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState('30')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'detailed'>('cards')

  useEffect(() => {
    if (session?.user?.role === 'COMPANY') {
      fetchCompanyApplications()
    } else {
      fetchApplications()
      fetchAnalytics()
      if (session?.user?.role === 'STUDENT') {
        checkExternalAccess()
      }
    }
  }, [periodFilter, session])

  useEffect(() => {
    if (canAccessExternal && activeTab === 'external') {
      fetchExternalApplications()
    }
  }, [activeTab, canAccessExternal])

  const checkExternalAccess = async () => {
    try {
      const response = await fetch('/api/user/limits')
      if (response.ok) {
        const data = await response.json()
        const userPlan = data.user?.subscriptionPlan || 'FREE'
        setCanAccessExternal(['STUDENT_PREMIUM', 'STUDENT_PRO'].includes(userPlan))
      }
    } catch (error) {
      console.error('Failed to check external access:', error)
    }
  }

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }
      const data = await response.json()
      setApplications(data)
    } catch (error) {
      setError('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchExternalApplications = async () => {
    try {
      const response = await fetch('/api/applications/external')
      if (response.ok) {
        const data = await response.json()
        setExternalApplications(data.applications || [])
      } else if (response.status === 403) {
        setCanAccessExternal(false)
      }
    } catch (error) {
      console.error('Failed to load external applications:', error)
    }
  }

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const response = await fetch(`/api/applications/analytics?period=${periodFilter}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

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
          
          // Group applications by project
          const grouped = data.applications.reduce((acc: any, app: any) => {
            const projectId = app.project.id
            if (!acc[projectId]) {
              acc[projectId] = {
                project: app.project,
                applications: []
              }
            }
            acc[projectId].applications.push(app)
            return acc
          }, {})
          
          setProjectGroups(Object.values(grouped))
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
      fetchAnalytics()
    } catch (error) {
      setError('Failed to update application status')
    }
  }

  const handleBulkAction = async (applicationIds: string[], action: string) => {
    try {
      const response = await fetch('/api/applications/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationIds, action }),
      })

      if (response.ok) {
        fetchCompanyApplications()
      }
    } catch (error) {
      setError('Failed to perform bulk action')
    }
  }

  const requestAIAnalysis = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/ai-analysis`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const analysis = await response.json()
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, aiAnalysis: analysis }
              : app
          )
        )
      }
    } catch (error) {
      console.error('Failed to get AI analysis:', error)
    }
  }

  const handleExternalStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/external/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update external application status')
      }

      const updatedApplication = await response.json()
      setExternalApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? updatedApplication : app
        )
      )
    } catch (error) {
      setError('Failed to update external application status')
    }
  }

  const handleExternalApplicationSuccess = () => {
    fetchExternalApplications()
    fetchAnalytics()
  }

  // Enhanced filtering and sorting
  const filteredApplications = applications.filter(application => {
    const matchesSearch = !searchTerm || 
      application.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter
    const matchesProject = projectFilter === 'all' || application.project.id === projectFilter
    
    return matchesSearch && matchesStatus && matchesProject
  }).sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortField) {
      case 'date':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'score':
        aValue = a.compatibilityScore || 0
        bValue = b.compatibilityScore || 0
        break
      case 'name':
        aValue = a.user.name.toLowerCase()
        bValue = b.user.name.toLowerCase()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      default:
        return 0
    }
    
    const direction = sortDirection === 'asc' ? 1 : -1
    return aValue < bValue ? -direction : aValue > bValue ? direction : 0
  })

  const filteredExternalApplications = externalApplications.filter(application => {
    const matchesSearch = !searchTerm || 
      application.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': 
      case 'OFFER_RECEIVED': return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'REJECTED': return <XMarkIcon className="h-5 w-5 text-red-500" />
      case 'INTERVIEWED': 
      case 'INTERVIEW_SCHEDULED':
      case 'FINAL_ROUND': return <CalendarIcon className="h-5 w-5 text-blue-500" />
      case 'SHORTLISTED':
      case 'UNDER_REVIEW':
      case 'PHONE_SCREEN': return <BriefcaseIcon className="h-5 w-5 text-yellow-500" />
      case 'WITHDRAWN': return <XMarkIcon className="h-5 w-5 text-orange-500" />
      case 'NO_RESPONSE': return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'OFFER_RECEIVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'INTERVIEWED':
      case 'INTERVIEW_SCHEDULED':
      case 'FINAL_ROUND': return 'bg-blue-100 text-blue-800'
      case 'SHORTLISTED':
      case 'UNDER_REVIEW':
      case 'PHONE_SCREEN': return 'bg-yellow-100 text-yellow-800'
      case 'WITHDRAWN': return 'bg-orange-100 text-orange-800'
      case 'NO_RESPONSE': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const getUniqueProjects = () => {
    const projects = new Map()
    applications.forEach(app => {
      if (!projects.has(app.project.id)) {
        projects.set(app.project.id, app.project)
      }
    })
    return Array.from(projects.values())
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Enhanced Company Applications View
  if (session?.user?.role === 'COMPANY') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Applications Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and review applications for your projects
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 ${viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <span className="text-sm">⊞</span>
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`p-2 ${viewMode === 'detailed' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <DocumentTextIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status Card */}
        {applicationsMeta?.upgradePrompt && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Crown className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  {applicationsMeta.upgradePrompt.message}
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Current: {applicationsMeta.upgradePrompt.currentLimit}</p>
                  <p>Upgrade to: {applicationsMeta.upgradePrompt.nextTier}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.href = '/subscription'}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Applications Statistics */}
        {applicationsMeta && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Applications
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {applicationsMeta.totalApplications}
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
                    <StarIcon className="h-8 w-8 text-yellow-400" />
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
                    <CalendarIcon className="h-8 w-8 text-blue-400" />
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
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Date</option>
                    <option value="score">Score</option>
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                  </button>
                </div>
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
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApplications.map((application) => (
                <div key={application.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
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
                        {!application.aiAnalysis && (
                          <button
                            onClick={() => requestAIAnalysis(application.id)}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                          >
                            <SparklesIcon className="h-3 w-3" />
                            AI Analysis
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
          ) : (
            // List view or detailed view would go here
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <li key={application.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {application.user.name?.charAt(0) || 'A'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {application.user.name || 'Anonymous'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {application.project.title}
                          </p>
                          {application.compatibilityScore && (
                            <p className="text-xs text-green-600">
                              {Math.round(application.compatibilityScore)}% match
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}
                        >
                          {formatStatus(application.status)}
                        </span>
                        
                        <button
                          onClick={() => {
                            setSelectedApplication(application)
                            setShowApplicationDetail(true)
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </button>
                        
                        <select
                          value={application.status}
                          onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="INTERVIEWED">Interviewed</option>
                          <option value="ACCEPTED">Accepted</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                        
                        <span className="text-xs text-gray-500">
                          {new Date(application.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Application Detail Modal - Will be implemented separately */}
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
                      <h3 className="font-medium text-gray-900">Applicant Information</h3>
                      <p className="text-sm text-gray-600">Name: {selectedApplication.user.name}</p>
                      <p className="text-sm text-gray-600">Email: {selectedApplication.user.email}</p>
                      {selectedApplication.user.university && (
                        <p className="text-sm text-gray-600">University: {selectedApplication.user.university}</p>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Application Details</h3>
                      <p className="text-sm text-gray-600">Applied: {new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Status: {formatStatus(selectedApplication.status)}</p>
                    </div>
                  </div>
                  
                  {selectedApplication.applicationData?.personalStatement && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Personal Statement</h3>
                      <p className="text-sm text-gray-600">{selectedApplication.applicationData.personalStatement}</p>
                    </div>
                  )}
                  
                  {selectedApplication.coverLetter && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Cover Letter</h3>
                      <p className="text-sm text-gray-600">{selectedApplication.coverLetter}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Application Tracker</h1>
        <div className="mt-3 sm:mt-0 flex gap-2">
          {session?.user?.role === 'STUDENT' && (
            <>
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Find Projects
              </Link>
              {canAccessExternal && (
                <button
                  onClick={() => setShowExternalModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Add External
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs for Students */}
      {session?.user?.role === 'STUDENT' && (
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('bidaaya')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'bidaaya'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="h-4 w-4" />
                  Bidaaya Applications
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {applications.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('external')}
                disabled={!canAccessExternal}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'external'
                    ? 'border-purple-500 text-purple-600'
                    : canAccessExternal 
                    ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    : 'border-transparent text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  External Applications
                  {canAccessExternal ? (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {externalApplications.length}
                    </span>
                  ) : (
                    <Star className="h-3 w-3 text-purple-500" />
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Premium Feature Prompt for External Tab */}
      {session?.user?.role === 'STUDENT' && activeTab === 'external' && !canAccessExternal && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Star className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                🚀 External Job Tracking - Premium Feature
              </h3>
              <p className="text-purple-700 mb-4">
                Track applications to jobs outside Bidaaya, manage your entire job search in one place, and get powerful analytics to improve your success rate.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-purple-700">
                  <CheckCircleIcon className="h-4 w-4 text-purple-500" />
                  Track LinkedIn, Indeed, company websites
                </div>
                <div className="flex items-center gap-2 text-purple-700">
                  <CheckCircleIcon className="h-4 w-4 text-purple-500" />
                  Application status management
                </div>
                <div className="flex items-center gap-2 text-purple-700">
                  <CheckCircleIcon className="h-4 w-4 text-purple-500" />
                  Interview scheduling & follow-ups
                </div>
                <div className="flex items-center gap-2 text-purple-700">
                  <CheckCircleIcon className="h-4 w-4 text-purple-500" />
                  Success rate analytics
                </div>
              </div>
              <Link
                href="/subscription"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Star className="h-4 w-4" />
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {session?.user?.role === 'STUDENT' && analytics && !analyticsLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Analytics ({analytics.period} days)
            </h2>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">
                    {activeTab === 'bidaaya' ? 'Bidaaya' : 'External'} Applications
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {activeTab === 'bidaaya' ? analytics.bidaaya.applications : analytics.total.applications}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingUpIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900">Response Rate</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {activeTab === 'bidaaya' ? analytics.bidaaya.responseRate : analytics.total.responseRate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Interviews</p>
                  <p className="text-2xl font-bold text-green-600">
                    {activeTab === 'bidaaya' ? analytics.bidaaya.interviews : analytics.total.interviews}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Offers</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {activeTab === 'bidaaya' ? analytics.bidaaya.offers : analytics.total.offers}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade prompt for advanced features */}
          {analytics.upgradeAvailable && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900">
                    {analytics.upgradeAvailable.message}
                  </h3>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    {analytics.upgradeAvailable.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/subscription"
                    className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Upgrade Now →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'bidaaya' ? "Search projects or companies..." : "Search companies or job titles..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {activeTab === 'bidaaya' ? (
                <>
                  <option value="PENDING">Pending</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="INTERVIEWED">Interviewed</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </>
              ) : (
                <>
                  <option value="APPLIED">Applied</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="PHONE_SCREEN">Phone Screen</option>
                  <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                  <option value="INTERVIEWED">Interviewed</option>
                  <option value="FINAL_ROUND">Final Round</option>
                  <option value="OFFER_RECEIVED">Offer Received</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                  <option value="NO_RESPONSE">No Response</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {activeTab === 'bidaaya' ? (
          // Bidaaya Applications
          filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search filters'
                  : session?.user?.role === 'STUDENT'
                  ? 'Start by applying to some projects'
                  : 'No applications have been submitted to your projects yet'
                }
              </p>
              {session?.user?.role === 'STUDENT' && !searchTerm && statusFilter === 'all' && (
                <div className="mt-6">
                  <Link
                    href="/dashboard/projects"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Find Projects
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <motion.li
                  key={application.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(application.status)}
                        <div>
                          <h2 className="text-lg font-medium text-gray-900 truncate">
                            {application.project.title}
                          </h2>
                          <p className="mt-1 text-sm text-gray-500">
                            {session?.user?.role === 'STUDENT'
                              ? `Company: ${application.project.company.name}`
                              : `Student: ${application.user.name} (${application.user.university} - ${application.user.major})`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}
                      >
                        {application.status}
                      </span>
                      {session?.user?.role === 'COMPANY' && (
                        <select
                          value={application.status}
                          onChange={(e) =>
                            handleStatusUpdate(application.id, e.target.value)
                          }
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="INTERVIEWED">Interviewed</option>
                          <option value="ACCEPTED">Accepted</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <div className="text-sm text-gray-500">
                      Applied on{' '}
                      {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.floor((Date.now() - new Date(application.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )
        ) : (
          // External Applications
          canAccessExternal ? (
            filteredExternalApplications.length === 0 ? (
              <div className="text-center py-12">
                <ExternalLink className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No external applications found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search filters'
                    : 'Start tracking applications from LinkedIn, Indeed, company websites and more'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowExternalModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add External Application
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredExternalApplications.map((application) => (
                  <motion.li
                    key={application.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-4 sm:px-6 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(application.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-lg font-medium text-gray-900 truncate">
                                {application.jobTitle}
                              </h2>
                              {application.jobUrl && (
                                <a
                                  href={application.jobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {application.company}
                              </div>
                              {application.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {application.location}
                                </div>
                              )}
                              {application.salary && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {application.salary}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}
                        >
                          {formatStatus(application.status)}
                        </span>
                        <select
                          value={application.status}
                          onChange={(e) =>
                            handleExternalStatusUpdate(application.id, e.target.value)
                          }
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="PHONE_SCREEN">Phone Screen</option>
                          <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                          <option value="INTERVIEWED">Interviewed</option>
                          <option value="FINAL_ROUND">Final Round</option>
                          <option value="OFFER_RECEIVED">Offer Received</option>
                          <option value="ACCEPTED">Accepted</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="WITHDRAWN">Withdrawn</option>
                          <option value="NO_RESPONSE">No Response</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-start">
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        <div>
                          Applied on {new Date(application.appliedDate).toLocaleDateString()}
                        </div>
                        {application.source && (
                          <div className="text-xs">Source: {application.source}</div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.floor((Date.now() - new Date(application.appliedDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </div>
                    </div>
                    {application.notes && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {application.notes}
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>
            )
          ) : null
        )}
      </div>

      {/* External Application Modal */}
      {showExternalModal && (
        <ExternalApplicationModal
          isOpen={showExternalModal}
          onClose={() => setShowExternalModal(false)}
          onSuccess={handleExternalApplicationSuccess}
        />
      )}
    </div>
  )
}

 