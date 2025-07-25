'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Code2, 
  DollarSign, 
  Brain,
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface ProjectTemplate {
  category: 'MARKETING' | 'BUSINESS_DEVELOPMENT' | 'COMPUTER_SCIENCE' | 'FINANCE' | 'PSYCHOLOGY'
  subcategories: string[]
  icon: any
  color: string
  description: string
  commonRequirements: string[]
  commonDeliverables: string[]
  commonSkills: string[]
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    category: 'MARKETING',
    subcategories: ['Social Media Campaign', 'Content Creation', 'Market Research', 'Brand Strategy', 'Digital Marketing'],
    icon: TrendingUp,
    color: 'emerald',
    description: 'Drive brand awareness, engagement, and customer acquisition through creative marketing initiatives.',
    commonRequirements: [
      'Basic understanding of marketing principles',
      'Familiarity with social media platforms', 
      'Creative thinking and content creation skills',
      'Data analysis capabilities'
    ],
    commonDeliverables: [
      'Marketing strategy document',
      'Content calendar and posts',
      'Campaign performance report',
      'Market research findings'
    ],
    commonSkills: ['Marketing Strategy', 'Content Creation', 'Social Media', 'Analytics', 'Design']
  },
  {
    category: 'BUSINESS_DEVELOPMENT',
    subcategories: ['Lead Generation', 'Partnership Research', 'Sales Support', 'Market Expansion', 'Competitor Analysis'],
    icon: Users,
    color: 'blue',
    description: 'Accelerate business growth through strategic partnerships, lead generation, and market expansion.',
    commonRequirements: [
      'Strong communication and research skills',
      'Understanding of sales processes',
      'Analytical thinking and problem-solving',
      'Professional networking abilities'
    ],
    commonDeliverables: [
      'Lead generation database',
      'Partnership opportunities report',
      'Sales process documentation',
      'Market analysis presentation'
    ],
    commonSkills: ['Sales', 'Research', 'Communication', 'CRM', 'Networking']
  },
  {
    category: 'COMPUTER_SCIENCE',
    subcategories: ['Web Development', 'App Development', 'Data Analysis', 'Automation', 'AI/ML Projects'],
    icon: Code2,
    color: 'purple',
    description: 'Build innovative technical solutions, analyze data, and automate business processes.',
    commonRequirements: [
      'Programming experience (any language)',
      'Problem-solving and logical thinking',
      'Version control (Git) familiarity',
      'Testing and debugging skills'
    ],
    commonDeliverables: [
      'Working application or website',
      'Source code repository',
      'Technical documentation',
      'Testing and deployment guide'
    ],
    commonSkills: ['Programming', 'Problem Solving', 'Git', 'Testing', 'Documentation']
  },
  {
    category: 'FINANCE',
    subcategories: ['Financial Modeling', 'Investment Research', 'Budgeting Support', 'Risk Analysis', 'Financial Planning'],
    icon: DollarSign,
    color: 'green',
    description: 'Support financial decision-making through analysis, modeling, and strategic planning.',
    commonRequirements: [
      'Strong analytical and mathematical skills',
      'Excel/Google Sheets proficiency',
      'Understanding of financial concepts',
      'Attention to detail and accuracy'
    ],
    commonDeliverables: [
      'Financial models and projections',
      'Investment analysis reports',
      'Budget recommendations',
      'Risk assessment documentation'
    ],
    commonSkills: ['Excel', 'Financial Analysis', 'Modeling', 'Research', 'Presentation']
  },
  {
    category: 'PSYCHOLOGY',
    subcategories: ['User Research', 'Behavioral Analysis', 'HR Recruitment Support', 'UX Research', 'Survey Design'],
    icon: Brain,
    color: 'pink',
    description: 'Apply psychological insights to improve user experience, recruitment, and human behavior understanding.',
    commonRequirements: [
      'Understanding of research methodologies',
      'Data collection and analysis skills',
      'Strong communication abilities',
      'Empathy and people skills'
    ],
    commonDeliverables: [
      'Research findings and insights',
      'User personas and journey maps',
      'Survey results and analysis',
      'Recruitment recommendations'
    ],
    commonSkills: ['Research', 'Data Analysis', 'Communication', 'Psychology', 'Survey Design']
  }
]

export default function NewProjectPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    teamSize: 1,
    durationMonths: 3,
    experienceLevel: 'High School',
    timeCommitment: 'Part-time',
    requirements: [] as string[],
    deliverables: [] as string[],
    skillsRequired: [] as string[],
    compensation: '',
    location: '',
    remote: true,
    applicationDeadline: ''
  })

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setFormData(prev => ({
      ...prev,
      category: template.category,
      requirements: [...template.commonRequirements],
      deliverables: [...template.commonDeliverables],
      skillsRequired: [...template.commonSkills]
    }))
    setCurrentStep(2)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addToArray = (field: 'requirements' | 'deliverables' | 'skillsRequired', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
    }
  }

  const removeFromArray = (field: 'requirements' | 'deliverables' | 'skillsRequired', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    // Validation
    if (!formData.title || !formData.description) {
      setError('Please fill in all required fields')
      setIsLoading(false)
      return
    }

    try {
      const projectData = {
        ...formData,
        projectType: selectedTemplate ? 'Template' : 'Custom',
        applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline) : null
      }
      
      console.log('📤 Sending project data:', projectData)
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to create project'
        try {
          const errorData = await response.json()
          
          // Handle specific error cases
          if (errorData.code === 'USER_NOT_FOUND') {
            errorMessage = 'Your session has expired. Please sign out and sign back in to continue.'
          } else {
            errorMessage = errorData.error || errorData.message || errorMessage
          }
          
          if (errorData.details) {
            console.error('API Error Details:', errorData.details)
      }
        } catch (jsonError) {
          // If response is not JSON, use the status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      // Success - redirect to projects page
      console.log('✅ Project created successfully')
      router.push('/dashboard/projects')
    } catch (error) {
      console.error('❌ Project creation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create project. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session || !session.user || session.user.role !== 'COMPANY') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need a company account to create projects.</p>
        </div>
      </div>
    )
  }

  // Step 1: Template Selection
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
            <p className="text-gray-600">Choose a project category to get started with our proven templates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECT_TEMPLATES.map((template) => {
              const Icon = template.icon
              const colorStyles: Record<string, string> = {
                emerald: 'from-emerald-500 to-emerald-600',
                blue: 'from-blue-500 to-blue-600', 
                purple: 'from-purple-500 to-purple-600',
                green: 'from-green-500 to-green-600',
                pink: 'from-pink-500 to-pink-600'
              }
              const bgStyles: Record<string, string> = {
                emerald: 'bg-emerald-100 text-emerald-700',
                blue: 'bg-blue-100 text-blue-700',
                purple: 'bg-purple-100 text-purple-700', 
                green: 'bg-green-100 text-green-700',
                pink: 'bg-pink-100 text-pink-700'
              }
              const buttonStyles: Record<string, string> = {
                emerald: 'bg-emerald-600 hover:bg-emerald-700',
                blue: 'bg-blue-600 hover:bg-blue-700',
                purple: 'bg-purple-600 hover:bg-purple-700',
                green: 'bg-green-600 hover:bg-green-700', 
                pink: 'bg-pink-600 hover:bg-pink-700'
              }
              
              return (
                <motion.div
                  key={template.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-gray-200 transition-all duration-300"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className={`h-24 bg-gradient-to-r ${colorStyles[template.color]} flex items-center justify-center`}>
                    <Icon className="h-12 w-12 text-white" />
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {template.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {template.description}
                    </p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Popular subcategories:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.subcategories.slice(0, 3).map((sub) => (
                          <span
                            key={sub}
                            className={`px-2 py-1 text-xs rounded-full ${bgStyles[template.color]}`}
                          >
                            {sub}
                          </span>
                        ))}
                        {template.subcategories.length > 3 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                            +{template.subcategories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button className={`w-full py-2 px-4 ${buttonStyles[template.color]} text-white rounded-lg transition-colors font-medium`}>
                      Use This Template
                    </button>
                  </div>
                </motion.div>
              )
            })}

            {/* Custom Project Option - Pro/Premium Only */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-gray-200 transition-all duration-300"
              onClick={() => {
                setSelectedTemplate(null)
                setFormData(prev => ({
                  ...prev,
                  category: '',
                  projectType: 'Custom',
                  requirements: [],
                  deliverables: [],
                  skillsRequired: []
                }))
                setCurrentStep(2)
              }}
            >
              <div className="h-24 bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
                <Code2 className="h-12 w-12 text-white" />
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Custom Project
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                    PRO
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Create a completely custom project with your own requirements, categories, and specifications.
                </p>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Full flexibility:</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                      Any Category
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                      Custom Requirements
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                      Unique Deliverables
                    </span>
                  </div>
                </div>
                
                <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors font-medium">
                  Create Custom Project
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Project Details
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Change Template
          </button>
          <div className="flex items-center gap-3 mb-4">
            {selectedTemplate && (
              <>
                <selectedTemplate.icon className={`h-8 w-8 text-${selectedTemplate.color}-600`} />
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedTemplate.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Project
      </h1>
              </>
            )}
          </div>
          <p className="text-gray-600">Fill in the details for your project</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
          </label>
          <input
            type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Social Media Campaign for Product Launch"
            required
          />
        </div>

              {/* Custom Project Category Selection */}
              {!selectedTemplate && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="BUSINESS_DEVELOPMENT">Business Development</option>
                    <option value="COMPUTER_SCIENCE">Computer Science</option>
                    <option value="FINANCE">Finance</option>
                    <option value="PSYCHOLOGY">Psychology</option>
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description *
          </label>
          <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Describe what the project involves, goals, and context..."
            required
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Size
                </label>
                <select
                  value={formData.teamSize}
                  onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  {[1, 2, 3, 4, 5].map(size => (
                    <option key={size} value={size}>
                      {size} {size === 1 ? 'student' : 'students'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  value={formData.durationMonths}
                  onChange={(e) => handleInputChange('durationMonths', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value={1}>1 month</option>
                  <option value={2}>2 months</option>
                  <option value={3}>3 months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="High School">High School</option>
                  <option value="University">University</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>
            </div>

            {/* Requirements Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <div className="space-y-2">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="flex-1 text-sm text-gray-900 font-medium">{req}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('requirements', index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a requirement..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('requirements', e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Deliverables Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deliverables
              </label>
              <div className="space-y-2">
                {formData.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="flex-1 text-sm text-gray-900 font-medium">{deliverable}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('deliverables', index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a deliverable..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('deliverables', e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
              </div>
        </div>

        {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
        )}

            <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !formData.title || !formData.description}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  )
} 