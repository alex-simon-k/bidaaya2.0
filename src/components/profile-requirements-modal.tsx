'use client'

import { useState } from 'react'
import { X, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ProfileRequirement {
  field: string
  label: string
  description: string
  isCompleted: boolean
  examples?: string[]
}

interface ProfileRequirementsModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile?: any
  type: 'profile' | 'application'
}

export function ProfileRequirementsModal({ 
  isOpen, 
  onClose, 
  userProfile,
  type = 'application'
}: ProfileRequirementsModalProps) {
  
  const getRequirements = (): ProfileRequirement[] => {
    if (type === 'application') {
      return [
        {
          field: 'university',
          label: 'University',
          description: 'Your current or most recent university',
          isCompleted: !!userProfile?.university,
          examples: ['Harvard University', 'MIT', 'American University of Sharjah']
        },
        {
          field: 'highSchool',
          label: 'High School',
          description: 'Your high school (if no university)',
          isCompleted: !!userProfile?.highSchool,
          examples: ['Dubai International Academy', 'GEMS Wellington', 'Local High School']
        },
        {
          field: 'major',
          label: 'Major/Field of Study',
          description: 'Your area of academic focus',
          isCompleted: !!userProfile?.major,
          examples: ['Computer Science', 'Business Administration', 'Engineering', 'Marketing']
        },
        {
          field: 'subjects',
          label: 'Subjects/Interests',
          description: 'Your academic subjects or areas of interest',
          isCompleted: !!userProfile?.subjects,
          examples: ['Mathematics, Physics', 'Literature, History', 'Biology, Chemistry']
        }
      ]
    } else {
      // Profile completion requirements
      return [
        {
          field: 'name',
          label: 'Full Name',
          description: 'Your complete name for identification',
          isCompleted: !!userProfile?.name,
          examples: ['Ahmed Ali Mohammed', 'Sarah Johnson']
        },
        {
          field: 'education',
          label: 'Education Status',
          description: 'Your current education level',
          isCompleted: !!userProfile?.education,
          examples: ['High School Student', 'University Student', 'Recent Graduate']
        },
        {
          field: 'terms',
          label: 'Terms & Conditions',
          description: 'Agreement to platform terms',
          isCompleted: !!userProfile?.terms,
          examples: ['✓ Accepted']
        }
      ]
    }
  }

  const requirements = getRequirements()
  const completedCount = requirements.filter(req => req.isCompleted).length
  const totalCount = requirements.length
  
  // For applications, at least ONE education field is required
  const canProceed = type === 'application' 
    ? requirements.some(req => req.isCompleted)
    : requirements.every(req => req.isCompleted)

  const getTitle = () => {
    if (type === 'application') {
      return canProceed ? 'Ready to Apply!' : 'Complete Your Education Profile'
    } else {
      return canProceed ? 'Profile Complete!' : 'Complete Your Profile'
    }
  }

  const getDescription = () => {
    if (type === 'application') {
      return canProceed 
        ? 'Your education details are complete. You can apply to projects!'
        : 'Add at least one education detail to apply to projects. You only need to fill out the fields that apply to you.'
    } else {
      return canProceed
        ? 'Your profile is complete! You can now use all platform features.'
        : 'Complete these required fields to finish setting up your profile.'
    }
  }

  const handleComplete = () => {
    if (type === 'application') {
      window.location.href = '/dashboard/profile?action=required'
    } else {
      window.location.href = '/dashboard/profile?guided=true'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className={`px-6 py-6 ${canProceed ? 'bg-green-500' : 'bg-orange-500'} text-white relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-2xl ${canProceed ? 'bg-green-600' : 'bg-orange-600'} flex items-center justify-center`}>
                {canProceed ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{getTitle()}</h2>
                <p className="text-sm opacity-90">{getDescription()}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{completedCount}/{totalCount} completed</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Requirements List */}
          <div className="p-6">
            <div className="space-y-4">
              {requirements.map((req) => (
                <div 
                  key={req.field}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 ${
                    req.isCompleted 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {req.isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-medium mb-1 ${
                      req.isCompleted ? 'text-green-800' : 'text-gray-900'
                    }`}>
                      {req.label}
                    </h4>
                    <p className={`text-sm mb-2 ${
                      req.isCompleted ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {req.description}
                    </p>
                    
                    {req.examples && !req.isCompleted && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Examples: </span>
                        {req.examples.join(', ')}
                      </div>
                    )}
                    
                    {req.isCompleted && (
                      <div className="text-xs text-green-600 font-medium">
                        ✓ Completed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Note for applications */}
            {type === 'application' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Good to know:</p>
                    <p>You only need to complete <strong>at least one</strong> education field. Fill out what applies to you - if you're in high school, just add your high school. If you're in university, add your university and major.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {!canProceed && (
                <button
                  onClick={handleComplete}
                  className={`flex items-center justify-center gap-2 px-6 py-3 ${
                    type === 'application' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-lg transition-colors font-medium`}
                >
                  {type === 'application' ? 'Complete Education Details' : 'Complete Profile'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {canProceed ? 'Close' : 'Maybe Later'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
