'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  FileText, 
  Upload, 
  Clock, 
  Star, 
  AlertCircle, 
  CheckCircle,
  Crown,
  Zap,
  Lock
} from 'lucide-react'
import { StudentPaywallModal } from '@/components/student-paywall-modal'
import { 
  checkApplicationLimits, 
  canUploadDocuments, 
  getApplicationUpgradePrompt,
  getFileUpgradePrompt,
  type ApplicationLimits 
} from '@/lib/application-limits'

interface Project {
  id: string
  title: string
  description: string
  skillsRequired: string[]
  company: {
    companyName?: string
    name?: string
    industry?: string
  }
  department?: string
  duration?: string
  location?: string
  remote: boolean
}

// Remove local interface since we're importing from lib

interface StudentApplicationModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function StudentApplicationModal({ 
  project, 
  isOpen, 
  onClose, 
  onSuccess 
}: StudentApplicationModalProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingLimits, setIsCheckingLimits] = useState(false)
  const [limits, setLimits] = useState<ApplicationLimits | null>(null)
  const [canApplyToProject, setCanApplyToProject] = useState(true)
  const [applicationError, setApplicationError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<string>('')
  
  // Form state
  const [coverLetter, setCoverLetter] = useState('')
  const [additionalDocument, setAdditionalDocument] = useState<File | null>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  useEffect(() => {
    if (isOpen && project && session?.user?.id) {
      checkApplicationLimits()
    }
  }, [isOpen, project, session])

  const checkApplicationLimits = async () => {
    if (!project || !session?.user?.id) return
    
    setIsCheckingLimits(true)
    try {
      const response = await fetch(`/api/applications/check-limits?projectId=${project.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setLimits(data.limits)
        setCanApplyToProject(data.canApply)
        if (!data.canApply) {
          setApplicationError(data.reason)
        }
      } else {
        setApplicationError(data.error || 'Failed to check application limits')
      }
    } catch (error) {
      setApplicationError('Failed to check application limits')
    } finally {
      setIsCheckingLimits(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setApplicationError('File size must be less than 5MB')
        return
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        setApplicationError('Please upload a PDF or Word document')
        return
      }
      
      setAdditionalDocument(file)
      setApplicationError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !session?.user?.id || !canApplyToProject) return

    setIsLoading(true)
    setApplicationError(null)

    try {
      let documentUrl = null
      
      // Upload document if provided
      if (additionalDocument) {
        const formData = new FormData()
        formData.append('file', additionalDocument)
        formData.append('type', 'application-document')
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          documentUrl = uploadData.url
        } else {
          throw new Error('Failed to upload document')
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
          coverLetter: coverLetter.trim(),
          additionalDocument: documentUrl,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
        // Show success notification
        alert(`Application submitted successfully! You have ${data.remainingApplications} applications remaining.`)
      } else {
        setApplicationError(data.error || 'Failed to submit application')
        
        // Show upgrade prompt if user hit their limit
        if (data.error?.includes('limit') && data.error?.includes('Upgrade')) {
          setShowUpgradePrompt(true)
        }
      }
    } catch (error) {
      setApplicationError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = () => {
    // Redirect to pricing or open upgrade modal
    window.location.href = '/pricing'
  }

  if (!isOpen || !project) return null

  const userTier = (session?.user as any)?.subscriptionPlan || 'FREE'
  const isPremium = userTier !== 'FREE'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8 text-white relative">
          <button
            onClick={onClose}
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
              <h3 className="text-xl font-semibold text-blue-100">{project.title}</h3>
                              <p className="text-blue-200">{project.company.companyName || project.company.name}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isCheckingLimits ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Checking application limits...</span>
            </div>
          ) : !canApplyToProject ? (
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Cannot Apply</h3>
              <p className="text-gray-600 mb-6">{applicationError}</p>
              
              {applicationError?.includes('Upgrade') && (
                <button
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-300"
                >
                  <Crown className="h-5 w-5 inline mr-2" />
                  Upgrade to Premium
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Application Limits Info */}
              {limits && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isPremium ? (
                        <Crown className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Zap className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {isPremium ? 'Premium Plan' : 'Free Plan'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {limits.applicationsRemaining} of {limits.maxApplications} applications remaining
                        </p>
                      </div>
                    </div>
                    
                    {limits.applicationsRemaining <= 1 && !isPremium && (
                      <button
                        onClick={handleUpgrade}
                        className="text-xs bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-full hover:from-purple-600 hover:to-indigo-700 transition-all"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-3 bg-white rounded-lg p-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Applications used</span>
                      <span>{limits.applicationsUsed} / {limits.maxApplications}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(limits.applicationsUsed / limits.maxApplications) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Resets {new Date(limits.nextResetDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Application Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cover Letter */}
                <div>
                  <label htmlFor="coverLetter" className="block text-sm font-semibold text-gray-700 mb-2">
                    Cover Letter *
                  </label>
                  <textarea
                    id="coverLetter"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Tell the company why you're interested in this project and what value you can bring..."
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 resize-none h-32"
                    required
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">Express your interest and relevant experience</p>
                    <p className="text-xs text-gray-400">{coverLetter.length} / 1000</p>
                  </div>
                </div>

                {/* Additional Document */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Document 
                    {!isPremium && limits && limits.documentsAllowed < 2 && (
                      <span className="text-purple-600 text-xs ml-2">(Premium Feature)</span>
                    )}
                  </label>
                  
                  {isPremium || (limits && limits.documentsAllowed >= 2) ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        id="documentUpload"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                      />
                      <label htmlFor="documentUpload" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">
                          {additionalDocument ? additionalDocument.name : 'Upload Resume, Portfolio, or Cover Letter'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF or Word document, max 5MB</p>
                      </label>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
                      <div className="absolute top-2 right-2">
                        <Lock className="h-5 w-5 text-purple-400" />
                      </div>
                      <Crown className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-purple-700 mb-1">Premium Feature</p>
                      <p className="text-xs text-purple-600 mb-3">Upload portfolios, transcripts & certificates to stand out!</p>
                      <button
                        type="button"
                        onClick={() => {
                          setUpgradeModalTrigger('file_upload')
                          setShowUpgradeModal(true)
                        }}
                        className="inline-flex items-center gap-1 text-xs bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        <Crown className="h-3 w-3" />
                        Upgrade Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {applicationError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <p className="text-red-700 text-sm">{applicationError}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading || !coverLetter.trim() || !canApplyToProject}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
} 