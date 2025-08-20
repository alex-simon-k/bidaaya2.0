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

    console.log('🔍 Profile Completion Analysis - RAW DATA:', profileData)
    console.log('🔍 Profile Completion Analysis - SPECIFIC FIELDS:', {
      name: profileData.name,
      nameType: typeof profileData.name,
      terms: profileData.terms,
      termsType: typeof profileData.terms,
      education: profileData.education,
      educationType: typeof profileData.education,
      subjects: profileData.subjects,
      subjectsType: typeof profileData.subjects,
      interests: profileData.interests,
      interestsType: typeof profileData.interests,
      interestsLength: profileData.interests?.length,
      university: profileData.university,
      highSchool: profileData.highSchool,
      major: profileData.major,
      skills: profileData.skills
    })

    // Check each field individually and only show what's actually missing
    const profileFields: ProfileField[] = []

    // Required for profile completion (mandatory fields)
    if (!profileData.name || !profileData.name.trim()) {
      profileFields.push({
        key: 'name',
        label: 'Full Name',
        description: 'Required: Add your full name',
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
        description: 'Required: Accept terms and conditions',
        required: true,
        requiredFor: 'both',
        value: profileData.terms,
        isCompleted: false
      })
    }

    if (!profileData.education || !profileData.education.trim()) {
      profileFields.push({
        key: 'education',
        label: 'Education Status',
        description: 'Required: Your current education level (High School, University, etc.)',
        required: true,
        requiredFor: 'both',
        value: profileData.education,
        isCompleted: false
      })
    }

    // For applications - need at least one education/background field
    const hasAnyEducationInfo = !!(
      (profileData.university && profileData.university.trim()) ||
      (profileData.highSchool && profileData.highSchool.trim()) ||
      (profileData.major && profileData.major.trim()) ||
      (profileData.subjects && profileData.subjects.trim()) ||
      (profileData.interests && profileData.interests.length > 0)
    )

    if (!hasAnyEducationInfo) {
      profileFields.push({
        key: 'educational_background',
        label: 'Educational Background',
        description: 'Required for applications: Add your university, high school, subjects, or interests',
        required: true,
        requiredFor: 'applications',
        value: null,
        isCompleted: false
      })
    }

    // Optional fields that boost profile (only show if user wants suggestions)
    if (showApplicationRequirements && hasAnyEducationInfo) {
      if (!profileData.skills?.length) {
        profileFields.push({
          key: 'skills',
          label: 'Skills (Optional)',
          description: 'Optional: Add your technical and soft skills to strengthen applications',
          required: false,
          requiredFor: 'profile',
          value: profileData.skills?.length > 0 ? profileData.skills : null,
          isCompleted: false
        })
      }

      if (!profileData.bio?.trim()) {
        profileFields.push({
          key: 'bio',
          label: 'Bio (Optional)',
          description: 'Optional: Write a brief bio to help you stand out',
          required: false,
          requiredFor: 'profile',
          value: profileData.bio,
          isCompleted: false
        })
      }
    }

    setFields(profileFields)
  }, [profileData])

  // Calculate completion based on what's actually missing
  const requiredFields = fields.filter(f => f.required)
  const hasAllRequiredFields = requiredFields.length === 0 // No missing required fields
  
  const hasBasicProfile = !!(profileData?.name && profileData?.education && 
    (profileData?.terms === true || profileData?.terms === 'true' || profileData?.terms === '1'))
  
  const hasEducationBackground = !!(
    (profileData?.university && profileData?.university.trim()) ||
    (profileData?.highSchool && profileData?.highSchool.trim()) ||
    (profileData?.major && profileData?.major.trim()) ||
    (profileData?.subjects && profileData?.subjects.trim()) ||
    (profileData?.interests && profileData?.interests.length > 0)
  )

  const profileCompleted = hasBasicProfile && hasEducationBackground
  const canApply = profileCompleted

  console.log('🎯 Completion Status:', {
    hasBasicProfile,
    hasEducationBackground,
    profileCompleted,
    canApply,
    fieldsShowing: fields.length,
    missingRequiredFields: requiredFields.length
  })

  // Calculate completion percentage based on actual requirements
  const totalRequiredChecks = 2 // Basic profile + Education background
  let completedChecks = 0
  if (hasBasicProfile) completedChecks++
  if (hasEducationBackground) completedChecks++
  
  const profileCompletionPercentage = Math.round((completedChecks / totalRequiredChecks) * 100)

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

      {/* Action Button - Only show if there are missing required fields */}
      {fields.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-center">
            <button
              onClick={() => window.location.href = '/dashboard/profile?guided=true'}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Complete Profile
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
