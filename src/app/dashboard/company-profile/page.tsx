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
  X
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

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => ({ ...prev, image: data.url }))
        setMessage({ type: 'success', text: 'Profile picture updated successfully' })
      } else {
        throw new Error('Failed to upload image')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      setMessage({ type: 'error', text: 'Failed to upload image' })
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
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
                <p className="text-gray-600">Manage your company information and settings</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Profile Picture Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {profile.image ? (
                      <img
                        src={profile.image}
                        alt="Company logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
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
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Company Logo</h3>
                  <p className="text-sm text-gray-600">Upload a logo for your company. Max size: 5MB</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Role/Job Title *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={profile.companyRole}
                      onChange={(e) => handleInputChange('companyRole', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. CEO, CTO, HR Manager"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Legal name of your organization"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <select
                      value={profile.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select company size</option>
                      {COMPANY_SIZES.map(size => (
                        <option key={size} value={size}>{size} employees</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <select
                      value={profile.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="url"
                      value={profile.companyWebsite}
                      onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Company Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company One-Liner *
                </label>
                <textarea
                  value={profile.companyOneLiner}
                  onChange={(e) => handleInputChange('companyOneLiner', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of what your company does..."
                />
              </div>

              {/* Company Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What are you looking to achieve with interns? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {GOAL_OPTIONS.map(goal => (
                    <label key={goal} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.companyGoals.includes(goal)}
                        onChange={() => handleGoalToggle(goal)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={profile.contactPersonName}
                        onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Primary contact person"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person Type
                    </label>
                    <select
                      value={profile.contactPersonType}
                      onChange={(e) => handleInputChange('contactPersonType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select type</option>
                      {CONTACT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={profile.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={profile.contactWhatsapp}
                        onChange={(e) => handleInputChange('contactWhatsapp', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+971 50 123 4567"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Contact Method for Students
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={profile.calendlyLink}
                        onChange={(e) => handleInputChange('calendlyLink', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://calendly.com/your-link OR any preferred contact link"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      📅 <strong>Flexible Contact Options:</strong> This can be your Calendly link, WhatsApp link, Google Meet link, specific email, or any other contact method you prefer students to use. This link will be included in all emails sent to students when you reach out to them.
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Profile
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-500">
                    All changes are saved automatically when you click Save Profile
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
