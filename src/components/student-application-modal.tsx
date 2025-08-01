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
  Lock,
  User,
  MapPin,
  Calendar,
  Target,
  MessageSquare,
  Paperclip,
  Award,
  BookOpen,
  Send
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
  category?: string
  workType?: string
  paymentType?: string
  hoursPerWeek?: number
  durationMonths?: number
  experienceLevel?: string
  hiringIntent?: string
  definitionOfDone?: string
  problemStatement?: string
  solutionDirection?: string
  idealCandidateRequirements?: string[]
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
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingLimits, setIsCheckingLimits] = useState(false)
  const [limits, setLimits] = useState<ApplicationLimits | null>(null)
  const [canApplyToProject, setCanApplyToProject] = useState(true)
  const [applicationError, setApplicationError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<string>('')
  
  const [formData, setFormData] = useState({
    whyInterested: '',
    proposedApproach: '',
    personalStatement: '',
    relevantExperience: '',
    projectUnderstanding: '',
    weeklyAvailability: '',
    startDate: '',
    commitmentLevel: '',
  })
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  useEffect(() => {
    if (isOpen && project && session?.user?.id) {
      checkApplicationLimits()
      resetForm()
    }
  }, [isOpen, project, session])

  const resetForm = () => {
    setCurrentStep(1)
    setFormData({
      whyInterested: '',
      proposedApproach: '',
      personalStatement: '',
      relevantExperience: '',
      projectUnderstanding: '',
      weeklyAvailability: '',
      startDate: '',
      commitmentLevel: '',
    })
    setUploadedFile(null)
    setApplicationError(null)
  }

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Premium feature check
    if (!isPremium) {
      setApplicationError('File uploads are available for Premium users only. Upgrade to unlock this feature.')
      setTimeout(() => {
        setShowUpgradeModal(true)
        setUpgradeModalTrigger('file_upload')
      }, 1000)
      return
    }

    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setApplicationError('File size must be less than 10MB')
        return
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        setApplicationError('Please upload a PDF, Word document, or image file')
        return
      }
      
      setUploadedFile(file)
      setApplicationError(null)
      console.log('✅ File uploaded successfully:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!project || !session?.user?.id || !canApplyToProject) return

    setIsLoading(true)
    setApplicationError(null)

    try {
      let additionalDocumentUrl = ''
      
      // Upload file if provided
      if (uploadedFile) {
        const fileFormData = new FormData()
        fileFormData.append('file', uploadedFile)
        fileFormData.append('type', 'application-document')
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: fileFormData
        })
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          additionalDocumentUrl = uploadData.url
        } else {
          throw new Error('Failed to upload additional document')
        }
      }

      // Submit structured application data
      const response = await fetch('/api/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          // Simplified application with just 2 questions
          whyInterested: formData.whyInterested,
          proposedApproach: formData.proposedApproach,
          additionalDocument: additionalDocumentUrl
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
          setShowUpgradeModal(true)
        }
      }
    } catch (error) {
      setApplicationError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = () => {
    window.location.href = '/pricing'
  }

  if (!isOpen || !project) return null

  const userTier = (session?.user as any)?.subscriptionPlan || 'FREE'
  const isPremium = userTier !== 'FREE'

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return User
      case 2: return Target
      case 3: return Calendar
      case 4: return Paperclip
      default: return User
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1: return formData.whyInterested.length > 50 // Only check why interested
      case 2: return formData.proposedApproach.length > 100 // Only check proposed approach  
      case 3: return formData.weeklyAvailability && formData.startDate && formData.commitmentLevel
      case 4: return true // Optional step
      default: return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-6 text-white relative">
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

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => {
              const StepIcon = getStepIcon(step)
              const isActive = step === currentStep
              const isCompleted = step < currentStep
              const isValid = isStepValid(step)
              
              return (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    isCompleted 
                      ? 'bg-white text-blue-600 border-white' 
                      : isActive 
                        ? 'bg-white/20 text-white border-white' 
                        : 'bg-transparent text-blue-200 border-blue-200'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      step < currentStep ? 'bg-white' : 'bg-blue-200'
                    }`} />
                  )}
                </div>
              )
            })}
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

              {/* Step Content */}
              <div className="min-h-[400px]">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Why This Project?
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Why are you interested in this project? *
                          </label>
                          <textarea
                            value={formData.whyInterested}
                            onChange={(e) => handleInputChange('whyInterested', e.target.value)}
                            placeholder="What excites you about this opportunity? How does it align with your goals?"
                            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 resize-none h-32"
                            required
                            maxLength={500}
                          />
                          <p className="text-xs text-gray-500 mt-1">{formData.whyInterested.length} / 500 (minimum 50 characters)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Your Solution Approach
                      </h3>
                      
                      {/* Project Context */}
                      <div className="bg-blue-50 rounded-xl p-4 mb-6">
                        <h4 className="font-semibold text-blue-900 mb-2">Project Context</h4>
                        {project.definitionOfDone && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-blue-800">Goal:</p>
                            <p className="text-sm text-blue-700">{project.definitionOfDone}</p>
                          </div>
                        )}
                        {project.problemStatement && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-blue-800">Problem:</p>
                            <p className="text-sm text-blue-700">{project.problemStatement}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            What is your proposed approach (your solution to this project)? *
                          </label>
                          <textarea
                            value={formData.proposedApproach}
                            onChange={(e) => handleInputChange('proposedApproach', e.target.value)}
                            placeholder="How would you approach this project? What steps would you take to achieve the goals?"
                            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 resize-none h-40"
                            required
                            maxLength={800}
                          />
                          <p className="text-xs text-gray-500 mt-1">{formData.proposedApproach.length} / 800 (minimum 100 characters)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Availability & Commitment
                      </h3>
                      
                      {/* Project Requirements */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Project Requirements</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Work Type: </span>
                            <span className="text-gray-600">{project.workType || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Hours/Week: </span>
                            <span className="text-gray-600">{project.hoursPerWeek || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Duration: </span>
                            <span className="text-gray-600">{project.durationMonths} months</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Payment: </span>
                            <span className="text-gray-600">{project.paymentType || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Weekly Availability *
                          </label>
                          <select
                            value={formData.weeklyAvailability}
                            onChange={(e) => handleInputChange('weeklyAvailability', e.target.value)}
                            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300"
                            required
                          >
                            <option value="">Select your availability</option>
                            <option value="1-5 hours">1-5 hours per week</option>
                            <option value="5-10 hours">5-10 hours per week</option>
                            <option value="10-15 hours">10-15 hours per week</option>
                            <option value="15-20 hours">15-20 hours per week</option>
                            <option value="20+ hours">20+ hours per week</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Preferred Start Date *
                          </label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Commitment Level *
                          </label>
                          <select
                            value={formData.commitmentLevel}
                            onChange={(e) => handleInputChange('commitmentLevel', e.target.value)}
                            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300"
                            required
                          >
                            <option value="">Select commitment level</option>
                            <option value="casual">Casual - Flexible hours, learning focused</option>
                            <option value="regular">Regular - Consistent weekly commitment</option>
                            <option value="dedicated">Dedicated - High priority, reliable schedule</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Paperclip className="h-5 w-5 text-blue-600" />
                        Additional File (Optional)
                        {!isPremium && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </span>
                        )}
                      </h3>
                      
                      <div className="space-y-6">
                        {/* Premium File Upload */}
                        {isPremium ? (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Add Additional File
                            </label>
                            <p className="text-sm text-gray-600 mb-4">
                              Upload one additional file such as your resume, portfolio, or other relevant document.
                            </p>
                            
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                              <input
                                type="file"
                                id="additionalFileUpload"
                                onChange={handleFileUpload}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                className="hidden"
                              />
                              <label htmlFor="additionalFileUpload" className="cursor-pointer">
                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                {uploadedFile ? (
                                  <div>
                                    <p className="text-sm font-medium text-green-600 mb-1">
                                      ✓ {uploadedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Click to replace file
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">
                                      Click to upload a file
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      PDF, Word document, or image (max 10MB)
                                    </p>
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>
                        ) : (
                          /* Locked State for Free Users */
                          <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Add Additional File
                            </label>
                            <p className="text-sm text-gray-600 mb-4">
                              Upload additional documents to strengthen your application (resume, portfolio, etc.)
                            </p>
                            
                            <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
                              {/* Lock Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/90 to-pink-100/90 flex items-center justify-center">
                                <div className="text-center">
                                  <Lock className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                                  <p className="text-purple-700 font-semibold mb-2">Premium Feature</p>
                                  <p className="text-purple-600 text-sm mb-4">Upload additional files to stand out</p>
                                  <button
                                    onClick={handleUpgrade}
                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all"
                                  >
                                    <Crown className="h-4 w-4 mr-2" />
                                    Upgrade to Premium
                                  </button>
                                </div>
                              </div>
                              
                              {/* Background Content (Blurred) */}
                              <div className="opacity-40 filter blur-sm">
                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                  Click to upload a file
                                </p>
                                <p className="text-xs text-gray-500">
                                  PDF, Word document, or image (max 10MB)
                                </p>
                              </div>
                            </div>
                            
                            {/* Premium Benefits */}
                            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <h4 className="text-sm font-semibold text-purple-800 mb-2">
                                🎯 With Premium you can:
                              </h4>
                              <ul className="text-xs text-purple-700 space-y-1">
                                <li>• Upload resume, portfolio, or other documents</li>
                                <li>• Stand out with additional materials</li>
                                <li>• Increase your chances of being shortlisted</li>
                                <li>• Premium: 10 apps/month • Pro: Unlimited apps</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {applicationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-700 text-sm">{applicationError}</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t mt-6">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 border-2 border-blue-200 text-blue-600 rounded-xl font-semibold hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                    >
                      Previous
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid(currentStep)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading || !canApplyToProject}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Submit Application
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
} 