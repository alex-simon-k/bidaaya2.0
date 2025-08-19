'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  X, 
  FileText, 
  Upload, 
  CheckCircle,
  AlertCircle,
  Send,
  Target,
  MessageSquare
} from 'lucide-react'
import { StudentPaywallModal } from '@/components/student-paywall-modal'
import { 
  checkApplicationLimits, 
  canUploadDocuments, 
  getApplicationUpgradePrompt,
  type ApplicationLimits 
} from '@/lib/application-limits'

interface Project {
  id: string
  title: string
  description: string
  skillsRequired: string[]
  category?: string
  problemStatement?: string
  company: {
    companyName?: string
    name?: string
    industry?: string
  }
  remote: boolean
}

interface SimplifiedStudentApplicationModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SimplifiedStudentApplicationModal({ 
  project, 
  isOpen, 
  onClose, 
  onSuccess 
}: SimplifiedStudentApplicationModalProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingLimits, setIsCheckingLimits] = useState(false)
  const [limits, setLimits] = useState<ApplicationLimits | null>(null)
  const [canApplyToProject, setCanApplyToProject] = useState(true)
  const [applicationError, setApplicationError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<'application_limit' | 'file_upload' | 'external_tracking' | undefined>(undefined)
  const [upgradePrompt, setUpgradePrompt] = useState<any>(null)
  const [userBio, setUserBio] = useState<string>('')
  
  // Simple form with only 2 questions
  const [formData, setFormData] = useState({
    whyInterested: '',
    proposedApproach: '',
  })
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // Fetch user profile to get bio
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        const bio = data.profile?.bio || ''
        
        // Extract original bio from discovery profile data if available
        try {
          const bioData = JSON.parse(bio)
          setUserBio(bioData.originalBio || '')
        } catch {
          // If bio is not JSON, use it directly
          setUserBio(bio)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  // Pre-fill with user bio when modal first opens (only once)
  const [hasPreFilledBio, setHasPreFilledBio] = useState(false)
  useEffect(() => {
    if (userBio && !formData.whyInterested && !hasPreFilledBio && isOpen) {
      setFormData(prev => ({
        ...prev,
        whyInterested: userBio
      }))
      setHasPreFilledBio(true)
    }
  }, [userBio, formData.whyInterested, hasPreFilledBio, isOpen])

  useEffect(() => {
    if (isOpen && project && session?.user?.id) {
      checkLimits()
      fetchUserProfile()
    }
  }, [isOpen, project, session?.user?.id])

  const resetForm = () => {
    setFormData({
      whyInterested: '',
      proposedApproach: '',
    })
    setUploadedFile(null)
    setApplicationError(null)
  }

  const checkLimits = async () => {
    if (!project || !session?.user?.id) return
    
    setIsCheckingLimits(true)
    try {
      const response = await fetch(`/api/applications/check-limits?projectId=${project.id}`)
      if (response.ok) {
        const data = await response.json()
        setCanApplyToProject(data.canApply)
        setLimits(data.limits)
        if (!data.canApply) {
          setApplicationError(data.reason)
        }
      }
    } catch (error) {
      console.error('Error checking application limits:', error)
    } finally {
      setIsCheckingLimits(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setApplicationError(null)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setApplicationError('File size must be less than 10MB')
        return
      }
      setUploadedFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!project || !session?.user?.id) return
    
    // Check if Phase 2 (detailed profile) is completed
    const user = session.user as any;
    const hasDetailedProfile = !!(user.university || user.highSchool || user.major || user.subjects);
    
    if (!hasDetailedProfile) {
      // Redirect to profile page to complete Phase 2
      window.location.href = '/dashboard/profile?action=required';
      return;
    }

    // Validation
    if (formData.whyInterested.length < 50) {
      setApplicationError('Please write at least 50 characters explaining why you\'re interested')
      return
    }

    if (formData.proposedApproach.length < 100) {
      setApplicationError('Please write at least 100 characters describing your proposed approach')
      return
    }

    setIsLoading(true)
    setApplicationError(null)

    try {
      // Upload file if provided
      let additionalDocumentUrl = null
      if (uploadedFile) {
        const fileFormData = new FormData()
        fileFormData.append('file', uploadedFile)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: fileFormData,
        })
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          additionalDocumentUrl = uploadData.url
        }
      }

      // Submit application
      const response = await fetch('/api/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          whyInterested: formData.whyInterested,
          proposedApproach: formData.proposedApproach,
          additionalDocument: additionalDocumentUrl
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        handleClose()
        resetForm()
      } else if (response.status === 403 && data.code === 'LIMIT_REACHED') {
        const prompt = getApplicationUpgradePrompt(session.user as any)
        if (prompt) {
          setUpgradePrompt(prompt)
          setUpgradeModalTrigger('application_limit' as any)
          setShowUpgradeModal(true)
        } else {
          setApplicationError(data.error)
        }
      } else {
        setApplicationError(data.error || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      setApplicationError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = () => {
    return formData.whyInterested.length >= 50 && formData.proposedApproach.length >= 100
  }

  const handleClose = () => {
    setHasPreFilledBio(false) // Reset pre-fill flag for next time
    onClose()
  }

  if (!isOpen || !project) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-6 text-white relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FileText className="text-white h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Apply to Project</h2>
                <h3 className="text-lg font-medium text-blue-100">{project.title}</h3>
                <p className="text-blue-100 text-sm">{project.company.companyName || project.company.name}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Checking limits */}
            {isCheckingLimits && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Checking application limits...</p>
              </div>
            )}

            {/* Cannot apply */}
            {!canApplyToProject && !isCheckingLimits && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Cannot Apply</span>
                </div>
                <p className="text-red-600 mt-1">{applicationError}</p>
              </div>
            )}

            {/* Application form */}
            {canApplyToProject && !isCheckingLimits && (
              <div className="space-y-6">
                {/* Question 1: About yourself */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <label className="text-lg font-semibold text-gray-900">
                      Tell us about yourself and why you're here *
                    </label>
                  </div>
                  <textarea
                    value={formData.whyInterested}
                    onChange={(e) => handleInputChange('whyInterested', e.target.value)}
                    placeholder={userBio || "Tell us a bit about yourself, your background, interests, and what you're looking to achieve through internships like this one."}
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.whyInterested.length} / 500 (minimum 50 characters)
                  </p>
                </div>

                {/* Problem Statement Display - Always show project context */}
                <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Problem to Solve:</h4>
                  <p className="text-blue-800 font-medium text-sm sm:text-base leading-relaxed">
                    {project.problemStatement || 
                     project.description || 
                     `Help ${project.company.companyName || project.company.name} with their ${project.title} project. Review the project details above to understand what they're looking for.`}
                  </p>
                </div>

                {/* Question 2: Problem solving approach */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-blue-600" />
                    <label className="text-lg font-semibold text-gray-900">
                      How would you solve this problem? *
                    </label>
                  </div>
                  <textarea
                    value={formData.proposedApproach}
                    onChange={(e) => handleInputChange('proposedApproach', e.target.value)}
                    placeholder="Describe your approach to solving this problem. What steps would you take? What methods or strategies would you use?"
                    className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={800}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.proposedApproach.length} / 800 (minimum 100 characters)
                  </p>
                </div>

                {/* Optional file upload */}
                <div>
                  <label className="text-lg font-semibold text-gray-900 mb-3 block">
                    Additional Document (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Upload portfolio, resume, or relevant document</p>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      Choose File
                    </label>
                    {uploadedFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {uploadedFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Error message */}
                {applicationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-red-600 mt-1">{applicationError}</p>
                  </div>
                )}

                {/* Submit button - Centered and prominent */}
                <div className="flex flex-col gap-4 pt-4 border-t">
                  <div className="flex justify-center">
                    <button
                      onClick={handleSubmit}
                      disabled={!isFormValid() || isLoading}
                      className="flex-1 max-w-xs px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Application
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Cancel button - Secondary */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && upgradePrompt && (
        <StudentPaywallModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          promptConfig={upgradePrompt}
          trigger={upgradeModalTrigger}
        />
      )}
    </>
  )
} 