'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Sparkles,
  Target,
  Lightbulb,
  Users,
  Calendar,
  Zap,
  Award,
  BookOpen,
  Code,
  Palette,
  TrendingUp,
  Globe,
  Heart
} from 'lucide-react'

interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'multi_select' | 'scale' | 'text' | 'skills_selection'
  category: 'skills' | 'interests' | 'preferences' | 'goals' | 'experience'
  title: string
  description?: string
  options?: string[]
  skillCategories?: SkillCategory[]
  required: boolean
}

interface SkillCategory {
  name: string
  icon: any
  skills: string[]
  color: string
}

interface QuizAnswer {
  questionId: string
  value: string | string[] | number
}

interface StudentProfile {
  skills: string[]
  interests: string[]
  careerGoals: string[]
  workPreferences: {
    projectDuration: string
    teamSize: string
    workStyle: string
    timeCommitment: string
  }
  experienceLevel: string
  industries: string[]
  learningGoals: string[]
}

interface StudentDiscoveryQuizProps {
  onComplete: (profile: StudentProfile) => void
  onSkip?: () => void
  existingProfile?: Partial<StudentProfile>
}

export function StudentDiscoveryQuiz({ 
  onComplete, 
  onSkip,
  existingProfile 
}: StudentDiscoveryQuizProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [isCompleting, setIsCompleting] = useState(false)

  const skillCategories: SkillCategory[] = [
    {
      name: 'Programming',
      icon: Code,
      color: 'bg-blue-100 text-blue-600',
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C++', 'HTML/CSS', 'TypeScript', 'PHP', 'Ruby']
    },
    {
      name: 'Design',
      icon: Palette,
      color: 'bg-purple-100 text-purple-600',
      skills: ['UI/UX Design', 'Graphic Design', 'Figma', 'Adobe Creative Suite', 'Prototyping', 'Web Design', 'Branding', 'Illustration']
    },
    {
      name: 'Business',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
      skills: ['Marketing', 'Sales', 'Project Management', 'Business Analysis', 'Strategy', 'Finance', 'Operations', 'Consulting']
    },
    {
      name: 'Data & Analytics',
      icon: Target,
      color: 'bg-orange-100 text-orange-600',
      skills: ['Data Analysis', 'SQL', 'Excel', 'Tableau', 'Power BI', 'Statistics', 'Machine Learning', 'Data Visualization']
    },
    {
      name: 'Communication',
      icon: Users,
      color: 'bg-pink-100 text-pink-600',
      skills: ['Content Writing', 'Social Media', 'Public Speaking', 'Copywriting', 'Technical Writing', 'Translation', 'Video Editing']
    },
    {
      name: 'Research',
      icon: BookOpen,
      color: 'bg-indigo-100 text-indigo-600',
      skills: ['Market Research', 'Academic Research', 'User Research', 'Competitive Analysis', 'Survey Design', 'Data Collection']
    }
  ]

  const questions: QuizQuestion[] = [
    {
      id: 'welcome',
      type: 'multiple_choice',
      category: 'experience',
      title: 'Welcome to your career discovery journey! 🚀',
      description: 'This quick quiz will help us understand your skills and interests to match you with perfect internship opportunities.',
      options: ['Let\'s get started!'],
      required: true
    },
    {
      id: 'experience_level',
      type: 'multiple_choice',
      category: 'experience',
      title: 'What\'s your current experience level?',
      description: 'This helps us recommend projects that match your background.',
      options: [
        'High School Student - Just starting out',
        'University Freshman/Sophomore - Building foundations',
        'University Junior/Senior - Ready for challenges',
        'Recent Graduate - Seeking real-world experience',
        'Career Changer - New field, existing skills'
      ],
      required: true
    },
    {
      id: 'skills_selection',
      type: 'skills_selection',
      category: 'skills',
      title: 'What skills do you have or want to develop?',
      description: 'Select all that apply. Don\'t worry if you\'re just starting - we have projects for all levels!',
      skillCategories,
      required: true
    },
    {
      id: 'interests',
      type: 'multi_select',
      category: 'interests',
      title: 'What industries or fields interest you most?',
      description: 'We\'ll prioritize projects in these areas for you.',
      options: [
        'Technology & Software',
        'Healthcare & Biotech',
        'Finance & Fintech',
        'Education & EdTech',
        'Sustainability & Environment',
        'E-commerce & Retail',
        'Media & Entertainment',
        'Non-profit & Social Impact',
        'Gaming & Interactive Media',
        'Travel & Hospitality',
        'Food & Agriculture',
        'Fashion & Lifestyle'
      ],
      required: true
    },
    {
      id: 'project_duration',
      type: 'multiple_choice',
      category: 'preferences',
      title: 'What project duration works best for you?',
      description: 'Consider your schedule and availability.',
      options: [
        '1-2 months - Short and focused',
        '3-4 months - Standard internship length',
        '5-6 months - Extended learning opportunity',
        'Flexible - I can adapt to project needs'
      ],
      required: true
    },
    {
      id: 'team_size',
      type: 'multiple_choice',
      category: 'preferences',
      title: 'What team environment do you prefer?',
      options: [
        'Solo projects - Independent work',
        'Small teams (2-3 people) - Close collaboration',
        'Medium teams (4-6 people) - Balanced dynamics',
        'Large teams (7+ people) - Diverse perspectives',
        'No preference - I adapt well to any size'
      ],
      required: true
    },
    {
      id: 'work_style',
      type: 'multiple_choice',
      category: 'preferences',
      title: 'How do you work best?',
      options: [
        'Highly structured with clear guidelines',
        'Some structure with room for creativity',
        'Flexible approach with regular check-ins',
        'Very independent with minimal oversight',
        'Collaborative with frequent team interaction'
      ],
      required: true
    },
    {
      id: 'time_commitment',
      type: 'multiple_choice',
      category: 'preferences',
      title: 'How much time can you dedicate per week?',
      description: 'Be realistic about your availability alongside studies.',
      options: [
        '5-10 hours - Part-time alongside studies',
        '15-20 hours - Moderate commitment',
        '25-30 hours - Substantial involvement',
        '35+ hours - Full-time internship',
        'Flexible - Depends on the project'
      ],
      required: true
    },
    {
      id: 'career_goals',
      type: 'multi_select',
      category: 'goals',
      title: 'What are your main career goals?',
      description: 'Select up to 3 primary objectives.',
      options: [
        'Build technical skills in my field',
        'Gain real-world work experience',
        'Explore different career paths',
        'Build professional network',
        'Create portfolio projects',
        'Earn recommendations/references',
        'Learn about entrepreneurship',
        'Develop leadership skills',
        'Contribute to meaningful projects',
        'Prepare for full-time roles'
      ],
      required: true
    },
    {
      id: 'learning_goals',
      type: 'multi_select',
      category: 'goals',
      title: 'What do you most want to learn?',
      description: 'We\'ll match you with projects that offer these learning opportunities.',
      options: [
        'Industry best practices',
        'Project management',
        'Client communication',
        'Cross-functional collaboration',
        'Problem-solving methodologies',
        'Professional software tools',
        'Presentation and communication',
        'Data analysis and insights',
        'Creative thinking and innovation',
        'Business strategy and planning'
      ],
      required: true
    }
  ]

  const getCurrentQuestion = () => questions[currentStep]
  const isLastStep = currentStep === questions.length - 1

  const handleAnswer = (value: string | string[] | number) => {
    const questionId = getCurrentQuestion().id
    const existingIndex = answers.findIndex(a => a.questionId === questionId)
    
    if (existingIndex >= 0) {
      const newAnswers = [...answers]
      newAnswers[existingIndex].value = value
      setAnswers(newAnswers)
    } else {
      setAnswers([...answers, { questionId, value }])
    }
  }

  const getAnswerValue = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.value
  }

  const canProceed = () => {
    const currentQuestion = getCurrentQuestion()
    const answer = getAnswerValue(currentQuestion.id)
    
    if (!currentQuestion.required) return true
    if (!answer) return false
    
    if (Array.isArray(answer)) {
      return answer.length > 0
    }
    
    return true
  }

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(Math.max(0, currentStep - 1))
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    
    // Process answers into student profile
    const profile: StudentProfile = {
      skills: [],
      interests: [],
      careerGoals: [],
      workPreferences: {
        projectDuration: '',
        teamSize: '',
        workStyle: '',
        timeCommitment: ''
      },
      experienceLevel: '',
      industries: [],
      learningGoals: []
    }

    answers.forEach(answer => {
      switch (answer.questionId) {
        case 'experience_level':
          profile.experienceLevel = answer.value as string
          break
        case 'skills_selection':
          profile.skills = answer.value as string[]
          break
        case 'interests':
          profile.industries = answer.value as string[]
          break
        case 'project_duration':
          profile.workPreferences.projectDuration = answer.value as string
          break
        case 'team_size':
          profile.workPreferences.teamSize = answer.value as string
          break
        case 'work_style':
          profile.workPreferences.workStyle = answer.value as string
          break
        case 'time_commitment':
          profile.workPreferences.timeCommitment = answer.value as string
          break
        case 'career_goals':
          profile.careerGoals = answer.value as string[]
          break
        case 'learning_goals':
          profile.learningGoals = answer.value as string[]
          break
      }
    })

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    onComplete(profile)
  }

  const renderQuestion = () => {
    const question = getCurrentQuestion()
    const currentAnswer = getAnswerValue(question.id)

    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            {question.options?.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  currentAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{option}</span>
                  {currentAnswer === option && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )

      case 'multi_select':
        const selectedOptions = (currentAnswer as string[]) || []
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const isSelected = selectedOptions.includes(option)
              return (
                <motion.button
                  key={index}
                  onClick={() => {
                    if (isSelected) {
                      handleAnswer(selectedOptions.filter(o => o !== option))
                    } else {
                      handleAnswer([...selectedOptions, option])
                    }
                  }}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{option}</span>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </motion.button>
              )
            })}
            <div className="text-sm text-gray-500 mt-2">
              {selectedOptions.length} selected
            </div>
          </div>
        )

      case 'skills_selection':
        const selectedSkills = (currentAnswer as string[]) || []
        return (
          <div className="space-y-6">
            {question.skillCategories?.map((category) => {
              const Icon = category.icon
              return (
                <div key={category.name} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-semibold text-gray-900">{category.name}</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {category.skills.map((skill) => {
                      const isSelected = selectedSkills.includes(skill)
                      return (
                        <button
                          key={skill}
                          onClick={() => {
                            if (isSelected) {
                              handleAnswer(selectedSkills.filter(s => s !== skill))
                            } else {
                              handleAnswer([...selectedSkills, skill])
                            }
                          }}
                          className={`p-3 text-sm rounded-lg border transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          {skill}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              💡 <strong>Tip:</strong> Select skills you have AND skills you want to learn. We'll match you with projects at the right level!
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / questions.length) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {getCurrentQuestion().title}
              </h2>
              {getCurrentQuestion().description && (
                <p className="text-gray-600 text-lg">
                  {getCurrentQuestion().description}
                </p>
              )}
            </div>

            {renderQuestion()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-4">
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Skip for now
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  disabled={!canProceed() || isCompleting}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {isCompleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating your profile...
                    </>
                  ) : isLastStep ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Complete Discovery
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
} 