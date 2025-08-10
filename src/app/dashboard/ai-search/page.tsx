'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Building2,
  Search
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  projects?: any[]
  proposals?: Array<{ companyId?: string; companyName: string; proposal: string }>
  companies?: Array<{ id: string; name: string; description?: string; matchScore?: number }>
}

export default function AISearchPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add welcome message on load
  useEffect(() => {
    if (session?.user && messages.length === 0) {
      const isCompany = session.user.role === 'COMPANY'
      const userName = session.user.name?.split(' ')[0]
      
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: isCompany 
          ? `Hi ${userName}! I can help you find the perfect talent for your projects. Describe what skills you're looking for, the type of role, or your project requirements and I'll find matching candidates.`
          : `Hi ${userName}! I can help you find opportunities and connect with companies. What are you looking for today?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [session, messages.length])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: `user_${Date.now()}`,
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
          message: inputValue,
          previousMessages: messages.slice(-4).map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          type: 'assistant',
          content: data.content || 'I apologize, but I encountered an issue. Please try again.',
          timestamp: new Date(),
          projects: (data.projects || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            companyId: p.companyId,
            companyName: p.companyName,
            description: p.description || '',
            matchScore: 90
          })),
          proposals: (data.proposals || []).map((p: any) => ({
            companyId: p.companyId,
            companyName: p.companyName,
            proposal: p.proposal
          })),
          companies: (data.companies || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            matchScore: c.matchScore
          }))
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: 'assistant',
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

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt)
    // Auto-send the prompt
    setTimeout(() => handleSendMessage(), 100)
  }

  const handleApplyToProject = async (project: any) => {
    // Navigate to the project details page where the user can apply
    window.location.href = `/dashboard/projects/${project.id}`
  }

  const handleSendProposal = (target: { companyId?: string; companyName?: string; id?: string }) => {
    const id = target.companyId || target.id || (target.companyName ? target.companyName.toLowerCase().replace(/\s+/g, '-').slice(0, 50) : 'company')
    window.location.href = `/dashboard/send-proposal?company=${encodeURIComponent(id)}`
  }

  const isCompany = session?.user?.role === 'COMPANY'
  
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isCompany ? 'AI Talent Search' : 'AI Career Assistant'}
          </h1>
          <p className="text-gray-600">
            {isCompany 
              ? 'Find and connect with the perfect talent for your projects' 
              : 'Find opportunities and connect with companies using natural language'
            }
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Messages */}
        <div ref={chatContainerRef} className="space-y-6 mb-8">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {message.type === 'user' ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 bg-blue-50 rounded-lg p-4">
                      <div className="text-gray-900 whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      B
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">{message.content}</div>
                      
                      {/* Project Suggestions */}
                      {message.projects && message.projects.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {message.projects.map((project) => {
                            // Extract key info from description
                            const problemSection = project.description.split('**What You\'ll Do:**')[0]
                            const problem = problemSection.replace('**Problem Statement:**\n', '').trim()
                            const summary = problem.length > 150 ? problem.substring(0, 150) + '...' : problem
                            
                            return (
                              <div key={project.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                      <Building2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-base">{project.title}</h4>
                                      <p className="text-sm text-gray-600">{project.companyName}</p>
                                    </div>
                                  </div>
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {project.matchScore}% match
                                  </span>
                                </div>

                                {/* Summary */}
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">{summary}</p>

                                {/* Skills */}
                                {project.skills && project.skills.length > 0 && (
                                  <div className="mb-4">
                                    <div className="flex flex-wrap gap-2">
                                      {project.skills.slice(0, 3).map((skill: string, index: number) => (
                                        <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                                          {skill}
                                        </span>
                                      ))}
                                      {project.skills.length > 3 && (
                                        <span className="text-gray-500 text-xs">+{project.skills.length - 3} more</span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Action Button */}
                                <button
                                  onClick={() => handleApplyToProject(project)}
                                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                  Apply Now
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Proposal Suggestions */}
                      {message.proposals && message.proposals.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {message.proposals.map((p, idx) => (
                            <div key={`${p.companyId || p.companyName || idx}`} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all">
                              {/* Header */}
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-base">{p.companyName}</h4>
                                  <p className="text-sm text-gray-600">Potential collaboration opportunity</p>
                                </div>
                              </div>

                              {/* Proposal Text */}
                              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{p.proposal}</p>
                              </div>

                              {/* Action Button */}
                              <button
                                onClick={() => handleSendProposal({ companyId: p.companyId, companyName: p.companyName })}
                                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                              >
                                Send Proposal (1 credit)
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Company Suggestions (when proposals not provided) */}
                      {(!message.proposals || message.proposals.length === 0) && message.companies && message.companies.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {message.companies.map((company) => (
                            <div key={company.id} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-gray-500" />
                                  <h4 className="font-medium text-gray-900 text-sm">{company.name}</h4>
                                </div>
                                {company.matchScore && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{company.matchScore}% match</span>
                                )}
                              </div>
                              {company.description && <p className="text-xs text-gray-600 mb-3">{company.description}</p>}
                              <button
                                onClick={() => handleSendProposal({ id: company.id })}
                                className="w-full bg-purple-600 text-white text-sm py-2 rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                Send Proposal (1 credit)
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                B
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Searching opportunities...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts - Show when conversation just started */}
        {messages.length <= 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleSuggestedPrompt('Find projects for me')}
              className="text-left p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
            >
              <div className="text-blue-900 font-medium mb-1">Find a project</div>
              <div className="text-blue-700 text-sm">Discover internships and opportunities</div>
            </button>
            <button
              onClick={() => handleSuggestedPrompt('I want to send proposals. Find companies for me')}
              className="text-left p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
            >
              <div className="text-purple-900 font-medium mb-1">Send a proposal</div>
              <div className="text-purple-700 text-sm">Connect directly with companies</div>
            </button>
          </div>
        )}

        {/* Input Box */}
        <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about opportunities..."
                className="w-full bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-base"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 