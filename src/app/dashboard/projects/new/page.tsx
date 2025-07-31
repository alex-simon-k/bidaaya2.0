'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { SubscriptionManager } from '@/lib/subscription-manager'
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
  AlertCircle,
  Building,
  Target,
  Lightbulb,
  UserCheck,
  Lock
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

type WorkType = 'VIRTUAL' | 'PART_TIME_IN_PERSON' | 'IN_PERSON'
type PaymentType = 'PAID' | 'UNPAID'
type HiringIntent = 'HIRING' | 'STANDALONE_INTERNSHIP' | 'INTERNSHIP_TO_JOB'

export default function NewProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rejectedId = searchParams.get('rejectedId')
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    companyName: session?.user?.name || '',
    category: '',
    subcategory: '',
    workType: 'VIRTUAL' as WorkType,
    paymentType: 'UNPAID' as PaymentType,
    paymentAmount: 0,
    hoursPerWeek: 8, // Max 8 for unpaid, customizable for paid
    teamSize: 1,
    durationMonths: 3,
    experienceLevel: 'High School',
    
    // New required fields
    definitionOfDone: '', // Clear goal/KPI
    problemStatement: '', // Current problem they're facing
    solutionDirection: '', // Solutions they're looking for
    hiringIntent: 'STANDALONE_INTERNSHIP' as HiringIntent,
    idealCandidateRequirements: [] as string[], // Key requirements
    
    // Terms acceptance
    agreesToPartTimeTerms: false,
    
    // Optional fields
    applicationDeadline: ''
  })

  // Load subscription data
  useEffect(() => {
    const loadSubscriptionData = async () => {
      if (session?.user) {
        try {
          const currentPlan = SubscriptionManager.getUserPlan(session.user as any)
          setSubscriptionData(currentPlan)
        } catch (error) {
          console.error('Failed to load subscription data:', error)
        }
      }
    }
    loadSubscriptionData()
  }, [session])

  // Load rejected project data if rejectedId is provided
  useEffect(() => {
    const loadRejectedProject = async () => {
      if (rejectedId && session?.user) {
        try {
          const response = await fetch(`/api/projects/${rejectedId}`)
          if (response.ok) {
            const project = await response.json()
            
            // Pre-fill form with rejected project data
            setFormData(prev => ({
              ...prev,
              title: project.title || '',
              category: project.category || '',
              subcategory: project.subcategory || '',
              workType: project.workType || 'VIRTUAL',
              paymentType: project.paymentType || 'UNPAID',
              paymentAmount: project.paymentAmount || 0,
              hoursPerWeek: project.hoursPerWeek || 8,
              teamSize: project.teamSize || 1,
              durationMonths: project.durationMonths || 3,
              experienceLevel: project.experienceLevel || 'High School',
              definitionOfDone: project.definitionOfDone || '',
              problemStatement: project.problemStatement || '',
              solutionDirection: project.solutionDirection || '',
              hiringIntent: project.hiringIntent || 'STANDALONE_INTERNSHIP',
              idealCandidateRequirements: project.idealCandidateRequirements || [],
              applicationDeadline: project.applicationDeadline || ''
            }))
            
            // Auto-select appropriate template if category matches
            const matchingTemplate = PROJECT_TEMPLATES.find(t => t.category === project.category)
            if (matchingTemplate) {
              setSelectedTemplate(matchingTemplate)
              setCurrentStep(2) // Skip template selection and go to form
            }
          } else {
            setError('Failed to load project data. Please try again.')
          }
        } catch (error) {
          console.error('Failed to load rejected project:', error)
          setError('Failed to load project data. Please try again.')
        }
      }
    }
    
    loadRejectedProject()
  }, [rejectedId, session])

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setFormData(prev => ({
      ...prev,
      category: template.category,
      idealCandidateRequirements: [...template.commonRequirements]
    }))
    setCurrentStep(2)
  }

  const handleCustomProjectSelect = () => {
    // Check if user has access to custom projects
    const hasCustomProjectAccess = subscriptionData?.features?.customProjectCreation || false
    
    if (!hasCustomProjectAccess) {
      setError('Custom projects require a Pro or Premium subscription. Please upgrade to access this feature.')
      return
    }

    setSelectedTemplate(null)
    setFormData(prev => ({
      ...prev,
      category: 'CUSTOM',
      idealCandidateRequirements: []
    }))
    setCurrentStep(2)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addToArray = (field: 'idealCandidateRequirements', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
    }
  }

  const removeFromArray = (field: 'idealCandidateRequirements', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    // Validation
    if (!formData.title || !formData.definitionOfDone || !formData.problemStatement || !formData.solutionDirection) {
      setError('Please fill in all required fields')
      setIsLoading(false)
      return
    }

    if (!formData.agreesToPartTimeTerms) {
      setError('Please agree to the part-time terms and conditions')
      setIsLoading(false)
      return
    }

    try {
      // Create description from the form fields to match API expectations
      const description = `${formData.problemStatement}\n\n${formData.solutionDirection}\n\nDefinition of Done: ${formData.definitionOfDone}`.trim()
      
      const projectData = {
        title: formData.title,
        description: description,
        category: formData.category,
        subcategory: formData.subcategory,
        projectType: selectedTemplate ? 'Template' : 'Custom',
        teamSize: formData.teamSize,
        durationMonths: formData.durationMonths,
        experienceLevel: formData.experienceLevel,
        timeCommitment: `${formData.hoursPerWeek} hours/week`,
        requirements: formData.idealCandidateRequirements,
        deliverables: [formData.definitionOfDone],
        skillsRequired: formData.idealCandidateRequirements,
        compensation: formData.paymentType === 'PAID' ? 'Paid' : 'Unpaid',
        paymentAmount: formData.paymentType === 'PAID' ? formData.paymentAmount : null,
        location: formData.workType === 'VIRTUAL' ? 'Remote' : 'On-site',
        remote: formData.workType === 'VIRTUAL',
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {rejectedId ? 'Recreate Your Project' : 'Create New Project'}
            </h1>
            <p className="text-gray-600">
              {rejectedId 
                ? 'Your project was rejected. Let\'s recreate it using our proven templates with better structure.'
                : 'Choose a project category to get started with our proven templates'
              }
            </p>
            {rejectedId && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm">
                  💡 <strong>Tip:</strong> We've pre-filled your form with the previous project data. Review and improve it using our template guidelines for better approval chances.
                </p>
              </div>
            )}
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

            {/* Custom Project Option - Subscription Gated */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: subscriptionData?.features?.customProjectCreation ? 1.02 : 1.0 }}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent transition-all duration-300 ${
                subscriptionData?.features?.customProjectCreation 
                  ? 'cursor-pointer hover:border-gray-200' 
                  : 'cursor-not-allowed opacity-75'
              }`}
              onClick={handleCustomProjectSelect}
            >
              <div className="h-24 bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center relative">
                <Code2 className="h-12 w-12 text-white" />
                {!subscriptionData?.features?.customProjectCreation && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Custom Project
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    subscriptionData?.features?.customProjectCreation 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {subscriptionData?.features?.customProjectCreation ? 'AVAILABLE' : 'PRO'}
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
                
                <button 
                  className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
                    subscriptionData?.features?.customProjectCreation
                      ? 'bg-gray-800 hover:bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!subscriptionData?.features?.customProjectCreation}
                >
                  {subscriptionData?.features?.customProjectCreation ? 'Create Custom Project' : 'Upgrade Required'}
                </button>
                
                {!subscriptionData?.features?.customProjectCreation && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Available with Pro or Premium subscription
                  </p>
                )}
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

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                  placeholder="Your company name"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Category
                </label>
                {formData.category === 'CUSTOM' ? (
                  <select
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="BUSINESS_DEVELOPMENT">Business Development</option>
                    <option value="COMPUTER_SCIENCE">Computer Science</option>
                    <option value="FINANCE">Finance</option>
                    <option value="PSYCHOLOGY">Psychology</option>
                    <option value="OTHER">Other (Custom)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedTemplate?.category.replace('_', ' ') || 'Custom'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                    readOnly
                  />
                )}
              </div>
            </div>
          </div>

          {/* Work Arrangement */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Work Arrangement</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Type *
                </label>
                <select
                  value={formData.workType}
                  onChange={(e) => handleInputChange('workType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="VIRTUAL">Virtual (Remote)</option>
                  <option value="PART_TIME_IN_PERSON">Part-time In-person</option>
                  <option value="IN_PERSON">In-person</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Structure *
                </label>
                <select
                  value={formData.paymentType}
                  onChange={(e) => {
                    const newPaymentType = e.target.value as PaymentType
                    handleInputChange('paymentType', newPaymentType)
                    // Reset hours to 8 if switching to unpaid
                    if (newPaymentType === 'UNPAID') {
                      handleInputChange('hoursPerWeek', 8)
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="UNPAID">Unpaid (Max 8 hours/week)</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              {/* Payment Amount - Only show when PAID is selected */}
              {formData.paymentType === 'PAID' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount (AED) *
                  </label>
                  <input
                    type="number"
                    value={formData.paymentAmount}
                    onChange={(e) => handleInputChange('paymentAmount', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="100"
                    placeholder="e.g. 3000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Total payment amount for the entire project duration in AED</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours per Week (per student) *
                </label>
                <input
                  type="number"
                  value={formData.hoursPerWeek}
                  onChange={(e) => handleInputChange('hoursPerWeek', parseInt(e.target.value) || 1)}
                  min="1"
                  max={formData.paymentType === 'UNPAID' ? 8 : 40}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
                {formData.paymentType === 'UNPAID' && (
                  <p className="text-xs text-gray-500 mt-1">Maximum 8 hours per week for unpaid projects</p>
                )}
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

            {/* Terms Agreement */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="partTimeTerms"
                  checked={formData.agreesToPartTimeTerms}
                  onChange={(e) => handleInputChange('agreesToPartTimeTerms', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />
                <label htmlFor="partTimeTerms" className="text-sm text-gray-700">
                  <span className="font-medium">I confirm this is a part-time project only.</span> This project is designed to be completed alongside students' studies and day-to-day activities, not as full-time employment.
                </label>
              </div>
            </div>
          </div>

          {/* Project Definition */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Project Definition</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Definition of Done / Key Goal *
              </label>
              <textarea
                value={formData.definitionOfDone}
                onChange={(e) => handleInputChange('definitionOfDone', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="What is the clear goal or KPI that would define this project as complete? e.g., 'Increase social media engagement by 25% within 3 months' or 'Build a working mobile app prototype with 5 core features'"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Problem Statement *
              </label>
              <textarea
                value={formData.problemStatement}
                onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="What is the current issue you're facing with this project/part of your business? Why are you looking to bring on a team? e.g., 'Our social media presence is declining and we lack the bandwidth to create consistent content...'"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solutions & Direction *
              </label>
              <textarea
                value={formData.solutionDirection}
                onChange={(e) => handleInputChange('solutionDirection', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="What solutions are you looking for? What direction do you want to go in? e.g., 'We want to develop a content strategy focused on LinkedIn and create a 3-month posting schedule with engaging visuals...'"
                required
              />
            </div>
          </div>

          {/* Hiring Intent */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Hiring Intent</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you looking for? *
              </label>
              <select
                value={formData.hiringIntent}
                onChange={(e) => handleInputChange('hiringIntent', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                required
              >
                <option value="STANDALONE_INTERNSHIP">Standalone Internship (project-based only)</option>
                <option value="INTERNSHIP_TO_JOB">Internship with Potential for Full-time Job</option>
                <option value="HIRING">Looking to Hire / Subcontractors</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This helps students understand the potential opportunity beyond the project
              </p>
            </div>
          </div>

          {/* Ideal Candidate Requirements */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">Ideal Candidate Requirements</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Requirements
              </label>
              <div className="space-y-2 mb-4">
                {formData.idealCandidateRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="flex-1 text-sm text-gray-900 font-medium">{req}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('idealCandidateRequirements', index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a key requirement..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('idealCandidateRequirements', e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Focus on the most important skills and qualities you're looking for. Press Enter to add each requirement.
              </p>
            </div>
          </div>

          {/* Optional Settings */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Optional Settings</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline (Optional)
              </label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t">
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
              disabled={isLoading || !formData.title || !formData.definitionOfDone || !formData.problemStatement || !formData.solutionDirection || !formData.agreesToPartTimeTerms}
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
        </div>
      </div>
    </div>
  )
} 