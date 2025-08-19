'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Clock,
  Building,
  CheckCircle,
  XCircle,
  Edit,
  Send,
  AlertCircle,
  Briefcase,
  DollarSign,
  BookOpen,
  Target,
  Star,
  Eye,
  UserCheck
} from 'lucide-react'
import { StudentApplicationModal } from '@/components/student-application-modal'
import { ProfileRequirementsModal } from '@/components/profile-requirements-modal'
import { FirstApplicationSuccessModal } from '@/components/first-application-success-modal'

interface Project {
  id: string
  title: string
  description: string
  category?: string
  subcategory?: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'LIVE' | 'REJECTED' | 'CLOSED'
  teamSize?: number
  durationMonths?: number
  experienceLevel?: string
  timeCommitment?: string
  remote: boolean
  location?: string
  compensation?: string
  requirements: string[]
  deliverables: string[]
  skillsRequired: string[]
  currentApplications: number
  maxApplications: number
  applicationDeadline?: string
  createdAt: string
  updatedAt: string
  adminFeedback?: string
  approvedAt?: string
  company: {
    name?: string
    companyName?: string
    industry?: string
    companySize?: string
  }
  applications?: Array<{
    id: string
    status: string
    createdAt: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  LIVE: { label: 'Live', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  REJECTED: { label: 'Rejected', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  CLOSED: { label: 'Closed', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
}

export default function ProjectDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isFirstApplication, setIsFirstApplication] = useState(false)
  const [compatibilityScore, setCompatibilityScore] = useState(85)
  const [showRequirementsModal, setShowRequirementsModal] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProject()
      checkIfFirstApplication()
    }
  }, [projectId, session])

  const checkIfFirstApplication = async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch('/api/applications/count')
      if (response.ok) {
        const data = await response.json()
        setIsFirstApplication(data.count === 0)
      }
    } catch (error) {
      console.error('Failed to check application count:', error)
    }
  }

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProject(data)
        
        // Check if current user has applied (for students)
        if (session?.user?.role === 'STUDENT' && data.applications && session?.user?.id) {
          const userApplication = data.applications.find(
            (app: any) => app.user.id === session.user?.id
          )
          setHasApplied(!!userApplication)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', response.status, response.statusText, errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError(error instanceof Error ? error.message : 'Failed to load project details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResubmit = async () => {
    if (!project) return

    try {
      const response = await fetch(`/api/projects/${project.id}/resubmit`, {
        method: 'POST',
      })

      if (response.ok) {
        // Refresh project data
        await fetchProject()
        alert('Project resubmitted for approval!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to resubmit project')
      }
    } catch (error) {
      alert('An error occurred while resubmitting the project')
    }
  }

  const canApply = () => {
    if (!project || !session?.user) return false
    if (session.user.role !== 'STUDENT') return false
    if (project.status !== 'LIVE') return false
    if (hasApplied) return false
    if (project.currentApplications >= project.maxApplications) return false
    
    // Check if Phase 2 (detailed profile) is completed
    const user = session.user as any;
    const hasDetailedProfile = !!(user.university || user.highSchool || user.major || user.subjects);
    if (!hasDetailedProfile) return false
    
    return true
  }

  const canEdit = () => {
    if (!project || !session?.user) return false
    if (session.user.role !== 'COMPANY') return false
    return project.status === 'DRAFT' || project.status === 'REJECTED'
  }

  const canResubmit = () => {
    if (!project || !session?.user) return false
    if (session.user.role !== 'COMPANY') return false
    return project.status === 'REJECTED'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The project you\'re looking for doesn\'t exist or you don\'t have permission to view it.'}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.DRAFT

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {project.company.companyName || project.company.name}
                </div>
                {project.category && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {project.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 sm:mt-0">
              {canApply() && (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Apply Now
                </button>
              )}
              
              {/* Show message when apply is blocked due to incomplete Phase 2 */}
              {session?.user?.role === 'STUDENT' && 
               project?.status === 'LIVE' && 
               !hasApplied && 
               (project?.currentApplications < project?.maxApplications) && 
               (() => {
                 const user = session.user as any;
                 const hasDetailedProfile = !!(user.university || user.highSchool || user.major || user.subjects);
                 return !hasDetailedProfile;
               })() && (
                <button
                  onClick={() => setShowRequirementsModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-amber-300 text-sm font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Add Education Details to Apply
                </button>
              )}
              
              {hasApplied && (
                <div className="inline-flex items-center px-4 py-2 border border-green-200 text-sm font-medium rounded-md text-green-700 bg-green-50">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Applied
                </div>
              )}
              
              {canEdit() && (
                <button
                  onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </button>
              )}
              
              {canResubmit() && (
                <button
                  onClick={handleResubmit}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Resubmit
                </button>
              )}
              
              {session?.user?.role === 'COMPANY' && project.status === 'LIVE' && (
                <button
                  onClick={() => router.push(`/dashboard/projects/${project.id}/applications`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  View Applications ({project.currentApplications})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {project.status === 'PENDING_APPROVAL' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <Clock className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Pending Admin Approval
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your project is currently being reviewed by our admin team. You'll be notified once it's approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {project.status === 'REJECTED' && project.adminFeedback && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Project Requires Changes
                </h3>
                <p className="mt-1 text-sm text-red-700">{project.adminFeedback}</p>
                <p className="mt-2 text-sm text-red-600">
                  Please make the necessary changes and resubmit your project.
                </p>
              </div>
            </div>
          </div>
        )}

        {project.status === 'LIVE' && project.currentApplications >= project.maxApplications && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Application Limit Reached
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  This project has reached its maximum number of applications and is no longer accepting new applicants.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Description</h2>
              <div className="prose prose-sm max-w-none text-gray-700">
                {project.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>

            {/* Requirements */}
            {project.requirements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  Requirements
                </h2>
                <ul className="space-y-2">
                  {project.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3"></span>
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Deliverables */}
            {project.deliverables.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Deliverables
                </h2>
                <ul className="space-y-2">
                  {project.deliverables.map((deliverable, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-3"></span>
                      <span className="text-gray-700">{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
              <div className="space-y-4">
                {project.teamSize && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Team Size</span>
                      <p className="text-sm text-gray-600">{project.teamSize} {project.teamSize === 1 ? 'person' : 'people'}</p>
                    </div>
                  </div>
                )}

                {project.durationMonths && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Duration</span>
                      <p className="text-sm text-gray-600">{project.durationMonths} {project.durationMonths === 1 ? 'month' : 'months'}</p>
                    </div>
                  </div>
                )}

                {project.experienceLevel && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Experience Level</span>
                      <p className="text-sm text-gray-600">{project.experienceLevel}</p>
                    </div>
                  </div>
                )}

                {project.timeCommitment && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Time Commitment</span>
                      <p className="text-sm text-gray-600">{project.timeCommitment}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Location</span>
                    <p className="text-sm text-gray-600">
                      {project.remote ? 'Remote' : project.location || 'Not specified'}
                    </p>
                  </div>
                </div>

                {project.compensation && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Compensation</span>
                      <p className="text-sm text-gray-600">{project.compensation}</p>
                    </div>
                  </div>
                )}

                {/* Only show application count to companies, not students */}
                {session?.user?.role === 'COMPANY' && (
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Applications</span>
                      <p className="text-sm text-gray-600">
                        {project.currentApplications} of {project.maxApplications} received
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Skills Required */}
            {project.skillsRequired.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {project.skillsRequired.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Company</h3>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">{project.company.companyName || project.company.name}</h4>
                {project.company.industry && (
                  <p className="text-sm text-gray-600">{project.company.industry}</p>
                )}
                {project.company.companySize && (
                  <p className="text-sm text-gray-600">{project.company.companySize} employees</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <StudentApplicationModal
          project={project}
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={async () => {
            setHasApplied(true)
            setShowApplicationModal(false)
            
            // If this was their first application, show the gamification modal
            if (isFirstApplication) {
              // Calculate compatibility score (simulate for now)
              setCompatibilityScore(Math.floor(Math.random() * 25) + 75) // 75-100%
              setShowSuccessModal(true)
            }
            
            fetchProject() // Refresh to update application count
          }}
        />
      )}

      {/* First Application Success Modal */}
      <FirstApplicationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        projectTitle={project?.title || ''}
        compatibilityScore={compatibilityScore}
      />

      <ProfileRequirementsModal
        isOpen={showRequirementsModal}
        onClose={() => setShowRequirementsModal(false)}
        userProfile={session?.user}
        type="application"
      />
    </div>
  )
} 