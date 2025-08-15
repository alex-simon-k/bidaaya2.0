'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Sparkles, 
  Target, 
  TrendingUp,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { StudentDiscoveryQuiz } from '@/components/student-discovery-quiz'
import type { StudentProfile } from '@/lib/project-matching'
import { AnalyticsTracker } from '@/lib/analytics-tracker'

export default function DiscoveryQuizPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState<StudentProfile | null>(null)
  const [isRetaking, setIsRetaking] = useState(false)

  // Redirect non-students
  if (session?.user?.role !== 'STUDENT') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Students Only</h2>
          <p className="text-gray-600 mb-4">
            The Discovery Quiz is designed specifically for students to find matching internship opportunities.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleQuizComplete = async (profile: StudentProfile) => {
    try {
      // Save the profile to the user's account
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discoveryProfile: profile,
          discoveryCompleted: true
        })
      })

      if (response.ok) {
        setQuizResults(profile)
        setIsCompleted(true)
        console.log('✅ Discovery quiz profile saved successfully')
        
        // Track discovery quiz completion
        if (session?.user?.id) {
          await AnalyticsTracker.trackDiscoveryQuizCompleted(session.user.id)
        }
      } else {
        throw new Error('Failed to save profile')
      }
    } catch (error) {
      console.error('❌ Error saving discovery quiz results:', error)
      alert('Failed to save your quiz results. Please try again.')
    }
  }

  const handleRetakeQuiz = () => {
    setIsCompleted(false)
    setQuizResults(null)
    setIsRetaking(true)
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  if (isCompleted && quizResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleBackToDashboard}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Discovery Quiz Complete! 🎉</h1>
              <p className="text-gray-600">Your personalized profile has been created</p>
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Your Skills</h3>
                  <p className="text-sm text-gray-600">{quizResults.skills.length} skills identified</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {quizResults.skills.slice(0, 8).map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
                {quizResults.skills.length > 8 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    +{quizResults.skills.length - 8} more
                  </span>
                )}
              </div>
            </motion.div>

            {/* Industries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Industry Interests</h3>
                  <p className="text-sm text-gray-600">{quizResults.industries.length} industries selected</p>
                </div>
              </div>
              <div className="space-y-2">
                {quizResults.industries.map((industry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">{industry}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Career Goals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Career Goals</h3>
                  <p className="text-sm text-gray-600">Your main objectives</p>
                </div>
              </div>
              <div className="space-y-2">
                {quizResults.careerGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-700">{goal}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Work Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Work Preferences</h3>
                  <p className="text-sm text-gray-600">Your ideal work environment</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Duration:</span>
                  <span className="ml-2 text-gray-700">{quizResults.workPreferences.projectDuration}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Team Size:</span>
                  <span className="ml-2 text-gray-700">{quizResults.workPreferences.teamSize}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Time Commitment:</span>
                  <span className="ml-2 text-gray-700">{quizResults.workPreferences.timeCommitment}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Work Style:</span>
                  <span className="ml-2 text-gray-700">{quizResults.workPreferences.workStyle}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleBackToDashboard}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                View Recommended Projects
              </span>
            </button>
            
            <button
              onClick={handleRetakeQuiz}
              className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Retake Quiz
              </span>
            </button>
          </div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border"
          >
            <h3 className="font-semibold text-gray-900 mb-3">🚀 What's Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xs">1</span>
                </div>
                <span className="text-gray-700">Browse projects matched to your profile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-xs">2</span>
                </div>
                <span className="text-gray-700">Apply to projects that interest you</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-xs">3</span>
                </div>
                <span className="text-gray-700">Connect with companies for interviews</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={handleBackToDashboard}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Career Discovery Quiz</h1>
            <p className="text-sm text-gray-600">Help us understand your goals and preferences</p>
          </div>
        </div>
      </div>

      {/* Quiz Component */}
      <StudentDiscoveryQuiz 
        onComplete={handleQuizComplete}
        onSkip={handleBackToDashboard}
      />
    </div>
  )
} 