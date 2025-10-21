'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Check, ExternalLink } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  type: 'agent' | 'user'
  content: string
  timestamp: Date
}

interface OnboardingQuestion {
  id: string
  field: string
  question: string
  type: 'text' | 'date' | 'multipleChoice' | 'phone' | 'url' | 'terms'
  options?: string[]
  required: boolean
  validation?: (value: string) => boolean | string
  placeholder?: string
  hint?: string
}

const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'name',
    field: 'name',
    question: "What's your full name?",
    type: 'text',
    required: true,
    placeholder: 'Enter your full name',
    validation: (value) => value.length >= 2 || 'Please enter your full name'
  },
  {
    id: 'dateOfBirth',
    field: 'dateOfBirth',
    question: "What's your date of birth?",
    type: 'date',
    required: true,
    validation: (value) => {
      const date = new Date(value)
      const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      return age >= 16 || 'You must be at least 16 years old'
    }
  },
  {
    id: 'educationStatus',
    field: 'educationStatus',
    question: "What's your current education status?",
    type: 'multipleChoice',
    required: true,
    options: [
      'High School',
      'Gap Year',
      'University',
      'Graduated'
    ]
  },
  {
    id: 'mena',
    field: 'mena',
    question: "How frequently are you in MENA?",
    type: 'multipleChoice',
    required: true,
    options: [
      'I live there',
      'I go back for holidays',
      'I study abroad and go back as much as possible',
      'No, I don\'t live there'
    ]
  },
  {
    id: 'whatsapp',
    field: 'whatsapp',
    question: "WhatsApp number (optional)",
    type: 'phone',
    required: false,
    placeholder: '+1234567890',
    hint: 'Helps companies contact you faster'
  },
  {
    id: 'linkedin',
    field: 'linkedin',
    question: "LinkedIn URL (optional)",
    type: 'url',
    required: false,
    placeholder: 'https://linkedin.com/in/yourprofile',
    validation: (value) => {
      if (!value) return true // Optional
      try {
        new URL(value)
        return true
      } catch {
        return 'Please enter a valid URL'
      }
    }
  },
  {
    id: 'terms',
    field: 'terms',
    question: "Please agree to our Terms & Conditions",
    type: 'terms',
    required: true,
    options: [
      'I agree to the Terms & Conditions',
      'I need to read them first'
    ]
  }
]

interface StructuredOnboardingChatProps {
  onComplete: () => void
}

export function StructuredOnboardingChat({ onComplete }: StructuredOnboardingChatProps) {
  const { data: session, update } = useSession()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [textInput, setTextInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === ONBOARDING_QUESTIONS.length - 1
  const progress = ((currentQuestionIndex + 1) / ONBOARDING_QUESTIONS.length) * 100

  const handleMultipleChoiceAnswer = async (option: string) => {
    setError(null)
    
    // Handle "read terms first" option
    if (currentQuestion.id === 'terms' && option.includes('need to read')) {
      window.open('/terms', '_blank')
      return
    }

    // Store answer
    const newAnswers = { ...answers, [currentQuestion.field]: option }
    setAnswers(newAnswers)

    // Move to next question or complete
    if (isLastQuestion) {
      await submitOnboarding(newAnswers)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleTextSubmit = async () => {
    // Allow submit if optional or if there's text
    if (!textInput.trim() && currentQuestion.required) return

    setError(null)

    // Validate if validator exists and there's input
    if (textInput.trim() && currentQuestion.validation) {
      const validationResult = currentQuestion.validation(textInput)
      if (validationResult !== true) {
        setError(validationResult as string)
        return
      }
    }

    // Store answer (or skip if empty and optional)
    const newAnswers = { ...answers, [currentQuestion.field]: textInput }
    setAnswers(newAnswers)
    setTextInput('')

    // Move to next question or complete
    if (isLastQuestion) {
      await submitOnboarding(newAnswers)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const submitOnboarding = async (finalAnswers: Record<string, string>) => {
    setIsSubmitting(true)

    try {
      // Submit to API
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...finalAnswers,
          email: session?.user?.email,
          onboardingPhase: 'cv_building',
          terms: finalAnswers.terms?.includes('agree') ? true : false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      // Update session
      await update({ onboardingPhase: 'cv_building' })

      // Complete onboarding after short delay
      setTimeout(() => {
        onComplete()
      }, 1000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Progress Bar */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-semibold text-xl">Welcome to Bidaaya!</h2>
            <p className="text-emerald-50 text-sm">Let's get you set up</p>
          </div>
          <div className="text-right">
            <p className="text-white font-semibold text-lg">{currentQuestionIndex + 1}/{ONBOARDING_QUESTIONS.length}</p>
            <p className="text-emerald-50 text-xs">Questions</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-full h-2"
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                {currentQuestion.question}
              </h3>
              {currentQuestion.hint && (
                <p className="text-sm text-gray-500 mb-4">{currentQuestion.hint}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {currentQuestion && !isSubmitting && (
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          {/* Multiple Choice Options */}
          {(currentQuestion.type === 'multipleChoice' || currentQuestion.type === 'terms') && (
            <div className="grid gap-3">
              {currentQuestion.options?.map((option) => (
                <motion.button
                  key={option}
                  onClick={() => handleMultipleChoiceAnswer(option)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 bg-white hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-500 rounded-xl text-gray-700 hover:text-emerald-700 font-medium text-lg transition-all duration-200 text-left shadow-sm"
                >
                  {option}
                </motion.button>
              ))}
              {currentQuestion.type === 'terms' && (
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-gray-600 hover:text-emerald-600 text-sm mt-2 transition-colors"
                >
                  Read Terms & Conditions <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          {/* Text/Date/Phone/URL Input */}
          {(currentQuestion.type === 'text' || currentQuestion.type === 'date' || currentQuestion.type === 'phone' || currentQuestion.type === 'url') && (
            <div className="space-y-3">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg px-4 py-2"
                >
                  <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
              )}
              <div className="flex gap-3">
                <input
                  type={currentQuestion.type === 'date' ? 'date' : currentQuestion.type === 'phone' ? 'tel' : currentQuestion.type === 'url' ? 'url' : 'text'}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                  placeholder={currentQuestion.placeholder}
                  className="flex-1 bg-white border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-6 py-4 text-gray-800 placeholder-gray-400 text-lg outline-none transition-colors"
                />
                <motion.button
                  onClick={handleTextSubmit}
                  disabled={(!textInput.trim() && currentQuestion.required)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl px-8 py-4 text-white font-semibold transition-all duration-200 flex items-center gap-2 shadow-md"
                >
                  {currentQuestion.required ? (
                    'Next'
                  ) : (
                    textInput.trim() ? 'Next' : 'Skip'
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submitting State */}
      {isSubmitting && (
        <div className="bg-gray-50 px-8 py-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full"
            />
            <p className="text-gray-700">Saving your profile...</p>
          </div>
        </div>
      )}
    </div>
  )
}

