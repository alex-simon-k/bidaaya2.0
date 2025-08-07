'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Building2, 
  User, 
  Star, 
  FileText, 
  Send, 
  ArrowLeft,
  Lightbulb,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface ProposalData {
  companyId: string
  personalIntro: string
  proudAchievement: string
  valueProposition: string
  specificRole: string
  availability: string
  portfolio: string
}

interface CompanyInfo {
  id: string
  name: string
  industry: string
  size: string
  description: string
}

export default function SendProposalPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('company')

  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState<ProposalData>({
    companyId: companyId || '',
    personalIntro: '',
    proudAchievement: '',
    valueProposition: '',
    specificRole: '',
    availability: '',
    portfolio: ''
  })

  useEffect(() => {
    if (companyId) {
      loadCompanyInfo(companyId)
    }
  }, [companyId])

  const loadCompanyInfo = async (id: string) => {
    // For now, use mock data - in production this would be an API call
    const mockCompanies: { [key: string]: CompanyInfo } = {
      'comp-tech-1': {
        id: 'comp-tech-1',
        name: 'TechFlow Solutions',
        industry: 'Technology',
        size: '50-100 employees',
        description: 'Innovative fintech startup building next-generation payment solutions.'
      },
      'comp-consulting-1': {
        id: 'comp-consulting-1',
        name: 'Strategy Plus Consulting',
        industry: 'Consulting',
        size: '200-500 employees',
        description: 'Management consulting firm specializing in digital transformation.'
      }
    }

    setCompany(mockCompanies[id] || {
      id,
      name: 'Selected Company',
      industry: 'Various',
      size: 'Unknown',
      description: 'Exciting company looking for talented individuals.'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // First, spend a credit
      const creditResponse = await fetch('/api/user/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'spend',
          amount: 1,
          type: 'proposal_submission'
        })
      })

      if (!creditResponse.ok) {
        const creditError = await creditResponse.json()
        throw new Error(creditError.error || 'Failed to process credits')
      }

      // Submit the proposal
      const response = await fetch('/api/proposals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        throw new Error('Failed to submit proposal')
      }
    } catch (error) {
      console.error('Error submitting proposal:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit proposal')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProposalData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Sent!</h1>
          <p className="text-gray-600 mb-6">
            Your proposal has been sent to {company?.name}. They'll review it and get back to you soon.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/dashboard/send-proposal')}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Send Another Proposal
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Send Proposal</h1>
            <p className="text-gray-600">Craft a compelling proposal to stand out</p>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span>{company.industry}</span>
                <span>•</span>
                <span>{company.size}</span>
              </div>
              <p className="text-gray-700 mt-2">{company.description}</p>
            </div>
            <div className="bg-yellow-50 px-3 py-1 rounded-lg">
              <span className="text-sm font-medium text-yellow-700">1 Credit</span>
            </div>
          </div>
        </div>

        {/* Proposal Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Introduction */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Introduction</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Introduce yourself briefly. What's your background and what drives you?
            </p>
            <textarea
              value={formData.personalIntro}
              onChange={(e) => handleInputChange('personalIntro', e.target.value)}
              placeholder="Hi! I'm a Computer Science student passionate about fintech and creating innovative solutions..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Proud Achievement */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">Something You're Proud Of</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Share a project, achievement, or experience that showcases your abilities.
            </p>
            <textarea
              value={formData.proudAchievement}
              onChange={(e) => handleInputChange('proudAchievement', e.target.value)}
              placeholder="I built a mobile app that helps students track expenses, gaining 1000+ users and winning our university's innovation award..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Value Proposition */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">How You Can Benefit The Company</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Explain the specific value you'd bring and how you can help them achieve their goals.
            </p>
            <textarea
              value={formData.valueProposition}
              onChange={(e) => handleInputChange('valueProposition', e.target.value)}
              placeholder="I can contribute fresh perspectives on user experience design and help develop mobile-first solutions that appeal to younger demographics..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Specific Role Interest */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">What Role Interests You</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              What specific position or type of work would you like to do with them?
            </p>
            <input
              type="text"
              value={formData.specificRole}
              onChange={(e) => handleInputChange('specificRole', e.target.value)}
              placeholder="Frontend Developer Intern, Product Manager, UX Designer..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Availability</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              When are you available and what's your preferred commitment level?
            </p>
            <input
              type="text"
              value={formData.availability}
              onChange={(e) => handleInputChange('availability', e.target.value)}
              placeholder="Available immediately, 20 hours/week, Summer 2024, After graduation..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Portfolio/Links */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Portfolio & Links (Optional)</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Share links to your portfolio, GitHub, LinkedIn, or relevant work.
            </p>
            <textarea
              value={formData.portfolio}
              onChange={(e) => handleInputChange('portfolio', e.target.value)}
              placeholder="Portfolio: https://myportfolio.com
GitHub: https://github.com/username
LinkedIn: https://linkedin.com/in/username"
              className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Send?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This proposal will cost 1 credit and will be sent directly to {company.name}'s inbox. 
                  Make sure you've reviewed everything carefully.
                </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {isLoading ? 'Sending...' : 'Send Proposal (1 Credit)'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 