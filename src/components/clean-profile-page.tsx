'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Edit3, 
  Save, 
  X, 
  GraduationCap, 
  MapPin, 
  User, 
  Target, 
  BookOpen,
  Calendar,
  Check
} from 'lucide-react'

interface ProfileData {
  id: string
  name: string
  email: string
  bio?: string
  highSchool?: string
  university?: string
  subjects?: string
  mena?: boolean
  interests?: string[]
  dateOfBirth?: string
  education?: string
  profileCompleted?: boolean
  // Add any additional fields from API
  [key: string]: any
}

interface CleanProfilePageProps {
  profileData: ProfileData
  onUpdate: (data: Partial<ProfileData>) => Promise<void>
}

const INTEREST_OPTIONS = [
  'Technology & Software Development',
  'Marketing & Digital Media',
  'Finance & Banking',
  'Healthcare & Medical',
  'Education & Training',
  'Consulting & Strategy',
  'Design & Creative Arts',
  'Engineering & Manufacturing',
  'Sales & Business Development',
  'Non-profit & Social Impact',
  'Startups & Entrepreneurship',
  'Government & Public Sector',
  'Law & Legal Services',
  'Real Estate & Property',
  'Hospitality & Tourism'
]

export function CleanProfilePage({ profileData, onUpdate }: CleanProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<ProfileData>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Initialize edit data when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditData({
        bio: profileData.bio || '',
        highSchool: profileData.highSchool || '',
        university: profileData.university || '',
        subjects: profileData.subjects || '',
        mena: profileData.mena || false,
        interests: profileData.interests || []
      })
    }
  }, [isEditing, profileData])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onUpdate(editData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
  }

  const handleInterestToggle = (interest: string) => {
    const currentInterests = editData.interests || []
    if (currentInterests.includes(interest)) {
      setEditData({
        ...editData,
        interests: currentInterests.filter(i => i !== interest)
      })
    } else {
      setEditData({
        ...editData,
        interests: [...currentInterests, interest]
      })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
              <p className="text-gray-600">{profileData.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${profileData.profileCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {profileData.profileCompleted ? 'Profile Complete' : 'Profile In Progress'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="space-y-6">
          
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <p className="text-gray-900">{formatDate(profileData.dateOfBirth)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education Status</label>
                <p className="text-gray-900">{profileData.education || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">About Me</h2>
            </div>
            
            {isEditing ? (
              <textarea
                value={editData.bio || ''}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="w-full h-32 p-4 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                maxLength={150}
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {profileData.bio || 'No bio added yet. Click edit to add your story!'}
              </p>
            )}
          </div>

          {/* Educational Background */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Educational Background</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">High School</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.highSchool || ''}
                    onChange={(e) => setEditData({ ...editData, highSchool: e.target.value })}
                    placeholder="e.g., International School of Choueifat"
                    className="w-full p-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-700">{profileData.highSchool || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.university || ''}
                    onChange={(e) => setEditData({ ...editData, university: e.target.value })}
                    placeholder="e.g., American University of Sharjah"
                    className="w-full p-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-700">{profileData.university || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recent Subjects/Modules</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.subjects || ''}
                    onChange={(e) => setEditData({ ...editData, subjects: e.target.value })}
                    placeholder="e.g., Computer Science, Business Administration, Marketing"
                    className="w-full p-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-700">{profileData.subjects || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Regional Presence */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Regional Presence</h2>
            </div>
            
            {isEditing ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setEditData({ ...editData, mena: true })}
                  className={`p-4 text-center rounded-lg border-2 transition-all ${
                    editData.mena 
                      ? 'border-blue-500 bg-blue-50 text-blue-900' 
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">🌍</div>
                  <div className="font-medium">Often in MENA</div>
                  {editData.mena && <Check className="h-4 w-4 text-blue-600 mx-auto mt-2" />}
                </button>
                
                <button
                  onClick={() => setEditData({ ...editData, mena: false })}
                  className={`p-4 text-center rounded-lg border-2 transition-all ${
                    !editData.mena 
                      ? 'border-blue-500 bg-blue-50 text-blue-900' 
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">🌎</div>
                  <div className="font-medium">Rarely in MENA</div>
                  {!editData.mena && <Check className="h-4 w-4 text-blue-600 mx-auto mt-2" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-2xl">{profileData.mena ? '🌍' : '🌎'}</div>
                <div>
                  <p className="font-medium text-gray-900">
                    {profileData.mena ? 'Often in MENA Region' : 'Rarely in MENA Region'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {profileData.mena 
                      ? 'Available for regional opportunities' 
                      : 'Primarily available for remote/global opportunities'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Interests</h2>
            </div>
            
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INTEREST_OPTIONS.map(interest => {
                  const isSelected = editData.interests?.includes(interest)
                  return (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-3 text-left rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{interest}</span>
                        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profileData.interests || []).length > 0 ? (
                  profileData.interests?.map((interest, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No interests selected. Click edit to add your interests!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
