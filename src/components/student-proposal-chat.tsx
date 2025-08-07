'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Search, 
  Building2, 
  FileText, 
  Target,
  Star,
  Zap,
  MessageCircle,
  ArrowRight,
  Briefcase,
  Users,
  TrendingUp,
  Award,
  MapPin,
  ExternalLink,
  X
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  actionType?: 'browse_projects' | 'send_proposal' | 'guidance' | 'company_suggestions'
  companies?: CompanySuggestion[]
}

interface CompanySuggestion {
  id: string
  name: string
  industry: string
  size: string
  description: string
  openToProposals: boolean
  matchScore: number
}

interface StudentCredits {
  remaining: number
  total: number
  plan: string
}

interface LiveProject {
  id: string
  title: string
  company: string
  type: string
  location: string
  deadline: string
  applicants: number
}

interface FeaturedCompany {
  id: string
  name: string
  industry: string
  size: string
  logo: string
  hiring: boolean
}

export default function StudentProposalChat() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [credits, setCredits] = useState<StudentCredits>({ remaining: 5, total: 5, plan: 'FREE' })
  const [applications, setApplications] = useState({ used: 2, limit: 4 })
  const [liveProjects, setLiveProjects] = useState<LiveProject[]>([])
  const [featuredCompanies, setFeaturedCompanies] = useState<FeaturedCompany[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Welcome message
  useEffect(() => {
    if (session?.user) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Hi ${session.user.name?.split(' ')[0]}! I can help you find opportunities and connect with companies. What are you looking for today?`,
        timestamp: new Date(),
        actionType: 'guidance'
      }
      setMessages([welcomeMessage])
      loadStudentData()
    }
  }, [session])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadStudentData = async () => {
    try {
      // Load credits
      const creditsResponse = await fetch('/api/user/credits')
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        setCredits(creditsData)
      }

      // Load applications count
      const applicationsResponse = await fetch('/api/dashboard/stats')
      if (applicationsResponse.ok) {
        const stats = await applicationsResponse.json()
        setApplications({ used: stats.applications || 0, limit: 10 })
      }

      // Mock data for live projects and companies (using completely fictional names)
      setLiveProjects([
        {
          id: '1',
          title: 'Mobile App Development',
          company: 'TechFlow Solutions',
          type: 'Internship',
          location: 'Remote',
          deadline: '2024-08-15',
          applicants: 12
        },
        {
          id: '2',
          title: 'AI Research Assistant',
          company: 'DataVision Labs',
          type: 'Part-time',
          location: 'Dubai',
          deadline: '2024-08-20',
          applicants: 8
        },
        {
          id: '3',
          title: 'Marketing Analyst',
          company: 'Growth Partners',
          type: 'Full-time',
          location: 'Abu Dhabi',
          deadline: '2024-08-25',
          applicants: 15
        }
      ])

      setFeaturedCompanies([
        {
          id: 'comp-1',
          name: 'DataVision Labs',
          industry: 'AI & Machine Learning',
          size: '100-200',
          logo: '🤖',
          hiring: true
        },
        {
          id: 'comp-2', 
          name: 'MedTech Innovations',
          industry: 'Healthcare Technology',
          size: '20-50',
          logo: '🏥',
          hiring: true
        },
        {
          id: 'comp-3',
          name: 'PropTech Solutions',
          industry: 'Real Estate Tech',
          size: '100-200',
          logo: '🏢',
          hiring: false
        }
      ])

    } catch (error) {
      console.error('Failed to load student data:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return
    
    // Redirect to AI search page with the query
    window.location.href = `/dashboard/ai-search?q=${encodeURIComponent(inputValue)}`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    // Redirect to AI search page with the prompt
    window.location.href = `/dashboard/ai-search?q=${encodeURIComponent(prompt)}`
  }

  const handleSendProposal = async (company: CompanySuggestion) => {
    if (credits.remaining < 1) {
      const upgradeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `You need more credits to send proposals. Upgrade to get more credits.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, upgradeMessage])
      return
    }

    window.location.href = `/dashboard/send-proposal?company=${company.id}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Centered Welcome */}
      <div className="bg-white border-b border-gray-100 px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}
          </motion.h1>
          <p className="text-gray-600 text-lg">Ready to explore new opportunities?</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface - Takes 2 columns */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl"
            >
              {/* Simple Header */}
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Find your internship in <span className="font-black">one prompt</span>
                </h2>
                
                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search for opportunities or companies..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 bg-white"
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Suggested Prompts */}
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => handleSuggestedPrompt('Find a project for me')}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    Find a project for me
                  </button>
                  <button
                    onClick={() => handleSuggestedPrompt('Find a company for me')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                  >
                    Find a company for me
                  </button>
                </div>
              </div>

              {/* Monthly Usage Progress Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-4 mt-6 mx-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Monthly Usage</h3>
                  <span className="text-xs text-gray-500">Resets in 12 days</span>
                </div>
                
                <div className="space-y-3">
                  {/* Applications Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Applications</span>
                      <span className="text-xs font-medium text-gray-900">{applications.used}/{applications.limit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((applications.used / applications.limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Credits Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Direct Proposals</span>
                      <span className="text-xs font-medium text-gray-900">{credits.total - credits.remaining}/{credits.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((credits.total - credits.remaining) / credits.total) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-blue-200">
                  <button 
                    onClick={() => window.location.href = '/subscription'}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Upgrade Plan →
                  </button>
                </div>
              </motion.div>

              {/* Messages - Removed completely, now redirects to proper page */}
              {/* No more popup overlay - this now redirects to /dashboard/ai-search */}
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Live Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Live Projects</h3>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {liveProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{project.title}</h4>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {project.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{project.company}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {project.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project.applicants} applied
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => window.location.href = '/dashboard/projects'}
                className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Projects →
              </button>
            </motion.div>

            {/* Featured Companies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-gray-200 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Featured Companies</h3>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {featuredCompanies.map((company) => (
                  <div key={company.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{company.logo}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 text-sm">{company.name}</h4>
                          {company.hiring && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Hiring
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{company.industry}</p>
                        <p className="text-xs text-gray-500">{company.size} employees</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => handleSuggestedPrompt('Show me more companies')}
                className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Explore Companies →
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 