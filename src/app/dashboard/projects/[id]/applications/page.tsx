'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Linkedin,
  GraduationCap,
  Building,
  Calendar,
  Star,
  Filter,
  Search,
  Download
} from 'lucide-react'

interface Application {
  id: string
  status: string
  createdAt: string
  coverLetter?: string
  resumeUrl?: string
  compatibilityScore?: number
  appliedVia: string
  user: {
    id: string
    name: string
    email: string
    university: string
    major: string
    linkedin?: string
  }
}

interface Project {
  id: string
  title: string
  category: string
  description: string
  status: string
}

export default function ProjectApplicationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showApplicationDetail, setShowApplicationDetail] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (session?.user?.role !== 'COMPANY') {
      router.push('/dashboard')
      return
    }
    
    fetchProjectAndApplications()
  }, [session, projectId, router])

  const fetchProjectAndApplications = async () => {
    try {
      setIsLoading(true)
      
      // Fetch project details and applications
      const response = await fetch(`/api/projects/${projectId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch project data')
      }
      
      const data = await response.json()
      setProject(data.project)
      setApplications(data.applications || [])
      
    } catch (error) {
      console.error('Error fetching project applications:', error)
      setError('Failed to load project applications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update application status')
      }

      // Refresh applications
      fetchProjectAndApplications()
    } catch (error) {
      console.error('Error updating application status:', error)
      setError('Failed to update application status')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      SHORTLISTED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      INTERVIEWED: { color: 'bg-purple-100 text-purple-800', icon: Users },
      ACCEPTED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    )
  }

  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.university.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-2 text-red-600 hover:text-red-700 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Applications for {project?.title}
            </h1>
            <p className="mt-1 text-gray-600">
              {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search applicants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {applications.length === 0 
                ? "No one has applied to this project yet." 
                : "No applications match your current filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((application) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.user.name}
                      </h3>
                      {getStatusBadge(application.status)}
                      {application.compatibilityScore && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-medium">
                            {Math.round(application.compatibilityScore * 100)}% match
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {application.user.email}
                      </div>
                      {application.user.university && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          {application.user.university} - {application.user.major}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Applied {new Date(application.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {application.coverLetter && (
                      <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                        {application.coverLetter}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {application.user.linkedin && (
                      <a
                        href={application.user.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedApplication(application)
                        setShowApplicationDetail(true)
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    
                    {application.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusUpdate(application.id, 'SHORTLISTED')}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(application.id, 'REJECTED')}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {showApplicationDetail && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Application Details
                </h2>
                <button
                  onClick={() => setShowApplicationDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Applicant Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedApplication.user.name}</p>
                    <p><strong>Email:</strong> {selectedApplication.user.email}</p>
                    <p><strong>University:</strong> {selectedApplication.user.university}</p>
                    <p><strong>Major:</strong> {selectedApplication.user.major}</p>
                    <p><strong>Applied:</strong> {new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedApplication.status)}</p>
                  </div>
                </div>
                
                {selectedApplication.coverLetter && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Cover Letter</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedApplication.coverLetter}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-6 border-t">
                  {selectedApplication.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedApplication.id, 'SHORTLISTED')
                          setShowApplicationDetail(false)
                        }}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Shortlist Candidate
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedApplication.id, 'REJECTED')
                          setShowApplicationDetail(false)
                        }}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reject Application
                      </button>
                    </>
                  )}
                  
                  {selectedApplication.status === 'SHORTLISTED' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedApplication.id, 'INTERVIEWED')
                        setShowApplicationDetail(false)
                      }}
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Mark as Interviewed
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 