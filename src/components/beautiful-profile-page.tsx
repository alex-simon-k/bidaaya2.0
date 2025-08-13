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
  Check,
  Star,
  Shield,
  Camera,
  Plus
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
  [key: string]: any
}

interface BeautifulProfilePageProps {
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
  'Government & Public Sector'
]

export function BeautifulProfilePage({ profileData, onUpdate }: BeautifulProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<ProfileData>>({})
  const [isLoading, setIsLoading] = useState(false)

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
    if (!dateString) return 'Not added'
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const completionPercentage = () => {
    const fields = ['bio', 'university', 'highSchool', 'subjects', 'interests']
    const completedFields = fields.filter(field => {
      const value = profileData[field]
      if (field === 'interests') return Array.isArray(value) && value.length > 0
      return value && value.toString().trim().length > 0
    })
    return Math.round((completedFields.length / fields.length) * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        {/* Profile Content */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-32">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              
              {/* Profile Header */}
              <div className="p-8 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {getInitials(profileData.name)}
                      </div>
                      <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full border-4 border-gray-50 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <Camera className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                    
                    {/* Basic Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">{profileData.name}</h1>
                        {profileData.profileCompleted && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            <Shield className="h-4 w-4" />
                            Verified
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{profileData.email}</p>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-gray-900">New member</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Joined {new Date().getFullYear()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{profileData.mena ? 'MENA Region' : 'Global'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit Button */}
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancel}
                          disabled={isLoading}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isLoading}
                          className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                          {isLoading ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save changes
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit profile
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Profile Completion */}
                <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Profile completion</span>
                    <span className="text-sm font-bold text-gray-900">{completionPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage()}%` }}
                    ></div>
                  </div>
                  {completionPercentage() < 100 && (
                    <p className="text-xs text-gray-600 mt-2">Complete your profile to attract more opportunities</p>
                  )}
                </div>
              </div>
              
              {/* Content Sections */}
              <div className="border-t border-gray-100">
                <div className="p-8 space-y-8">
                  
                  {/* About Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">About</h2>
                    </div>
                    
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editData.bio || ''}
                          onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                          placeholder="Share something interesting about yourself..."
                          className="w-full h-32 p-4 text-gray-900 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                          maxLength={150}
                        />
                        <div className="text-right text-sm text-gray-500 mt-1">
                          {(editData.bio || '').length}/150
                        </div>
                      </div>
                    ) : (
                      <div>
                        {profileData.bio ? (
                          <p className="text-gray-800 leading-relaxed text-lg">{profileData.bio}</p>
                        ) : (
                          <div className="flex items-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-2xl">
                            <Plus className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-500">Add a bio to tell your story</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Education & Background */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <GraduationCap className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Education & Background</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Info */}
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl">
                          <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                              <p className="text-gray-900">{formatDate(profileData.dateOfBirth)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Current Status</label>
                              <p className="text-gray-900">{profileData.education || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Educational Institutions */}
                      <div className="space-y-4">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">High School</label>
                              <input
                                type="text"
                                value={editData.highSchool || ''}
                                onChange={(e) => setEditData({ ...editData, highSchool: e.target.value })}
                                placeholder="Enter your high school"
                                className="w-full p-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                              <input
                                type="text"
                                value={editData.university || ''}
                                onChange={(e) => setEditData({ ...editData, university: e.target.value })}
                                placeholder="Enter your university"
                                className="w-full p-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Recent Subjects</label>
                              <input
                                type="text"
                                value={editData.subjects || ''}
                                onChange={(e) => setEditData({ ...editData, subjects: e.target.value })}
                                placeholder="e.g., Computer Science, Marketing"
                                className="w-full p-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-2xl">
                            <h3 className="font-semibold text-gray-900 mb-3">Educational Background</h3>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-gray-600">High School</label>
                                <p className="text-gray-900">{profileData.highSchool || 'Not specified'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">University</label>
                                <p className="text-gray-900">{profileData.university || 'Not specified'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Recent Subjects</label>
                                <p className="text-gray-900">{profileData.subjects || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Interests */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <Target className="h-5 w-5 text-purple-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Interests</h2>
                    </div>
                    
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {INTEREST_OPTIONS.map(interest => {
                          const isSelected = editData.interests?.includes(interest)
                          return (
                            <button
                              key={interest}
                              onClick={() => handleInterestToggle(interest)}
                              className={`p-4 text-left rounded-xl border-2 transition-all ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-50 text-blue-900' 
                                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
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
                      <div>
                        {(profileData.interests || []).length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {profileData.interests?.map((interest, index) => (
                              <span
                                key={index}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-medium shadow-sm"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-2xl">
                            <Plus className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-500">Add your interests to help with project matching</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
