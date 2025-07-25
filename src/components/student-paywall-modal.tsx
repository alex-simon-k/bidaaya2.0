'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Crown, 
  Rocket, 
  FileText, 
  Target, 
  Star, 
  CheckCircle,
  ArrowRight,
  Zap,
  Trophy
} from 'lucide-react'
import { UpgradePromptConfig } from '@/lib/application-limits'

interface StudentPaywallModalProps {
  isOpen: boolean
  onClose: () => void
  promptConfig: UpgradePromptConfig
  trigger?: 'application_limit' | 'file_upload' | 'external_tracking'
}

export function StudentPaywallModal({ 
  isOpen, 
  onClose, 
  promptConfig,
  trigger = 'application_limit'
}: StudentPaywallModalProps) {
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(false)

  const handleUpgrade = async () => {
    setIsAnimating(true)
    // Add slight delay for better UX
    setTimeout(() => {
      router.push('/pricing?source=student_modal&trigger=' + trigger)
    }, 300)
  }

  const getTriggerIcon = () => {
    switch (trigger) {
      case 'file_upload':
        return <FileText className="h-8 w-8 text-purple-600" />
      case 'external_tracking':
        return <Target className="h-8 w-8 text-blue-600" />
      default:
        return <Rocket className="h-8 w-8 text-orange-600" />
    }
  }

  const getTriggerColor = () => {
    switch (trigger) {
      case 'file_upload':
        return 'from-purple-600 to-pink-600'
      case 'external_tracking':
        return 'from-blue-600 to-indigo-600'
      default:
        return 'from-orange-500 to-red-500'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header with gradient */}
            <div className={`relative px-8 py-12 bg-gradient-to-br ${getTriggerColor()} text-white text-center`}>
          <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
          >
                <X className="h-6 w-6" />
          </button>

            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-4"
            >
                {getTriggerIcon()}
            </motion.div>
            
              <h2 className="text-2xl font-bold mb-2">{promptConfig.title}</h2>
              <p className="text-white/90 text-lg">{promptConfig.description}</p>

              {promptConfig.urgency && (
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                  <Zap className="h-4 w-4" />
                  {promptConfig.urgency}
                </div>
              )}
          </div>

            {/* Content */}
            <div className="px-8 py-8">
              {/* Benefits List */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Unlock Premium Features
                </h3>
                
                {promptConfig.benefits.map((benefit, index) => (
          <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
          </motion.div>
                ))}
              </div>

              {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">4.9/5 from 2,847 students</span>
                </div>
                <p className="text-gray-700 text-sm italic">
                  "Upgrading to Premium helped me land 3 project interviews in my first week! 
                  The file uploads made all the difference." - Sarah M.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-gray-600">94% of Premium users get accepted to projects</span>
                </div>
            </motion.div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  onClick={handleUpgrade}
                  disabled={isAnimating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full ${getTriggerColor()} bg-gradient-to-r text-white font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  {isAnimating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Crown className="h-5 w-5" />
                      {promptConfig.ctaText}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </motion.button>
                
                <button
                  onClick={onClose}
                  className="w-full text-gray-600 font-medium py-3 px-6 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
              </div>

              {/* Fine print */}
              <p className="text-xs text-gray-500 text-center mt-4">
                ✨ Start your 7-day free trial • Cancel anytime • No hidden fees
              </p>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 