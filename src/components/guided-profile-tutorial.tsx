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
  type: 'text' | 'textarea' | 'select' | 'multi-select'
  options?: string[]
  required: boolean
  maxLength?: number
}

const tutorialSteps: Step[] = [
  {
    id: 1,
    title: "Add Your Educational Background",
    description: "Tell companies about your university and field of study so they can find you for relevant opportunities.",
    field: "university",
    icon: <GraduationCap className="h-6 w-6" />,
    placeholder: "e.g., American University of Sharjah",
    type: "text",
    required: true
  },
  {
    id: 2,
    title: "What's Your Major?",
    description: "This helps us match you with projects that align with your academic background and interests.",
    field: "major",
    icon: <GraduationCap className="h-6 w-6" />,
    placeholder: "e.g., Computer Science, Business Administration",
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
    title: "Add Your Skills",
    description: "List your technical and soft skills. The more specific you are, the better we can match you with projects.",
    field: "skills",
    icon: <Rocket className="h-6 w-6" />,
    placeholder: "Type a skill and press Enter",
    type: "multi-select",
    required: true,
    options: ['JavaScript', 'Python', 'React', 'Node.js', 'Design', 'Marketing', 'Data Analysis', 'Project Management']
  },
  {
    id: 5,
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
      'Government & Public Sector'
    ]
  }
]

export function GuidedProfileTutorial({ isOpen, onClose, userData }: GuidedProfileTutorialProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, any>>({
    university: '',
    major: '',
    bio: '',
    skills: [],
    interests: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const currentStepData = tutorialSteps.find(step => step.id === currentStep)
  const progress = (currentStep / tutorialSteps.length) * 100
  const isLastStep = currentStep === tutorialSteps.length

  useEffect(() => {
    // Load existing data if available
    // This would come from the profile API
  }, [])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSkillAdd = (skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      handleInputChange('skills', [...formData.skills, skill.trim()])
      setSkillInput('')
    }
  }

  const handleSkillRemove = (skillToRemove: string) => {
    handleInputChange('skills', formData.skills.filter((skill: string) => skill !== skillToRemove))
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
    
    const value = formData[currentStepData.field]
    if (!currentStepData.required) return true
    
    if (currentStepData.type === 'multi-select') {
      return Array.isArray(value) && value.length > 0
    }
    
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
      // Save profile data
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Redirect to projects with first application flow
        router.push('/dashboard/projects?guided=true&first=true&tutorial_complete=true')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
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
              className="w-full h-32 p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
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
        if (currentStepData.field === 'skills') {
          return (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd(skillInput))}
                  placeholder={currentStepData.placeholder}
                  className="flex-1 p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
                <button
                  onClick={() => handleSkillAdd(skillInput)}
                  className="px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  disabled={!skillInput.trim()}
                >
                  Add
                </button>
              </div>
              
              {/* Suggested skills */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Suggested skills:</p>
                <div className="flex flex-wrap gap-2">
                  {currentStepData.options?.map(skill => (
                    <button
                      key={skill}
                      onClick={() => handleSkillAdd(skill)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-blue-100 transition-colors"
                      disabled={formData.skills.includes(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Added skills */}
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill: string) => (
                    <div key={skill} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      <span>{skill}</span>
                      <button
                        onClick={() => handleSkillRemove(skill)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        } else {
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
                        : 'border-gray-200 hover:border-gray-300'
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
        }
      
      default:
        return (
          <input
            type="text"
            value={formData[currentStepData.field] || ''}
            onChange={(e) => handleInputChange(currentStepData.field, e.target.value)}
            placeholder={currentStepData.placeholder}
            className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
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
                <p className="text-sm text-gray-600">Step {currentStep} of {tutorialSteps.length}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                      {currentStep === 1 && "Include the full name of your institution as it appears officially."}
                      {currentStep === 2 && "Be specific about your field of study - this helps with better project matching."}
                      {currentStep === 3 && "Mention achievements, interests, or unique experiences that make you memorable."}
                      {currentStep === 4 && "Include both technical skills (like programming languages) and soft skills (like leadership)."}
                      {currentStep === 5 && "Choose at least 3-4 interests to get diverse project recommendations."}
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
