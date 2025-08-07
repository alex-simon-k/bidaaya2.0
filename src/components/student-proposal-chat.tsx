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
  ExternalLink
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
  const [applications, setApplications] = useState({ used: 2, limit: 10 })
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

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/student-chat/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: inputValue,
          userRole: 'STUDENT',
          userName: session?.user?.name,
          previousMessages: messages.slice(-5)
        })
      })

      if (response.ok) {
        const aiResponse = await response.json()
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiResponse.content,
          timestamp: new Date(),
          actionType: aiResponse.actionType,
          companies: aiResponse.companies
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt)
    setTimeout(() => handleSendMessage(), 100)
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
              className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden h-[600px] flex flex-col"
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Opportunity Search</h3>
                    <p className="text-blue-100 text-sm">Find projects and companies</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-gray-200 text-gray-900'
                      } rounded-2xl px-4 py-3 shadow-sm`}>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                        
                        {/* Company Suggestions */}
                        {message.companies && message.companies.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {message.companies.map((company) => (
                              <div key={company.id} className="bg-gray-50 rounded-lg p-3 border">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-600" />
                                    <h4 className="font-medium text-gray-900 text-sm">{company.name}</h4>
                                  </div>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {company.matchScore}% match
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{company.description}</p>
                                <button
                                  onClick={() => handleSendProposal(company)}
                                  className="w-full bg-blue-600 text-white text-xs py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Send Proposal (1 credit)
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">Searching...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Prompts */}
              {messages.length === 1 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
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
              )}

              {/* Chat Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Search for opportunities or companies..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

        {/* Stats Cards - Below Chat */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {/* Credits & Applications Combined */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {credits.plan}
              </span>
            </div>
            <h3 className="text-sm font-medium text-blue-600 mb-1">Credits & Applications</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Proposals</span>
                <span className="font-semibold text-blue-900">{credits.remaining}/{credits.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Applications</span>
                <span className="font-semibold text-blue-900">{applications.used}/{applications.limit}</span>
              </div>
            </div>
          </motion.div>

          {/* Profile Views - Mock Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100"
          >
            <div className="p-3 bg-green-100 rounded-xl mb-4 w-fit">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-green-600 mb-1">Profile Views</h3>
            <p className="text-2xl font-bold text-green-900">0</p>
            <p className="text-xs text-green-600">This week</p>
          </motion.div>

          {/* Success Rate - Mock Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100"
          >
            <div className="p-3 bg-purple-100 rounded-xl mb-4 w-fit">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-purple-600 mb-1">Response Rate</h3>
            <p className="text-2xl font-bold text-purple-900">0%</p>
            <p className="text-xs text-purple-600">From proposals</p>
          </motion.div>

          {/* Active Opportunities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100"
          >
            <div className="p-3 bg-orange-100 rounded-xl mb-4 w-fit">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-sm font-medium text-orange-600 mb-1">Live Opportunities</h3>
            <p className="text-2xl font-bold text-orange-900">{liveProjects.length}</p>
            <p className="text-xs text-orange-600">Available now</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 