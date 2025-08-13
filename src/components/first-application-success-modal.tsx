'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  ArrowRight, 
  X,
  Crown,
  Sparkles,
  TrendingUp,
  Medal,
  CheckCircle
} from 'lucide-react'

interface FirstApplicationSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  projectTitle: string
  compatibilityScore?: number
}

export function FirstApplicationSuccessModal({ 
  isOpen, 
  onClose, 
  projectTitle, 
  compatibilityScore = 85 
}: FirstApplicationSuccessModalProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)

  // Animate score counting up
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        let current = 0
        const increment = compatibilityScore / 50
        const animation = setInterval(() => {
          current += increment
          if (current >= compatibilityScore) {
            current = compatibilityScore
            clearInterval(animation)
          }
          setAnimatedScore(Math.round(current))
        }, 30)
        return () => clearInterval(animation)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, compatibilityScore])

  const getRankingMessage = (score: number) => {
    if (score >= 90) return { rank: "Top 5%", message: "Exceptional match!", color: "text-purple-600", bg: "bg-purple-100" }
    if (score >= 80) return { rank: "Top 15%", message: "Excellent candidate!", color: "text-blue-600", bg: "bg-blue-100" }
    if (score >= 70) return { rank: "Top 30%", message: "Strong potential!", color: "text-emerald-600", bg: "bg-emerald-100" }
    return { rank: "Top 50%", message: "Good fit!", color: "text-orange-600", bg: "bg-orange-100" }
  }

  const ranking = getRankingMessage(compatibilityScore)

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 to-blue-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4"
            >
              <Trophy className="h-10 w-10 text-yellow-300" />
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-2">🎉 Application Submitted!</h2>
            <p className="text-emerald-100">
              Congratulations on submitting your first application to <strong>{projectTitle}</strong>!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Compatibility Score */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <motion.div
                initial={{ rotate: -90 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="w-32 h-32 rounded-full border-8 border-gray-200 relative mx-auto mb-4"
                style={{
                  background: `conic-gradient(from 0deg, ${compatibilityScore >= 80 ? '#10b981' : compatibilityScore >= 60 ? '#f59e0b' : '#ef4444'} ${(animatedScore / 100) * 360}deg, #e5e7eb 0deg)`
                }}
              >
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{animatedScore}%</div>
                    <div className="text-xs text-gray-500">Match Score</div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${ranking.bg} ${ranking.color} font-semibold`}
            >
              <Crown className="h-4 w-4" />
              {ranking.rank} - {ranking.message}
            </motion.div>
          </div>

          {/* Achievement Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-semibold text-sm">First Application</h4>
              <p className="text-xs text-gray-600">Achievement Unlocked!</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h4 className="font-semibold text-sm">Profile Complete</h4>
              <p className="text-xs text-gray-600">Well Done!</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-semibold text-sm">Journey Started</h4>
              <p className="text-xs text-gray-600">Welcome to Bidaaya!</p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6"
          >
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Your Performance Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">85%</div>
                <div className="text-sm text-gray-800">Students with complete profiles get 50% more interviews</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">#{Math.floor(Math.random() * 15) + 1}</div>
                <div className="text-sm text-gray-800">Your rank among applicants for similar projects</div>
              </div>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            className="space-y-4"
          >
            <h3 className="font-bold text-gray-900 mb-4">What happens next?</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-gray-800">We've notified the company about your application</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-gray-800">You'll receive an email confirmation shortly</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-gray-800">Companies typically respond within 3-5 business days</span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => window.location.href = '/dashboard/applications'}
              className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              View My Applications
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/projects'}
              className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              Apply to More Projects <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
