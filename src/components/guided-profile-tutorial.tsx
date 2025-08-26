'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ChevronDown,
  GraduationCap,
  Sparkles,
  Rocket,
  Target,
  X,
  Edit3,
  Save,
  MapPin,
  Calendar
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface GuidedProfileTutorialProps {
  isOpen: boolean
  onClose: () => void
  userData: {
    name: string
    email: string
    [key: string]: any
  }
}

interface Step {
  id: number
  title: string
  description: string
  field: string
  icon: React.ReactNode
  placeholder: string
  type: 'text' | 'textarea' | 'select' | 'multi-select' | 'institutions' | 'mena-select'
  options?: string[]
  required: boolean
  maxLength?: number
}

const tutorialSteps: Step[] = [
  {
    id: 1,
    title: "Add Your Educational Institutions",
    description: "Tell companies about your educational background. Fill in the institution that's most relevant to you.",
    field: "institutions",
    icon: <GraduationCap className="h-6 w-6" />,
    placeholder: "Enter your institution name",
    type: "institutions",
    required: true
  },
  {
    id: 2,
    title: "What are your most recent subjects?",
    description: "Tell us about the most recent modules or subjects you've studied. This helps with project matching.",
    field: "subjects",
    icon: <GraduationCap className="h-6 w-6" />,
    placeholder: "e.g., Computer Science, Business Administration, Marketing",
    type: "text",
    required: true
  },
  {
    id: 3,
    title: "Write Your Bio",
    description: "Share something interesting about yourself! This is your chance to stand out and show your personality.",
    field: "bio",
    icon: <Sparkles className="h-6 w-6" />,
    placeholder: "e.g., I'm passionate about sustainable technology and love building solutions that make a difference...",
    type: "textarea",
    required: true,
    maxLength: 150
  },
  {
    id: 4,
    title: "Choose Your Interests",
    description: "Select the industries and project types that excite you most. This helps us recommend the perfect opportunities.",
    field: "interests",
    icon: <Target className="h-6 w-6" />,
    placeholder: "Select your interests",
    type: "multi-select",
    required: true,
    options: [
      'Technology & Software Development',
      'Marketing & Digital Media',
      'Finance & Banking',
      'Healthcare & Medical',
      'Education & Training',
      'Consulting & Strategy',
      'Design & Creative Arts',
      'Engineering & Manufacturing',
      'Sales & Business Development',
      'Non-profit & Social Impact',
      'Startups & Entrepreneurship',
      'Government & Public Sector',
      'Law & Legal Services',
      'Real Estate & Property',
      'Hospitality & Tourism'
    ]
  }
]

export function GuidedProfileTutorial({ isOpen, onClose, userData }: GuidedProfileTutorialProps) {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, any>>({
    highSchool: '',
    university: '',
    subjects: '',
    bio: '',
    interests: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [relevantSteps, setRelevantSteps] = useState<Step[]>([])

  // Filter steps to only show what's missing
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          const profile = data.profile
          setProfileData(profile)
          
          console.log('📋 Profile data for tutorial:', profile)
          
          // Determine which steps are needed
          const neededSteps = tutorialSteps.filter(step => {
            switch (step.field) {
              case 'institutions':
                return !(profile.university?.trim() || profile.highSchool?.trim())
              case 'subjects':
                return !profile.subjects?.trim()
              case 'bio':
                return !profile.bio?.trim()
              case 'interests':
                return !(profile.interests?.length > 0)
              default:
                return true
            }
          })
          
          console.log('🎯 Steps needed:', neededSteps.map(s => s.field))
          setRelevantSteps(neededSteps)
          
          // Pre-fill form with existing data
          setFormData({
            highSchool: profile.highSchool || '',
            university: profile.university || '',
            subjects: profile.subjects || '',
            bio: profile.bio || '',
            interests: profile.interests || []
          })
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error)
        // Fallback to showing all steps
        setRelevantSteps(tutorialSteps)
      }
    }

    if (isOpen) {
      fetchProfileData()
    }
  }, [isOpen])

  // Use array index for current step since we filtered the steps
  const currentStepData = relevantSteps[currentStep - 1]
  const progress = relevantSteps.length > 0 ? (currentStep / relevantSteps.length) * 100 : 100
  const isLastStep = currentStep === relevantSteps.length

  // If no steps are needed, auto-close the tutorial
  useEffect(() => {
    if (relevantSteps.length === 0 && profileData) {
      console.log('🎉 No missing fields found, closing tutorial')
      onClose()
    }
  }, [relevantSteps, profileData, onClose])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }



  const handleInterestToggle = (interest: string) => {
    const currentInterests = formData.interests || []
    if (currentInterests.includes(interest)) {
      handleInputChange('interests', currentInterests.filter((i: string) => i !== interest))
    } else {
      handleInputChange('interests', [...currentInterests, interest])
    }
  }

  const canProceed = () => {
    if (!currentStepData) return false
    
    if (!currentStepData.required) return true
    
    if (currentStepData.type === 'institutions') {
      // For institutions, user needs to fill at least one field
      return (formData.highSchool && formData.highSchool.trim()) || 
             (formData.university && formData.university.trim())
    }
    

    
    if (currentStepData.type === 'multi-select') {
      const value = formData[currentStepData.field]
      return Array.isArray(value) && value.length > 0
    }
    
    const value = formData[currentStepData.field]
    return value && value.toString().trim().length > 0
  }

  const handleNext = () => {
    if (canProceed()) {
      if (isLastStep) {
        handleComplete()
      } else {
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      // Prepare data in the correct format for the API
      const profileData = {
        name: userData.name, // Include name for hasRequiredFields check
        highSchool: formData.highSchool || '',
        university: formData.university || '',
        subjects: formData.subjects || '',
        bio: formData.bio || '',
        interests: formData.interests || [],
        terms: true, // Include terms for hasRequiredFields check  
        profileCompleted: true
      }

      console.log('Saving profile data:', profileData)

      // Save profile data
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        console.log('Profile saved successfully')
        
        // Track Phase 2 completion
        if (session?.user?.id) {
          try {
            const { AnalyticsTracker } = await import('@/lib/analytics-tracker')
            await AnalyticsTracker.trackPhase2Completed(session.user.id)
            console.log('📊 Analytics tracked: Phase 2 completion')
          } catch (error) {
            console.error('Failed to track Phase 2 completion:', error)
          }
        }
        
        // Close the tutorial immediately for smooth UX
        onClose()
        
        // Update session in background and redirect smoothly
        console.log('🔄 Updating session and redirecting...')
        try {
          await update({ profileCompleted: true })
          console.log('✅ Session updated with profileCompleted: true')
        } catch (error) {
          console.error('⚠️ Session update failed:', error)
        }
        
        // Immediate redirect - no delay, no flicker
        window.location.href = '/dashboard/projects?guided=true&first=true&tutorial_complete=true'
      } else {
        console.error('Failed to save profile:', await response.text())
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEarlyExit = async () => {
    setIsLoading(true)
    try {
      // Save any data that was entered but don't mark as profileCompleted
      const partialData = {
        name: userData.name,
        highSchool: formData.highSchool || '',
        university: formData.university || '',
        subjects: formData.subjects || '',
        bio: formData.bio || '',
        interests: formData.interests || [],
        terms: true,
        // Important: DO NOT set profileCompleted to true for early exit
        profileCompleted: false
      }

      console.log('Saving partial profile data on early exit:', partialData)

      // Save partial data
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialData)
      })

      if (response.ok) {
        console.log('Partial profile data saved successfully')
        
        // Track Phase 2 abandonment for analytics
        if (session?.user?.id) {
          try {
            const { AnalyticsTracker } = await import('@/lib/analytics-tracker')
            await AnalyticsTracker.trackPhase2Abandoned(session.user.id, currentStep)
            console.log('📊 Analytics tracked: Phase 2 abandonment at step', currentStep)
          } catch (error) {
            console.error('Failed to track Phase 2 abandonment:', error)
          }
        }
        
        // Close tutorial and allow user to explore platform
        onClose()
        
        // Redirect to projects page but without the completion flags
        window.location.href = '/dashboard/projects'
      } else {
        console.error('Failed to save partial profile:', await response.text())
        // Even if save fails, allow exit
        onClose()
      }
    } catch (error) {
      console.error('Failed to save partial profile:', error)
      // Even if save fails, allow exit
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const renderInput = () => {
    if (!currentStepData) return null

    switch (currentStepData.type) {
      case 'textarea':
        return (
          <div className="relative">
            <textarea
              value={formData[currentStepData.field] || ''}
              onChange={(e) => handleInputChange(currentStepData.field, e.target.value)}
              placeholder={currentStepData.placeholder}
              className="w-full h-32 p-4 text-lg text-gray-900 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              maxLength={currentStepData.maxLength}
            />
            {currentStepData.maxLength && (
              <div className="absolute bottom-2 right-2 text-sm text-gray-400">
                {(formData[currentStepData.field] || '').length} / {currentStepData.maxLength}
              </div>
            )}
          </div>
        )
      
      case 'multi-select':
        // Interests
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentStepData.options?.map(option => {
              const isSelected = formData.interests?.includes(option)
              return (
                <button
                  key={option}
                  onClick={() => handleInterestToggle(option)}
                  className={`p-4 text-left rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-900' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {isSelected && <Check className="h-5 w-5 text-blue-600" />}
                  </div>
                </button>
              )
            })}
          </div>
        )
      case 'institutions':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">High School (Optional)</label>
              <input
                type="text"
                value={formData.highSchool || ''}
                onChange={(e) => handleInputChange('highSchool', e.target.value)}
                placeholder="e.g., International School of Choueifat"
                className="w-full p-4 text-lg text-gray-900 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">University (Optional)</label>
              <input
                type="text"
                value={formData.university || ''}
                onChange={(e) => handleInputChange('university', e.target.value)}
                placeholder="e.g., American University of Sharjah"
                className="w-full p-4 text-lg text-gray-900 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <p className="text-sm text-gray-600">Fill in the institution that's most relevant to you. You only need to complete one field.</p>
          </div>
        )
      
      default:
        return (
          <input
            type="text"
            value={formData[currentStepData.field] || ''}
            onChange={(e) => handleInputChange(currentStepData.field, e.target.value)}
            placeholder={currentStepData.placeholder}
            className="w-full p-4 text-lg text-gray-900 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                {currentStepData?.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Profile Setup</h2>
                <p className="text-sm text-gray-600">Step {currentStep} of {relevantSteps.length}</p>
              </div>
            </div>
            <button 
              onClick={handleEarlyExit} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
              title="Exit and save progress"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentStepData?.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {currentStepData?.description}
                </p>
              </div>

              {renderInput()}

              {/* Help text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">💡</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Pro Tip</h4>
                    <p className="text-blue-800 text-sm">
                      {currentStep === 1 && "Include the full name of your institution as it appears officially. Only fill the one most relevant to you."}
                      {currentStep === 2 && "Be specific about your recent subjects/modules - this helps with better project matching."}
                      {currentStep === 3 && "Mention achievements, interests, or unique experiences that make you memorable."}
                      {currentStep === 4 && "Choose at least 3-4 interests to get diverse project recommendations."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  {isLastStep ? 'Complete Profile' : 'Next Step'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
