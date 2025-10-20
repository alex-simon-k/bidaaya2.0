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
    question: "Welcome to Bidaaya! I'm excited to help you discover amazing opportunities. Let's start with the basics - what's your full name?",
    type: 'text',
    required: true,
    placeholder: 'Enter your full name',
    validation: (value) => value.length >= 2 || 'Please enter your full name'
  },
  {
    id: 'dateOfBirth',
    field: 'dateOfBirth',
    question: "Great to meet you, {name}! When is your date of birth?",
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
    question: "Perfect! Now, what's your current education status?",
    type: 'multipleChoice',
    required: true,
    options: [
      '🎒 High School',
      '🌟 Gap Year',
      '🎓 University',
      '👔 Graduated'
    ]
  },
  {
    id: 'mena',
    field: 'mena',
    question: "Thanks! How frequently are you in the MENA region?",
    type: 'multipleChoice',
    required: true,
    options: [
      '🏠 I live there',
      '✈️ I go back for holidays',
      '📚 I study abroad and go back as much as possible',
      '🌍 No, I don\'t live there. I\'m a tourist.'
    ]
  },
  {
    id: 'whatsapp',
    field: 'whatsapp',
    question: "Almost done with the basics! What's your WhatsApp number? This helps companies verify and reach you faster. 📱",
    type: 'phone',
    required: false,
    placeholder: '+1234567890',
    hint: '📊 Students who provide contact details receive 50% more interview opportunities'
  },
  {
    id: 'linkedin',
    field: 'linkedin',
    question: "Do you have a LinkedIn profile you'd like to share? It really helps boost your profile!",
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
    question: "Before we continue, please confirm you've read and agree to our Terms & Conditions.",
    type: 'terms',
    required: true,
    options: [
      '✅ I agree to the Terms & Conditions',
      '❌ I need to read them first'
    ]
  }
]

interface StructuredOnboardingChatProps {
  onComplete: () => void
}

export function StructuredOnboardingChat({ onComplete }: StructuredOnboardingChatProps) {
  const { data: session, update } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [textInput, setTextInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === ONBOARDING_QUESTIONS.length - 1
  const progress = ((currentQuestionIndex + 1) / ONBOARDING_QUESTIONS.length) * 100

  // Initial agent message
  useEffect(() => {
    setTimeout(() => {
      askCurrentQuestion()
    }, 500)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const addMessage = (type: 'agent' | 'user', content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const askCurrentQuestion = () => {
    if (!currentQuestion) return
    
    setIsThinking(true)
    setTimeout(() => {
      setIsThinking(false)
      // Replace {name} placeholder with actual name
      let questionText = currentQuestion.question
      if (answers.name) {
        questionText = questionText.replace('{name}', answers.name.split(' ')[0])
      }
      addMessage('agent', questionText)
      
      // Show hint if available
      if (currentQuestion.hint) {
        setTimeout(() => {
          addMessage('agent', currentQuestion.hint)
        }, 1000)
      }
    }, 800)
  }

  const handleMultipleChoiceAnswer = async (option: string) => {
    setError(null)
    
    // Handle "read terms first" option
    if (currentQuestion.id === 'terms' && option.includes('need to read')) {
      window.open('/terms', '_blank')
      setTimeout(() => {
        addMessage('agent', "Take your time reading the terms. Click the agree button when you're ready!")
      }, 1000)
      return
    }

    // Add user message
    addMessage('user', option)
    
    // Store answer
    const newAnswers = { ...answers, [currentQuestion.field]: option }
    setAnswers(newAnswers)

    // Move to next question or complete
    if (isLastQuestion) {
      await submitOnboarding(newAnswers)
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1)
      }, 500)
    }
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return

    setError(null)

    // Validate if validator exists
    if (currentQuestion.validation) {
      const validationResult = currentQuestion.validation(textInput)
      if (validationResult !== true) {
        setError(validationResult as string)
        return
      }
    }

    // Add user message
    addMessage('user', textInput)

    // Store answer
    const newAnswers = { ...answers, [currentQuestion.field]: textInput }
    setAnswers(newAnswers)
    setTextInput('')

    // Move to next question or complete
    if (isLastQuestion) {
      await submitOnboarding(newAnswers)
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1)
      }, 500)
    }
  }

  const submitOnboarding = async (finalAnswers: Record<string, string>) => {
    setIsSubmitting(true)
    setIsThinking(true)

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

      // Show success message
      setIsThinking(false)
      addMessage('agent', "Awesome! Now let's build your profile so I can find the perfect opportunities for you. 🚀")

      // Complete onboarding after delay
      setTimeout(() => {
        onComplete()
      }, 2000)

    } catch (err) {
      setIsThinking(false)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Watch for question changes
  useEffect(() => {
    if (currentQuestionIndex > 0 && currentQuestion) {
      askCurrentQuestion()
    }
  }, [currentQuestionIndex])

  return (
    <div className="flex flex-col h-screen w-full bg-bidaaya-dark">
      {/* Progress Bar */}
      <div className="bg-bidaaya-dark-lighter px-6 py-4 border-b border-bidaaya-light/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-bidaaya-light/60 text-sm">Setup Progress</span>
          <span className="text-bidaaya-light font-semibold">{currentQuestionIndex + 1}/{ONBOARDING_QUESTIONS.length}</span>
        </div>
        <div className="w-full bg-bidaaya-light/10 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="bg-bidaaya-accent rounded-full h-2"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-bidaaya-accent text-white' : 'bg-bidaaya-dark-lighter text-bidaaya-light'} rounded-2xl px-6 py-4 shadow-lg`}>
                <p className="text-lg leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-bidaaya-dark-lighter rounded-2xl px-6 py-4 shadow-lg">
              <div className="flex space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                  className="w-2 h-2 bg-bidaaya-accent rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                  className="w-2 h-2 bg-bidaaya-accent rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                  className="w-2 h-2 bg-bidaaya-accent rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {currentQuestion && !isSubmitting && (
        <div className="bg-bidaaya-dark-lighter px-6 py-6 border-t border-bidaaya-light/10">
          {/* Multiple Choice Options */}
          {(currentQuestion.type === 'multipleChoice' || currentQuestion.type === 'terms') && (
            <div className="grid gap-3">
              {currentQuestion.options?.map((option) => (
                <motion.button
                  key={option}
                  onClick={() => handleMultipleChoiceAnswer(option)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 bg-bidaaya-dark hover:bg-bidaaya-accent/20 border-2 border-bidaaya-light/10 hover:border-bidaaya-accent rounded-xl text-bidaaya-light font-medium text-lg transition-all duration-200 text-left"
                >
                  {option}
                </motion.button>
              ))}
              {currentQuestion.type === 'terms' && (
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-bidaaya-light/60 hover:text-bidaaya-accent text-sm mt-2 transition-colors"
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
                  className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}
              <div className="flex gap-3">
                <input
                  type={currentQuestion.type === 'date' ? 'date' : currentQuestion.type === 'phone' ? 'tel' : currentQuestion.type === 'url' ? 'url' : 'text'}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                  placeholder={currentQuestion.placeholder}
                  className="flex-1 bg-bidaaya-dark border-2 border-bidaaya-light/10 focus:border-bidaaya-accent rounded-xl px-6 py-4 text-bidaaya-light placeholder-bidaaya-light/40 text-lg outline-none transition-colors"
                />
                <motion.button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-bidaaya-accent hover:bg-bidaaya-accent/80 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl px-6 py-4 text-white font-semibold transition-all duration-200 flex items-center gap-2"
                >
                  {currentQuestion.required ? (
                    <Send className="h-5 w-5" />
                  ) : (
                    <>
                      Skip <span className="text-sm">(Optional)</span>
                    </>
                  )}
                </motion.button>
              </div>
              {!currentQuestion.required && (
                <button
                  onClick={() => {
                    addMessage('user', 'Skip')
                    setTimeout(() => {
                      setCurrentQuestionIndex(prev => prev + 1)
                    }, 500)
                  }}
                  className="text-bidaaya-light/60 hover:text-bidaaya-light text-sm transition-colors"
                >
                  Skip this question →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submitting State */}
      {isSubmitting && (
        <div className="bg-bidaaya-dark-lighter px-6 py-8 border-t border-bidaaya-light/10">
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-bidaaya-accent border-t-transparent rounded-full"
            />
            <p className="text-bidaaya-light">Saving your profile...</p>
          </div>
        </div>
      )}
    </div>
  )
}

