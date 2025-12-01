"use client"

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface Question {
  id: string
  question: string
  category: string
  relevantFor: string[]
  placeholder: string
}

interface CVEnhancementModalProps {
  isOpen: boolean
  onClose: () => void
  opportunityId: string
  opportunityTitle: string
  opportunityDescription: string
  opportunityCategory?: string
  onComplete: (answers: any[]) => void // Called when user submits answers
}

export function CVEnhancementModal({
  isOpen,
  onClose,
  opportunityId,
  opportunityTitle,
  opportunityDescription,
  opportunityCategory,
  onComplete,
}: CVEnhancementModalProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0 = intro, 1-5 = questions, 6 = complete

  // Fetch questions when modal opens
  useEffect(() => {
    if (isOpen && questions.length === 0) {
      fetchQuestions()
    }
  }, [isOpen])

  const fetchQuestions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cv/enhancement-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          opportunityTitle,
          opportunityDescription,
          opportunityCategory,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      } else {
        const errorData = await response.json()
        
        // If Phase II is incomplete, redirect to CV builder
        if (errorData.code === 'PHASE_2_INCOMPLETE') {
          alert('Please complete your CV profile (Phase II) before generating custom CVs')
          window.location.href = '/dashboard?cv_edit=true'
        } else {
          console.error('Error fetching questions:', errorData.error)
        }
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (currentStep === 0) {
      // Skip entire flow
      onClose()
    } else {
      handleNext()
    }
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      // Prepare answers for saving
      const answersArray = questions
        .filter(q => answers[q.id]?.trim())
        .map(q => ({
          questionId: q.id,
          question: q.question,
          answer: answers[q.id],
          category: q.category,
          relevantFor: q.relevantFor,
        }))

      // Save to database
      await fetch('/api/cv/save-enhancements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          answers: answersArray,
        }),
      })

      // Notify parent and trigger CV generation
      onComplete(answersArray)
    } catch (error) {
      console.error('Error saving answers:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const currentQuestion = questions[currentStep - 1]
  const progress = questions.length > 0 ? ((currentStep) / (questions.length + 1)) * 100 : 0

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-bidaaya-dark border border-bidaaya-light/20 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-bidaaya-light/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-bidaaya-light">Customize Your CV</h2>
                <p className="text-sm text-bidaaya-light/60 mt-1">{opportunityTitle}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-bidaaya-light/60 hover:text-bidaaya-light hover:bg-bidaaya-light/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-bidaaya-light/10">
              <div
                className="h-full bg-bidaaya-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Content */}
            <div className="p-6 min-h-[400px] flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-bidaaya-accent animate-spin" />
                </div>
              ) : currentStep === 0 ? (
                // Intro screen
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-bidaaya-accent/20 blur-3xl rounded-full" />
                    <FileText className="h-20 w-20 text-bidaaya-accent relative" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-bidaaya-light">Let's Tailor Your CV!</h3>
                    <p className="text-bidaaya-light/70 max-w-md text-sm">
                      Answer a few quick questions to help us create a customized CV that highlights your most relevant experience for this role.
                    </p>
                  </div>
                  <div className="w-full max-w-sm space-y-3">
                    <Button
                      onClick={handleNext}
                      className="w-full bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white h-12 text-base"
                    >
                      Get Started ({questions.length} Questions)
                    </Button>
                    <Button
                      onClick={handleSkip}
                      variant="ghost"
                      className="w-full text-bidaaya-light/60 hover:text-bidaaya-light h-10"
                    >
                      Skip for Now
                    </Button>
                  </div>
                </div>
              ) : currentStep <= questions.length ? (
                // Question screen
                <div className="flex-1 flex flex-col space-y-4">
                  <div>
                    <p className="text-sm text-bidaaya-light/60 mb-2">
                      Question {currentStep} of {questions.length}
                    </p>
                    <h3 className="text-lg font-semibold text-bidaaya-light mb-4">
                      {currentQuestion.question}
                    </h3>
                  </div>

                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) =>
                      setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                    }
                    placeholder={currentQuestion.placeholder}
                    className="flex-1 w-full p-4 bg-bidaaya-light/5 border border-bidaaya-light/20 rounded-lg text-bidaaya-light placeholder:text-bidaaya-light/40 focus:outline-none focus:ring-2 focus:ring-bidaaya-accent resize-none"
                    rows={8}
                  />

                  <div className="flex justify-between pt-4">
                    <div>
                      {currentStep > 1 && (
                        <Button
                          onClick={handleBack}
                          variant="ghost"
                          className="text-bidaaya-light/60"
                        >
                          Back
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSkip}
                        variant="ghost"
                        className="text-bidaaya-light/60"
                      >
                        Skip
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white"
                        disabled={isSaving}
                      >
                        {currentStep === questions.length ? 'Generate CV' : 'Next'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Generating screen
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-16 w-16 text-bidaaya-accent animate-spin" />
                      <h3 className="text-xl font-bold text-bidaaya-light">Generating Your Custom CV...</h3>
                      <p className="text-bidaaya-light/60">
                        Tailoring your experience for this role
                      </p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-16 w-16 text-green-500" />
                      <h3 className="text-xl font-bold text-bidaaya-light">Ready to Download!</h3>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

