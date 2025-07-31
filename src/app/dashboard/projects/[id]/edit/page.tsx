'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  category?: string
  subcategory?: string
  status: string
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
  adminFeedback?: string
  company: {
    name: string
  }
}

export default function EditProjectPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    teamSize: 1,
    durationMonths: 3,
    experienceLevel: 'High School',
    timeCommitment: 'Part-time',
    remote: true,
    location: '',
    compensation: '',
    requirements: [] as string[],
    deliverables: [] as string[],
    skillsRequired: [] as string[]
  })

  useEffect(() => {
    if (session?.user?.role !== 'COMPANY') {
      router.push('/dashboard')
      return
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId, session, router])

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProject(data)
        
        // Populate form with project data
        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          teamSize: data.teamSize || 1,
          durationMonths: data.durationMonths || 3,
          experienceLevel: data.experienceLevel || 'High School',
          timeCommitment: data.timeCommitment || 'Part-time',
          remote: data.remote !== undefined ? data.remote : true,
          location: data.location || '',
          compensation: data.compensation || '',
          requirements: data.requirements || [],
          deliverables: data.deliverables || [],
          skillsRequired: data.skillsRequired || []
        })
      } else {
        throw new Error('Failed to fetch project')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Failed to load project details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccessMessage(null)
  }

  const handleArrayChange = (field: 'requirements' | 'deliverables' | 'skillsRequired', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'requirements' | 'deliverables' | 'skillsRequired') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'requirements' | 'deliverables' | 'skillsRequired', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSave = async (submitForApproval = false) => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const updateData = {
        ...formData,
        // Filter out empty strings from arrays
        requirements: formData.requirements.filter(r => r.trim()),
        deliverables: formData.deliverables.filter(d => d.trim()),
        skillsRequired: formData.skillsRequired.filter(s => s.trim()),
        // If submitting for approval, set status to PENDING_APPROVAL
        ...(submitForApproval && { status: 'PENDING_APPROVAL' })
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedProject = await response.json()
        setProject(updatedProject)
        
        if (submitForApproval) {
          setSuccessMessage('Project submitted for approval!')
          setTimeout(() => {
            router.push('/dashboard/projects/status')
          }, 2000)
        } else {
          setSuccessMessage('Project saved successfully!')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save project')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading project...</span>
        </div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Project</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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

  const canEdit = project?.status === 'DRAFT' || project?.status === 'REJECTED'

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cannot Edit Project</h2>
          <p className="text-gray-600 mb-4">
            Only draft or rejected projects can be edited. This project has status: {project?.status}
          </p>
          <button
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            View Project
          </button>
        </div>
      </div>
    )
  }

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
            Back to Project
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
              <p className="text-gray-600 mt-1">Make changes to your project details</p>
            </div>
            
            <div className="flex gap-2 mt-4 sm:mt-0">
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="inline-flex items-center px-6 py-3 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSaving ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        </div>

        {/* Admin Feedback (if rejected) */}
        {project?.status === 'REJECTED' && project.adminFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Admin Feedback
                </h3>
                <p className="mt-1 text-sm text-red-700">{project.adminFeedback}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success/Error Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
          >
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
            <p className="text-sm text-gray-600 mt-1">Update your project information below</p>
          </div>
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-500"
                    placeholder="Enter a clear, descriptive project title"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Project Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-500 resize-none"
                    placeholder="Provide a detailed description of your project, its goals, scope, and what the student will learn or accomplish"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.teamSize}
                    onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Duration (months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.durationMonths}
                    onChange={(e) => handleInputChange('durationMonths', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="High School">High School</option>
                    <option value="University">University</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Commitment
                  </label>
                  <select
                    value={formData.timeCommitment}
                    onChange={(e) => handleInputChange('timeCommitment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Part-time">Part-time</option>
                    <option value="Full-time">Full-time</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.remote}
                      onChange={(e) => handleInputChange('remote', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">This is a remote position</span>
                  </label>
                </div>

                {!formData.remote && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compensation
                  </label>
                  <input
                    type="text"
                    value={formData.compensation}
                    onChange={(e) => handleInputChange('compensation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., $15/hour, Unpaid, Academic Credit"
                  />
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
              <div className="space-y-2">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter a requirement"
                    />
                    <button
                      onClick={() => removeArrayItem('requirements', index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('requirements')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Requirement
                </button>
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Deliverables</h2>
              <div className="space-y-2">
                {formData.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={deliverable}
                      onChange={(e) => handleArrayChange('deliverables', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter a deliverable"
                    />
                    <button
                      onClick={() => removeArrayItem('deliverables', index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('deliverables')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Deliverable
                </button>
              </div>
            </div>

            {/* Skills Required */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills Required</h2>
              <div className="space-y-2">
                {formData.skillsRequired.map((skill, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleArrayChange('skillsRequired', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter a skill"
                    />
                    <button
                      onClick={() => removeArrayItem('skillsRequired', index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('skillsRequired')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Add Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 