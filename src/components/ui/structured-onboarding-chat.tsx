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
      return age >= 12 || 'You must be at least 12 years old'
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
    question: "Do you agree to our Terms & Conditions?",
    type: 'terms',
    required: true,
    options: [
      'I agree to the Terms & Conditions'
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
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h2 className="text-gray-800 font-semibold text-lg">Bidaaya Assistant</h2>
                <p className="text-gray-500 text-xs">Question {currentQuestionIndex + 1} of {ONBOARDING_QUESTIONS.length}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 font-medium">{Math.round(progress)}%</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full h-1.5"
            />
          </div>
        </div>
      </div>

      {/* Question Content - Chat Style */}
      <div className="flex-1 overflow-y-auto px-6 py-12 flex items-center">
        <div className="max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* AI Question Bubble */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm shadow-md border border-gray-200 px-6 py-5 max-w-xl">
                    <p className="text-gray-800 font-medium text-lg leading-relaxed">
                      {currentQuestion.question}
                    </p>
                    {currentQuestion.hint && (
                      <p className="text-sm text-gray-500 mt-2">{currentQuestion.hint}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Chat Style */}
      {currentQuestion && !isSubmitting && (
        <div className="bg-white border-t border-gray-200 px-6 py-6">
          <div className="max-w-2xl mx-auto">
            {/* Multiple Choice Options */}
            {(currentQuestion.type === 'multipleChoice' || currentQuestion.type === 'terms') && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <motion.button
                    key={option}
                    onClick={() => handleMultipleChoiceAnswer(option)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 px-5 bg-white hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-500 rounded-xl text-gray-700 hover:text-emerald-700 font-medium text-base transition-all duration-200 text-left shadow-sm"
                  >
                    {option}
                  </motion.button>
                ))}
                {currentQuestion.type === 'terms' && (
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-gray-600 hover:text-emerald-600 text-sm mt-3 transition-colors"
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
                    className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5"
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
                    autoFocus
                    className="flex-1 bg-white border-2 border-gray-300 focus:border-emerald-500 rounded-xl px-5 py-3.5 text-gray-800 placeholder-gray-400 text-base outline-none transition-colors shadow-sm"
                  />
                  <motion.button
                    onClick={handleTextSubmit}
                    disabled={(!textInput.trim() && currentQuestion.required)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl px-7 py-3.5 text-white font-semibold transition-all duration-200 shadow-md"
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
        </div>
      )}

      {/* Submitting State */}
      {isSubmitting && (
        <div className="bg-white border-t border-gray-200 px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full"
              />
              <p className="text-gray-700 font-medium">Saving your profile...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

