'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, 
  Building2, 
  Users, 
  Briefcase, 
  Target, 
  Mail, 
  Globe, 
  Phone, 
  Calendar,
  Save,
  Upload,
  Camera,
  ArrowLeft,
  Check,
  X,
  Edit2,
  MapPin
} from 'lucide-react'

interface CompanyProfile {
  name: string
  companyName: string
  companyRole: string
  companySize: string
  industry: string
  companyOneLiner: string
  companyGoals: string[]
  contactPersonName: string
  contactPersonType: string
  contactEmail: string
  contactWhatsapp: string
  companyWebsite: string
  calendlyLink: string
  referralSource: string
  referralDetails: string
  image: string
}

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '501–1,000', '1,001+']
const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Consulting', 'Media', 'Other']
const CONTACT_TYPES = ['CEO', 'CTO', 'HR Manager', 'Recruiter', 'Other']
const GOAL_OPTIONS = [
  'Find interns for specific projects',
  'Build long-term talent pipeline',
  'Engage with university students',
  'Corporate social responsibility',
  'Research and development support',
  'Fresh perspectives and innovation',
  'Other'
]

export default function CompanyProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<CompanyProfile>({
    name: '',
    companyName: '',
    companyRole: '',
    companySize: '',
    industry: '',
    companyOneLiner: '',
    companyGoals: [],
    contactPersonName: '',
    contactPersonType: '',
    contactEmail: '',
    contactWhatsapp: '',
    companyWebsite: '',
    calendlyLink: '',
    referralSource: '',
    referralDetails: '',
    image: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Redirect if not company
  useEffect(() => {
    if (session?.user?.role !== 'COMPANY') {
      router.push('/dashboard')
    }
  }, [session, router])

  // Load profile data
  useEffect(() => {
    if (session?.user?.role === 'COMPANY') {
      loadProfile()
    }
  }, [session])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        const user = data.profile
        
        setProfile({
          name: user.name || '',
          companyName: user.companyName || '',
          companyRole: user.companyRole || '',
          companySize: user.companySize || '',
          industry: user.industry || '',
          companyOneLiner: user.companyOneLiner || '',
          companyGoals: user.companyGoals || [],
          contactPersonName: user.contactPersonName || '',
          contactPersonType: user.contactPersonType || '',
          contactEmail: user.contactEmail || '',
          contactWhatsapp: user.contactWhatsapp || '',
          companyWebsite: user.companyWebsite || '',
          calendlyLink: user.calendlyLink || '',
          referralSource: user.referralSource || '',
          referralDetails: user.referralDetails || '',
          image: user.image || ''
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile data' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CompanyProfile, value: string | string[]) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleGoalToggle = (goal: string) => {
    setProfile(prev => ({
      ...prev,
      companyGoals: prev.companyGoals.includes(goal)
        ? prev.companyGoals.filter(g => g !== goal)
        : [...prev.companyGoals, goal]
    }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => ({ ...prev, image: data.url }))
      } else {
        throw new Error('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' })
    } finally {
      setIsUploading(false)
    }
  }

  const saveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          companyName: profile.companyName,
          companyRole: profile.companyRole,
          companySize: profile.companySize,
          industry: profile.industry,
          companyOneLiner: profile.companyOneLiner,
          companyGoals: profile.companyGoals,
          contactPersonName: profile.contactPersonName,
          contactPersonType: profile.contactPersonType,
          contactEmail: profile.contactEmail,
          contactWhatsapp: profile.contactWhatsapp,
          companyWebsite: profile.companyWebsite,
          calendlyLink: profile.calendlyLink,
          referralSource: profile.referralSource,
          referralDetails: profile.referralDetails,
          image: profile.image
        })
      })

      if (response.ok) {
        // Update session
        await update()
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setIsEditing(false) // Exit edit mode after successful save
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (session?.user?.role !== 'COMPANY') {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </button>
            
            {/* Edit/Save/Cancel buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Success/Error Messages */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
            {message.text}
          </motion.div>
        )}

        {/* Company Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
                {profile.image ? (
                  <img
                    src={profile.image}
                    alt="Company logo"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-3xl font-bold">
                    {profile.companyName?.charAt(0).toUpperCase() || profile.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Company Profile Content */}
          <div className="relative px-8 pb-8 pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Company Info */}
              <div className="lg:col-span-2">
                {/* Company Name & Role */}
                <div className="mb-6">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Company Name"
                      className="text-3xl font-bold text-gray-900 border-b border-gray-300 bg-transparent w-full focus:outline-none focus:border-blue-500 mb-2"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.companyName || 'Company Name'}</h1>
                  )}
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.companyOneLiner}
                      onChange={(e) => handleInputChange('companyOneLiner', e.target.value)}
                      placeholder="Company tagline or description"
                      className="text-lg text-gray-600 border-b border-gray-300 bg-transparent w-full focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-lg text-gray-600">
                      {profile.companyOneLiner || 'Company tagline or description'}
                    </p>
                  )}
                </div>

                {/* Company Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {isEditing ? (
                      <select
                        value={profile.companySize}
                        onChange={(e) => handleInputChange('companySize', e.target.value)}
                        className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select size</option>
                        {COMPANY_SIZES.map(size => (
                          <option key={size} value={size}>{size} employees</option>
                        ))}
                      </select>
                    ) : (
                      <span>{profile.companySize ? `${profile.companySize} employees` : 'Company size'}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {isEditing ? (
                      <select
                        value={profile.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{profile.industry || 'Industry'}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {isEditing ? (
                      <input
                        type="url"
                        value={profile.companyWebsite}
                        onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                        placeholder="company.com"
                        className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span>{profile.companyWebsite || 'Company website'}</span>
                    )}
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={profile.contactPersonName}
                          onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                          placeholder="Contact person name"
                          className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 w-full"
                        />
                      ) : (
                        <span className="text-gray-700">{profile.contactPersonName || 'Contact person name'}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="email"
                          value={profile.contactEmail}
                          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                          placeholder="contact@company.com"
                          className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 w-full"
                        />
                      ) : (
                        <span className="text-gray-700">{profile.contactEmail || 'contact@company.com'}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="tel"
                          value={profile.contactWhatsapp}
                          onChange={(e) => handleInputChange('contactWhatsapp', e.target.value)}
                          placeholder="+1234567890"
                          className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 w-full"
                        />
                      ) : (
                        <span className="text-gray-700">{profile.contactWhatsapp || 'Phone number'}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="url"
                          value={profile.calendlyLink}
                          onChange={(e) => handleInputChange('calendlyLink', e.target.value)}
                          placeholder="calendly.com/yourlink"
                          className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 w-full"
                        />
                      ) : (
                        <span className="text-gray-700">{profile.calendlyLink || 'Calendly link'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Info</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Your Role</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profile.companyRole}
                          onChange={(e) => handleInputChange('companyRole', e.target.value)}
                          placeholder="CEO, CTO, HR Manager..."
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-600">{profile.companyRole || 'Your role'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Company Goals</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {GOAL_OPTIONS.map(goal => (
                            <label key={goal} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={profile.companyGoals.includes(goal)}
                                onChange={() => handleGoalToggle(goal)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{goal}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {profile.companyGoals.length > 0 ? (
                            profile.companyGoals.map(goal => (
                              <span key={goal} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                {goal}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No goals selected</p>
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
    </div>
  )
}