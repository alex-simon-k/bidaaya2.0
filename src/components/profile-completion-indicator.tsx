'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface ProfileField {
  key: string
  label: string
  description: string
  required: boolean
  requiredFor: 'profile' | 'applications' | 'both'
  value?: any
  isCompleted: boolean
}

interface ProfileCompletionIndicatorProps {
  profileData?: any
  showApplicationRequirements?: boolean
}

export function ProfileCompletionIndicator({ 
  profileData, 
  showApplicationRequirements = false 
}: ProfileCompletionIndicatorProps) {
  const { data: session } = useSession()
  const [fields, setFields] = useState<ProfileField[]>([])

  useEffect(() => {
    if (!profileData) return

    console.log('🔍 Profile Completion Analysis:', {
      name: profileData.name,
      terms: profileData.terms,
      education: profileData.education,
      subjects: profileData.subjects,
      interests: profileData.interests,
      university: profileData.university,
      highSchool: profileData.highSchool,
      major: profileData.major,
      skills: profileData.skills
    })

    // Build fields based on actual onboarding phases
    const profileFields: ProfileField[] = []

    // Phase 1 Fields (Setup Profile) - Only show if actually missing
    if (!profileData.name) {
      profileFields.push({
        key: 'name',
        label: 'Full Name',
        description: 'Complete Phase 1: Add your full name',
        required: true,
        requiredFor: 'both',
        value: profileData.name,
        isCompleted: false
      })
    }

    // Check terms properly - could be boolean true or string "true" 
    const hasTerms = profileData.terms === true || profileData.terms === 'true' || profileData.terms === '1'
    if (!hasTerms) {
      profileFields.push({
        key: 'terms',
        label: 'Terms & Conditions',
        description: 'Complete Phase 1: Accept terms and conditions',
        required: true,
        requiredFor: 'both',
        value: profileData.terms,
        isCompleted: false
      })
    }

    if (!profileData.education) {
      profileFields.push({
        key: 'education',
        label: 'Education Status',
        description: 'Complete Phase 1: Your current education level',
        required: true,
        requiredFor: 'both',
        value: profileData.education,
        isCompleted: false
      })
    }

    // Phase 2 Fields (Guided Tutorial) - At least one education detail OR interests
    const hasEducationDetails = !!(profileData.university || profileData.highSchool || profileData.major || profileData.subjects)
    const hasInterests = !!(profileData.interests?.length > 0)
    const hasPhase2Complete = hasEducationDetails || hasInterests

    if (!hasPhase2Complete) {
      // Show one field to represent Phase 2 completion
      profileFields.push({
        key: 'subjects',
        label: 'Educational Background',
        description: 'Complete Phase 2: Add your university, subjects, or areas of interest',
        required: false,
        requiredFor: 'applications',
        value: null,
        isCompleted: false
      })
    }

    // Optional enhancement fields - only show if user wants to improve profile
    if (hasPhase2Complete && !profileData.skills?.length) {
      profileFields.push({
        key: 'skills',
        label: 'Skills (Optional)',
        description: 'Optional: Add your technical and soft skills to boost your profile',
        required: false,
        requiredFor: 'profile',
        value: profileData.skills?.length > 0 ? profileData.skills : null,
        isCompleted: false
      })
    }

    setFields(profileFields)
  }, [profileData])

  // Calculate completion status based on actual onboarding flow
  const hasPhase1Complete = !!(profileData?.name && profileData?.education && 
    (profileData?.terms === true || profileData?.terms === 'true' || profileData?.terms === '1'))
  
  const hasEducationDetails = !!(profileData?.university || profileData?.highSchool || profileData?.major || profileData?.subjects)
  const hasInterests = !!(profileData?.interests?.length > 0)
  const hasPhase2Complete = hasEducationDetails || hasInterests

  const profileCompleted = hasPhase1Complete && hasPhase2Complete
  const canApply = hasPhase1Complete && hasPhase2Complete // Same logic for now

  console.log('🎯 Completion Status:', {
    hasPhase1Complete,
    hasPhase2Complete,
    profileCompleted,
    canApply,
    fieldsShowing: fields.length
  })

  // Calculate completion percentage based on phases, not individual fields
  const phase1Weight = 60 // Phase 1 is 60% of completion
  const phase2Weight = 40 // Phase 2 is 40% of completion
  
  let completionPercentage = 0
  if (hasPhase1Complete) completionPercentage += phase1Weight
  if (hasPhase2Complete) completionPercentage += phase2Weight
  
  const profileCompletionPercentage = completionPercentage

  const getFieldIcon = (field: ProfileField) => {
    if (field.isCompleted) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (field.required || (showApplicationRequirements && field.requiredFor === 'applications')) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    } else {
      return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getFieldStatus = (field: ProfileField) => {
    if (field.isCompleted) return 'Completed'
    if (field.required) return 'Required'
    if (showApplicationRequirements && field.requiredFor === 'applications') return 'Required for Applications'
    return 'Optional'
  }

  // Don't show the component if everything is complete
  const hasIncompleteFields = fields.some(field => {
    const shouldShow = showApplicationRequirements 
      ? (field.requiredFor === 'applications' || field.requiredFor === 'both')
      : true
    return shouldShow && !field.isCompleted
  })

  // If profile is complete AND can apply AND no incomplete fields, don't show
  if (profileCompleted && canApply && !hasIncompleteFields) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Profile Completion</h3>
          <span className="text-sm font-medium text-gray-600">{profileCompletionPercentage}% Complete</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${profileCompletionPercentage}%` }}
          />
        </div>

        {/* Status Cards - Only show if there are issues */}
        {(!profileCompleted || !canApply) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {!profileCompleted && (
              <div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Profile Incomplete</span>
                </div>
                <p className="text-sm text-orange-700">
                  Complete required fields to finish your profile
                </p>
              </div>
            )}

            {!canApply && (
              <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Can't Apply to Projects</span>
                </div>
                <p className="text-sm text-red-700">
                  Add education details to apply to projects
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Field List - Only show incomplete items */}
      {fields.filter(field => {
        const shouldShow = showApplicationRequirements 
          ? (field.requiredFor === 'applications' || field.requiredFor === 'both')
          : true
        return shouldShow && !field.isCompleted
      }).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 mb-3">
            Complete Your Profile
          </h4>
          
          {fields.map((field) => {
            const shouldShow = showApplicationRequirements 
              ? (field.requiredFor === 'applications' || field.requiredFor === 'both')
              : true

            // Only show incomplete fields
            if (!shouldShow || field.isCompleted) return null

            return (
              <div key={field.key} className="flex items-center justify-between p-3 rounded-lg border-2 border-orange-200 bg-orange-50 hover:border-orange-300 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium text-gray-900">{field.label}</p>
                    <p className="text-sm text-gray-600">{field.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    field.required || (showApplicationRequirements && field.requiredFor === 'applications')
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {field.required || (showApplicationRequirements && field.requiredFor === 'applications') ? 'Required' : 'Optional'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action Buttons - Context-aware based on which phase is incomplete */}
      {!profileCompleted && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-col sm:flex-row gap-3">
            {!hasPhase1Complete && (
              <button
                onClick={() => window.location.href = '/auth/setup-profile'}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete Phase 1 Setup
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {hasPhase1Complete && !hasPhase2Complete && (
              <button
                onClick={() => window.location.href = '/dashboard/profile?guided=true'}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Phase 2 Profile
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
