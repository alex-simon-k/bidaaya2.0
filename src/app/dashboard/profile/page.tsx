'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Camera, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap,
  Star,
  Award,
  Activity,
  Users,
  Eye,
  Edit2,
  Plus,
  Link,
  Github,
  Linkedin,
  Globe,
  Mail,
  Phone,
  Save,
  X,
  CheckCircle,
  Zap,
  TrendingUp,
  Badge as BadgeIcon
} from 'lucide-react'

interface ProfileData {
  // Basic Info
  id: string
  name: string
  email: string
  profilePicture?: string
  coverImage?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  
  // Professional Info
  title?: string
  company?: string
  university?: string
  degree?: string
  graduationYear?: number
  major?: string
  
  // Skills & Experience
  skills: string[]
  interests: string[]
  experience: {
    title: string
    company: string
    duration: string
    description: string
  }[]
  
  // Social Links
  socialLinks: {
    linkedin?: string
    github?: string
    portfolio?: string
    twitter?: string
  }
  
  // Bidaaya Stats (Gamification)
  stats: {
    projectsCompleted: number
    applicationsSubmitted: number
    acceptanceRate: number
    totalExperience: number // months
    bidaayaLevel: number
    badgesEarned: string[]
    lastActiveDate: string
    weeklyActivity: number // sign-ins per week
    memberSince: string
  }
  
  // Preferences
  preferences: {
    lookingForWork: boolean
    availabilityStatus: 'available' | 'busy' | 'not_available'
    remoteWork: boolean
    projectTypes: string[]
    timeCommitment: string
  }
}

const ACTIVITY_LEVELS = {
  high: { label: 'Highly Active', color: 'text-green-600', bgColor: 'bg-green-100', icon: '🔥' },
  medium: { label: 'Active', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '⚡' },
  low: { label: 'Less Active', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '💤' }
}

const BADGES = {
  'early_adopter': { name: 'Early Adopter', icon: '🌟', description: 'One of the first Bidaaya members' },
  'project_starter': { name: 'Project Starter', icon: '🚀', description: 'Completed first project' },
  'collaborator': { name: 'Great Collaborator', icon: '🤝', description: 'Highly rated by teammates' },
  'consistent': { name: 'Consistent Contributor', icon: '📈', description: '10+ projects completed' },
  'mentor': { name: 'Community Mentor', icon: '👨‍🏫', description: 'Helped other students succeed' },
  'innovator': { name: 'Innovator', icon: '💡', description: 'Led breakthrough solutions' }
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [editData, setEditData] = useState<Partial<ProfileData>>({})
  const [activeTab, setActiveTab] = useState('overview')

  const userRole = session?.user?.role as 'STUDENT' | 'COMPANY'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
    if (session?.user) {
      fetchProfileData()
    }
  }, [session, status, router])

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        setEditData(data)
      } else {
        // Create profile with default data
        createDefaultProfile()
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      createDefaultProfile()
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultProfile = () => {
    const defaultProfile: ProfileData = {
      id: session?.user?.id || '',
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      bio: '',
      location: '',
      skills: [],
      interests: [],
      experience: [],
      socialLinks: {},
      stats: {
        projectsCompleted: 0,
        applicationsSubmitted: 0,
        acceptanceRate: 0,
        totalExperience: 0,
        bidaayaLevel: 1,
        badgesEarned: ['early_adopter'],
        lastActiveDate: new Date().toISOString(),
        weeklyActivity: 1,
        memberSince: new Date().toISOString()
      },
      preferences: {
        lookingForWork: true,
        availabilityStatus: 'available',
        remoteWork: true,
        projectTypes: [],
        timeCommitment: 'part-time'
      }
    }
    setProfileData(defaultProfile)
    setEditData(defaultProfile)
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        const updatedData = await response.json()
        setProfileData(updatedData)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const getActivityLevel = (weeklyActivity: number) => {
    if (weeklyActivity >= 5) return ACTIVITY_LEVELS.high
    if (weeklyActivity >= 2) return ACTIVITY_LEVELS.medium
    return ACTIVITY_LEVELS.low
  }

  const calculateCompletionScore = () => {
    if (!profileData) return 0
    const fields = [
      profileData.bio,
      profileData.location,
      profileData.title,
      profileData.skills.length > 0,
      profileData.experience.length > 0,
      profileData.socialLinks.linkedin || profileData.socialLinks.github
    ]
    return Math.round((fields.filter(Boolean).length / fields.length) * 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profileData) return null

  const activityLevel = getActivityLevel(profileData.stats?.weeklyActivity || 1)
  const completionScore = calculateCompletionScore()

  // Render different layouts based on user role
  if (userRole === 'COMPANY') {
    return renderCompanyProfile()
  }

  // Default student profile
  return renderStudentProfile()

  function renderCompanyProfile() {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Company Header Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            {/* Company Cover Image */}
            <div className="h-48 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 relative">
              {isEditing && (
                <button className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/40">
                  <Camera className="h-4 w-4" />
                </button>
              )}
              
              {/* Company Logo */}
              <div className="absolute -bottom-16 left-8">
                                 <div className="w-32 h-32 bg-white rounded-2xl p-4 shadow-lg border-4 border-white">
                   <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-3xl font-bold">
                     {profileData?.company?.charAt(0).toUpperCase() || profileData?.name?.charAt(0).toUpperCase() || 'C'}
                   </div>
                 </div>
                {isEditing && (
                  <button className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Company Profile Header */}
            <div className="relative px-8 pb-8 pt-20">
              {/* Edit Button */}
              <div className="flex justify-end mb-6">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Profile
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Company Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Company Details */}
                <div className="lg:col-span-2">
                  <div className="mb-6">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.company || ''}
                        onChange={(e) => setEditData({...editData, company: e.target.value})}
                        placeholder="Company Name"
                        className="text-3xl font-bold text-gray-900 border-b border-gray-300 bg-transparent w-full focus:outline-none focus:border-blue-500"
                      />
                                         ) : (
                       <h1 className="text-3xl font-bold text-gray-900">{profileData?.company || 'Company Name'}</h1>
                     )}
                     
                     {isEditing ? (
                       <input
                         type="text"
                         value={editData.title || ''}
                         onChange={(e) => setEditData({...editData, title: e.target.value})}
                         placeholder="Industry / Company tagline"
                         className="text-lg text-gray-600 border-b border-gray-300 bg-transparent w-full focus:outline-none focus:border-blue-500 mt-2"
                       />
                     ) : (
                       <p className="text-lg text-gray-600 mt-2">
                         {profileData?.title || 'Industry / Company tagline'}
                       </p>
                     )}
                  </div>

                  {/* Company Meta Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.location || ''}
                          onChange={(e) => setEditData({...editData, location: e.target.value})}
                          placeholder="Location"
                          className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                        />
                                             ) : (
                         <span>{profileData?.location || 'Location'}</span>
                       )}
                     </div>
                     
                     <div className="flex items-center gap-1">
                       <Users className="h-4 w-4" />
                       <span>50+ employees</span> {/* This would come from company size field */}
                     </div>
                     
                     <div className="flex items-center gap-1">
                       <Calendar className="h-4 w-4" />
                       <span>Founded {profileData?.stats ? new Date(profileData.stats.memberSince).getFullYear() : new Date().getFullYear()}</span>
                     </div>
                  </div>

                  {/* Company Description */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">About the Company</h3>
                    {isEditing ? (
                      <textarea
                        value={editData.bio || ''}
                        onChange={(e) => setEditData({...editData, bio: e.target.value})}
                        placeholder="Tell students about your company culture, mission, and what makes you special..."
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                                         ) : (
                       <p className="text-gray-700">
                         {profileData?.bio || 'Tell students about your company culture, mission, and what makes you special...'}
                       </p>
                     )}
                  </div>
                </div>

                {/* Company Stats & Info */}
                <div className="space-y-6">
                  {/* Profile Completion */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                      <span className="text-sm font-bold text-blue-600">{completionScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionScore}%` }}
                      ></div>
                    </div>
                    {completionScore < 100 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Complete your profile to attract top students!
                      </p>
                    )}
                  </div>

                  {/* Company Performance */}
                  <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Performance</div>
                        <div className="text-xs text-gray-600">Bidaaya Impact</div>
                      </div>
                    </div>
                    
                                         <div className="grid grid-cols-2 gap-3 text-sm">
                       <div className="text-center">
                         <div className="font-bold text-emerald-600">{profileData?.stats?.projectsCompleted || 0}</div>
                         <div className="text-gray-600">Projects</div>
                       </div>
                       <div className="text-center">
                         <div className="font-bold text-blue-600">{profileData?.stats?.applicationsSubmitted || 0}</div>
                         <div className="text-gray-600">Applications</div>
                       </div>
                     </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <button 
                        onClick={() => router.push('/dashboard/projects/new')}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Post New Project
                      </button>
                      <button 
                        onClick={() => router.push('/dashboard/projects')}
                        className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Projects
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Tabs */}
          <div className="bg-white rounded-lg shadow-lg mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-8">
                {['overview', 'projects', 'team', 'culture'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Company Links */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect with Us</h3>
                                         <div className="flex gap-3">
                       {profileData?.socialLinks?.linkedin && (
                         <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                           <Linkedin className="h-4 w-4" />
                           LinkedIn
                         </a>
                       )}
                       {profileData?.website && (
                         <a href={profileData.website} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
                           <Globe className="h-4 w-4" />
                           Website
                         </a>
                       )}
                     </div>
                  </div>

                  {/* Company Values */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Company Values</h3>
                      {isEditing && (
                        <button className="text-blue-500 hover:text-blue-600 flex items-center gap-1">
                          <Plus className="h-4 w-4" />
                          Add Value
                        </button>
                      )}
                    </div>
                                         <div className="flex flex-wrap gap-2">
                       {profileData?.skills && profileData.skills.length > 0 ? (
                         profileData.skills.map((skill, index) => (
                           <span
                             key={index}
                             className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm"
                           >
                             {skill}
                           </span>
                         ))
                       ) : (
                         <p className="text-gray-500">No company values added yet. Click edit to add what drives your company!</p>
                       )}
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
                    <button 
                      onClick={() => router.push('/dashboard/projects/new')}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      New Project
                    </button>
                  </div>
                  
                  {(profileData?.stats?.projectsCompleted || 0) > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Placeholder for project cards */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Project Name</h4>
                        <p className="text-gray-600 text-sm mb-3">Project description goes here...</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📍 Remote</span>
                          <span>⏰ 3 months</span>
                          <span>👥 5 students needed</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Briefcase className="h-12 w-12 mx-auto" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h4>
                      <p className="text-gray-600 mb-4">Create your first project to start connecting with students!</p>
                      <button 
                        onClick={() => router.push('/dashboard/projects/new')}
                        className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600"
                      >
                        Create Project
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'team' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Meet the Team</h3>
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Users className="h-12 w-12 mx-auto" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Team Section Coming Soon</h4>
                    <p className="text-gray-600">Showcase your team members and company culture here.</p>
                  </div>
                </div>
              )}

              {activeTab === 'culture' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Culture</h3>
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Star className="h-12 w-12 mx-auto" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Culture Section Coming Soon</h4>
                    <p className="text-gray-600">Share photos, videos, and stories about your company culture.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

     function renderStudentProfile() {
     return (
       <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
            {isEditing && (
              <button className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/40">
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Profile Header */}
          <div className="relative px-8 pb-8">
            {/* Profile Picture */}
            <div className="absolute -top-16 left-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                    {profileData?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                {isEditing && (
                  <button className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex justify-end pt-4">
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Profile
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Basic Info */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="text-3xl font-bold text-gray-900 border-b border-gray-300 bg-transparent w-full focus:outline-none focus:border-blue-500"
                    />
                                  ) : (
                  <h1 className="text-3xl font-bold text-gray-900">{profileData?.name || 'User Name'}</h1>
                )}
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.title || ''}
                      onChange={(e) => setEditData({...editData, title: e.target.value})}
                      placeholder="Your title (e.g., Computer Science Student)"
                      className="text-lg text-gray-600 border-b border-gray-300 bg-transparent w-full focus:outline-none focus:border-blue-500 mt-2"
                    />
                                  ) : (
                  <p className="text-lg text-gray-600 mt-2">
                    {profileData?.title || `${userRole === 'STUDENT' ? 'Student' : 'Company'} Member`}
                  </p>
                )}
                </div>

                {/* Location & Contact */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.location || ''}
                        onChange={(e) => setEditData({...editData, location: e.target.value})}
                        placeholder="Location"
                        className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      />
                                    ) : (
                  <span>{profileData?.location || 'Location not specified'}</span>
                )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {profileData?.stats ? new Date(profileData.stats.memberSince).toLocaleDateString() : 'Recently'}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    <span className={activityLevel.color}>
                      {activityLevel.icon} {activityLevel.label}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  {isEditing ? (
                    <textarea
                      value={editData.bio || ''}
                      onChange={(e) => setEditData({...editData, bio: e.target.value})}
                      placeholder="Tell us about yourself, your goals, and what you're passionate about..."
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">
                                             {profileData?.bio || 'No bio added yet. Click edit to add your story!'}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats & Activity */}
              <div className="space-y-6">
                {/* Profile Completion */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                    <span className="text-sm font-bold text-blue-600">{completionScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionScore}%` }}
                    ></div>
                  </div>
                  {completionScore < 100 && (
                    <p className="text-xs text-gray-600 mt-1">
                      Complete your profile to stand out to companies!
                    </p>
                  )}
                </div>

                {/* Bidaaya Level */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Level {profileData?.stats?.bidaayaLevel || 1}</div>
                      <div className="text-xs text-gray-600">Bidaaya Member</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{profileData?.stats?.projectsCompleted || 0}</div>
                      <div className="text-gray-600">Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">{profileData?.stats?.acceptanceRate || 0}%</div>
                      <div className="text-gray-600">Success Rate</div>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                {(profileData?.stats?.badgesEarned || []).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Achievements
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(profileData?.stats?.badgesEarned || []).map((badgeId) => {
                        const badge = BADGES[badgeId as keyof typeof BADGES]
                        return badge ? (
                          <div
                            key={badgeId}
                            className="bg-white border border-gray-200 rounded-lg p-2 text-center min-w-[60px]"
                            title={badge.description}
                          >
                            <div className="text-lg">{badge.icon}</div>
                            <div className="text-xs text-gray-600 mt-1">{badge.name}</div>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {['overview', 'experience', 'skills', 'projects'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Skills */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                    {isEditing && (
                      <button className="text-blue-500 hover:text-blue-600 flex items-center gap-1">
                        <Plus className="h-4 w-4" />
                        Add Skill
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(profileData?.skills || []).length > 0 ? (
                      (profileData?.skills || []).map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No skills added yet. Click edit to add your skills!</p>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect</h3>
                  <div className="flex gap-3">
                    {profileData?.socialLinks?.linkedin && (
                      <a href={profileData?.socialLinks?.linkedin} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {profileData?.socialLinks?.github && (
                      <a href={profileData?.socialLinks?.github} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900">
                        <Github className="h-4 w-4" />
                        GitHub
                      </a>
                    )}
                    {profileData?.website && (
                      <a href={profileData?.website} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
                  {isEditing && (
                    <button className="text-blue-500 hover:text-blue-600 flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      Add Experience
                    </button>
                  )}
                </div>
                
                {(profileData?.experience || []).length > 0 ? (
                  <div className="space-y-6">
                    {(profileData?.experience || []).map((exp, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-6 relative">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                        <p className="text-blue-600">{exp.company}</p>
                        <p className="text-sm text-gray-600 mb-2">{exp.duration}</p>
                        <p className="text-gray-700">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No experience added yet. Click edit to add your work history!</p>
                )}
              </div>
            )}

            {activeTab === 'skills' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Skills & Interests</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Technical Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {(profileData?.skills || []).map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {(profileData?.interests || []).map((interest, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Bidaaya Projects</h3>
                
                {(profileData?.stats?.projectsCompleted || 0) > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Placeholder for project cards */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Project Name</h4>
                      <p className="text-gray-600 text-sm mb-3">Project description goes here...</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>✅ Completed</span>
                        <span>⭐ 4.8 rating</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Briefcase className="h-12 w-12 mx-auto" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h4>
                    <p className="text-gray-600 mb-4">Start applying to projects to build your portfolio!</p>
                    <button 
                      onClick={() => router.push('/dashboard/projects')}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                    >
                      Browse Projects
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    )
  }
} 