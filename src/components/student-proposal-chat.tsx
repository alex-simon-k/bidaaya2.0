'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Sparkles, 
  Building2, 
  Search, 
  FileText, 
  Target,
  Star,
  Zap,
  MessageCircle,
  ArrowRight,
  Briefcase,
  Users,
  TrendingUp
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

export default function StudentProposalChat() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [credits, setCredits] = useState<StudentCredits>({ remaining: 5, total: 5, plan: 'FREE' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Welcome message
  useEffect(() => {
    if (session?.user) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `👋 **Welcome ${session.user.name || 'Student'}!**

I'm your personal career assistant. I can help you:

🔍 **Browse Projects** - Find internships and opportunities
💼 **Send Proposals** - Pitch yourself directly to companies
🎯 **Get Matched** - Find companies that align with your goals

What would you like to do today?`,
        timestamp: new Date(),
        actionType: 'guidance'
      }
      setMessages([welcomeMessage])
      loadStudentCredits()
    }
  }, [session])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadStudentCredits = async () => {
    try {
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setCredits(data)
      }
    } catch (error) {
      console.error('Failed to load credits:', error)
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
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
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

  const handleQuickAction = (action: string) => {
    setInputValue(action)
    setTimeout(() => handleSendMessage(), 100)
  }

  const handleSendProposal = async (company: CompanySuggestion) => {
    if (credits.remaining < 1) {
      const upgradeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `🚫 **Insufficient Credits**

You need at least 1 credit to send a proposal. You currently have ${credits.remaining} credits.

**Upgrade Options:**
- **Student Pro:** 20 credits/month for £5
- **Student Premium:** 50 credits/month for £10

Would you like to upgrade your plan?`,
        timestamp: new Date(),
        actionType: 'guidance'
      }
      setMessages(prev => [...prev, upgradeMessage])
      return
    }

    // Navigate to proposal form
    window.location.href = `/dashboard/send-proposal?company=${company.id}`
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Career Assistant</h1>
              <p className="text-sm text-gray-600">Find opportunities & send proposals</p>
            </div>
          </div>
          
          {/* Credits Display */}
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {credits.remaining}/{credits.total} Credits
            </span>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              {credits.plan}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickAction('Browse available projects')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            <Search className="h-4 w-4" />
            Browse Projects
          </button>
          <button
            onClick={() => handleQuickAction('I want to send a proposal to companies')}
            className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
          >
            <Building2 className="h-4 w-4" />
            Send Proposals
          </button>
          <button
            onClick={() => handleQuickAction('Help me find companies in tech industry')}
            className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
          >
            <Target className="h-4 w-4" />
            Find Companies
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200'
              } rounded-2xl px-4 py-3 shadow-sm`}>
                <div className="prose prose-sm max-w-none">
                  {message.content.split('\n').map((line, index) => (
                    <p key={index} className={`${
                      message.type === 'user' ? 'text-white' : 'text-gray-800'
                    } ${index === 0 ? 'mt-0' : ''} mb-2 last:mb-0`}>
                      {line}
                    </p>
                  ))}
                </div>
                
                {/* Company Suggestions */}
                {message.companies && message.companies.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.companies.map((company) => (
                      <div key={company.id} className="bg-gray-50 rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-600" />
                            <h4 className="font-medium text-gray-900">{company.name}</h4>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {company.industry}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs font-medium text-gray-600">
                              {company.matchScore}% match
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{company.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {company.size}
                            </span>
                            <span className={`flex items-center gap-1 ${
                              company.openToProposals ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                company.openToProposals ? 'bg-green-500' : 'bg-orange-500'
                              }`} />
                              {company.openToProposals ? 'Open to proposals' : 'Limited availability'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleSendProposal(company)}
                            disabled={!company.openToProposals}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              company.openToProposals
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <FileText className="h-3 w-3" />
                            Send Proposal
                            <span className="text-xs opacity-75">(1 credit)</span>
                          </button>
                        </div>
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
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about projects, companies, or career opportunities..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
} 