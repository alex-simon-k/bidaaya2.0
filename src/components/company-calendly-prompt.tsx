'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, ArrowRight, X, Users, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CompanyCalendlyPromptProps {
  companyName: string
  onClose: () => void
}

export default function CompanyCalendlyPrompt({ 
  companyName, 
  onClose
}: CompanyCalendlyPromptProps) {
  const router = useRouter()
  const [isBookingStarted, setIsBookingStarted] = useState(false)
  const [showContinueButton, setShowContinueButton] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calendlyWindow, setCalendlyWindow] = useState<Window | null>(null)
  const calendlyUrl = 'https://calendly.com/alex-simon-bidaaya/interview'

  const handleBookCall = () => {
    setIsBookingStarted(true)
    setError(null) // Clear any previous errors
    
    // Create Calendly URL with better parameters for embedding
    const calendlyParams = new URLSearchParams({
      embed_domain: window.location.hostname,
      embed_type: 'PopupWidget',
      utm_source: 'bidaaya_dashboard',
      utm_medium: 'company_onboarding'
    })
    const fullCalendlyUrl = `${calendlyUrl}?${calendlyParams.toString()}`
    
    console.log('🗓️ Opening Calendly window:', fullCalendlyUrl)
    
    // Try to open Calendly
    let newCalendlyWindow: Window | null = null
    try {
      newCalendlyWindow = window.open(
        fullCalendlyUrl, 
        'calendly_booking',
        'width=900,height=750,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
      )
    } catch (error) {
      console.error('Failed to open Calendly window:', error)
    }
    
    // Check if window opened successfully
    if (!newCalendlyWindow || newCalendlyWindow.closed) {
      console.log('❌ Calendly popup was blocked')
      setIsBookingStarted(false)
      setError('Popup blocked! Please allow popups for this site and try again, or you can visit Calendly directly.')
      return
    }
    
    console.log('✅ Calendly opened successfully - showing continue option')
    
    // Focus the new window
    newCalendlyWindow.focus()
    
    // Store the window reference for monitoring
    setCalendlyWindow(newCalendlyWindow)
    
    // Show continue button after a short delay
    setTimeout(() => {
      setShowContinueButton(true)
      setIsBookingStarted(false)
    }, 2000)
  }

  const handleContinueToDashboard = () => {
    // Close Calendly window if still open
    if (calendlyWindow && !calendlyWindow.closed) {
      calendlyWindow.close()
    }
    
    // Close the popup
    onClose()
  }

  const handleSkip = () => {
    // Close Calendly window if still open
    if (calendlyWindow && !calendlyWindow.closed) {
      calendlyWindow.close()
    }
    
    // Close the popup
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-12 text-center text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6"
          >
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-lg">
              <Calendar className="text-white h-8 w-8" />
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-3xl font-bold mb-3"
          >
            {showContinueButton ? 'Ready to Get Started!' : `Welcome to Bidaaya, ${companyName}! 🎉`}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-purple-100 text-lg leading-relaxed"
          >
            {showContinueButton 
              ? 'Thanks for booking your onboarding call! You can now continue to your dashboard.'
              : 'Would you like to schedule a quick onboarding call to help you get the most out of our platform?'
            }
          </motion.p>
        </div>

        {/* Content */}
        <div className="px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {/* Show continue button after booking started */}
            {showContinueButton ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="text-white h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Calendly Opened Successfully!</h3>
                      <p className="text-sm text-green-600">Complete your booking in the other tab, then continue here.</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleContinueToDashboard}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg shadow-purple-200 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Continue to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </div>
            ) : (
              /* Initial Booking Interface */
              <>
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                    Schedule Your Onboarding Call
                  </h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="text-white h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-blue-800 text-sm"><strong>Optional but recommended!</strong> Get personalized guidance on using Bidaaya effectively.</p>
                        <p className="text-blue-600 text-sm mt-1">Only 15 minutes to maximize your success on the platform.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
                        <Users className="text-white h-6 w-6" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">Platform Walkthrough</h4>
                      <p className="text-sm text-gray-600">Get a personalized tour of all features</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
                        <Calendar className="text-white h-6 w-6" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">Strategy Session</h4>
                      <p className="text-sm text-gray-600">Discuss your hiring goals and timeline</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
                        <Clock className="text-white h-6 w-6" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">Quick Setup</h4>
                      <p className="text-sm text-gray-600">Only 15 minutes to maximize your success</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="text-white h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-800 mb-2">What we'll cover:</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          <li>• How to post your first opportunity</li>
                          <li>• Best practices for attracting top talent</li>
                          <li>• Understanding our matching algorithm</li>
                          <li>• Q&A about your specific needs</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="text-white h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-red-800 text-sm mb-2">{error}</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => {
                              setError(null)
                              handleBookCall()
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                          >
                            Try Again
                          </button>
                          <a 
                            href={calendlyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors text-center"
                          >
                            Open Calendly Directly
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <motion.button
                    onClick={handleBookCall}
                    disabled={isBookingStarted}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg shadow-purple-200 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {isBookingStarted ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Calendar className="h-5 w-5" />
                        Schedule Onboarding Call
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={handleSkip}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Skip for Now
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  )
} 