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

    const profileFields: ProfileField[] = [
      {
        key: 'name',
        label: 'Full Name',
        description: 'Your full name for identification',
        required: true,
        requiredFor: 'both',
        value: profileData.name,
        isCompleted: !!profileData.name
      },
      {
        key: 'terms',
        label: 'Terms & Conditions',
        description: 'Accept terms and conditions',
        required: true,
        requiredFor: 'both',
        value: profileData.terms,
        isCompleted: !!profileData.terms
      },
      {
        key: 'education',
        label: 'Education Status',
        description: 'Your current education level (High School, University, etc.)',
        required: true,
        requiredFor: 'profile',
        value: profileData.education,
        isCompleted: !!profileData.education
      },
      {
        key: 'university',
        label: 'University',
        description: 'Your university name',
        required: false,
        requiredFor: 'applications',
        value: profileData.university,
        isCompleted: !!profileData.university
      },
      {
        key: 'highSchool',
        label: 'High School',
        description: 'Your high school name',
        required: false,
        requiredFor: 'applications',
        value: profileData.highSchool,
        isCompleted: !!profileData.highSchool
      },
      {
        key: 'major',
        label: 'Major/Field of Study',
        description: 'Your area of study or academic focus',
        required: false,
        requiredFor: 'applications',
        value: profileData.major,
        isCompleted: !!profileData.major
      },
      {
        key: 'subjects',
        label: 'Subjects/Interests',
        description: 'Your academic subjects or areas of interest',
        required: false,
        requiredFor: 'applications',
        value: profileData.subjects,
        isCompleted: !!profileData.subjects
      },
      {
        key: 'skills',
        label: 'Skills',
        description: 'Your technical and soft skills',
        required: false,
        requiredFor: 'profile',
        value: profileData.skills?.length > 0 ? profileData.skills : null,
        isCompleted: !!(profileData.skills?.length > 0)
      }
    ]

    setFields(profileFields)
  }, [profileData])

  // Calculate completion status
  const profileRequiredFields = fields.filter(f => 
    f.required && (f.requiredFor === 'profile' || f.requiredFor === 'both')
  )
  const profileOptionalFields = fields.filter(f => 
    !f.required && (f.requiredFor === 'profile' || f.requiredFor === 'both')
  )
  
  const applicationRequiredFields = fields.filter(f => 
    f.requiredFor === 'applications' || f.requiredFor === 'both'
  )

  // For profile completion: name + (university OR major OR subjects OR skills OR education) + terms
  const hasBasicEducationInfo = fields.some(f => 
    ['university', 'major', 'subjects', 'skills', 'education'].includes(f.key) && f.isCompleted
  )
  const profileCompleted = profileRequiredFields.every(f => f.isCompleted) && hasBasicEducationInfo

  // For applications: at least one of university, highSchool, major, subjects
  const canApply = fields.some(f => 
    ['university', 'highSchool', 'major', 'subjects'].includes(f.key) && f.isCompleted
  )

  const profileCompletionPercentage = Math.round(
    (fields.filter(f => f.isCompleted).length / fields.length) * 100
  )

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

      {/* Action Buttons - Only show if there are incomplete items */}
      {hasIncompleteFields && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-col sm:flex-row gap-3">
            {!profileCompleted && (
              <button
                onClick={() => window.location.href = '/dashboard/profile?guided=true'}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete Profile
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {!canApply && (
              <button
                onClick={() => window.location.href = '/dashboard/profile?phase=2'}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Education Details
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
