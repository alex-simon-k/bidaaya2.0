'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Search, 
  Sparkles, 
  Users, 
  FileText, 
  Settings,
  Send,
  Briefcase,
  Eye,
  MessageSquare,
  Plus,
  TrendingUp,
  Activity,
  Zap,
  Crown,
  ChevronRight,
  Clock,
  Star
} from 'lucide-react'
import Link from 'next/link'

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'action'
  content: string
  timestamp: Date
  actionType?: 'search' | 'navigate' | 'info'
  data?: any
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  href: string
  prompt: string
}

export default function AIDashboardChat({ user }: { user: any }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: `👋 Hey ${user?.name || 'there'}! I'm your AI recruitment assistant. I can help you find talent, manage applications, or navigate your dashboard. What would you like to do today?`,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickActions: QuickAction[] = [
    {
      id: 'browse-projects',
      title: 'Browse Projects',
      description: 'View all your projects',
      icon: Briefcase,
      href: '/dashboard/projects',
      prompt: 'Show me my projects'
    },
    {
      id: 'view-applicants',
      title: 'View Applicants',
      description: 'See who applied',
      icon: Users,
      href: '/dashboard/projects',
      prompt: 'Show me recent applicants'
    },
    {
      id: 'manage-applications',
      title: 'Manage Applications', 
      description: 'Review and respond',
      icon: FileText,
      href: '/dashboard/projects',
      prompt: 'Help me manage applications'
    }
  ]

  const aiSuggestions = [
    "Find Computer Science students with high activity",
    "Show me marketing interns in Dubai", 
    "Find recent graduates interested in startups",
    "Search for active users from AUD",
    "Find students with business background"
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI processing
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(inputValue)
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = async (userInput: string): Promise<ChatMessage> => {
    const input = userInput.toLowerCase()

    // Handle navigation requests
    if (input.includes('project') && !input.includes('find') && !input.includes('search')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "I'll take you to your projects dashboard where you can view, edit, and manage all your projects.",
        timestamp: new Date(),
        actionType: 'navigate',
        data: { href: '/dashboard/projects', label: 'Go to Projects' }
      }
    }

    if (input.includes('applicant') || input.includes('application')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "Let me show you your recent applications and help you manage them efficiently.",
        timestamp: new Date(),
        actionType: 'navigate', 
        data: { href: '/dashboard/projects', label: 'View Applications' }
      }
    }

    // Handle talent search requests
    if (input.includes('find') || input.includes('search') || input.includes('student') || input.includes('talent')) {
      try {
        // Perform actual AI search
        const response = await fetch('/api/ai-matching/search-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userInput })
        })

        const data = await response.json()

        if (data.success && data.data.matches?.length > 0) {
          return {
            id: Date.now().toString(),
            type: 'ai',
            content: `🎯 Perfect! I found ${data.data.matches.length} candidates matching "${userInput}". Here are the top matches:`,
            timestamp: new Date(),
            actionType: 'search',
            data: { matches: data.data.matches.slice(0, 3), searchQuery: userInput }
          }
        }
      } catch (error) {
        console.error('Search failed:', error)
      }
    }

    // Default helpful response
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: `I understand you're asking about "${userInput}". I can help you with:
      
      🔍 **Finding Talent** - Search for candidates using natural language
      📋 **Managing Projects** - View and edit your job postings  
      👥 **Reviewing Applications** - See who's applied and their details
      ⚙️ **Platform Navigation** - Get around your dashboard quickly
      
      Try asking me something like "Find Computer Science students" or "Show me my recent applicants"!`,
      timestamp: new Date()
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user', 
      content: action.prompt,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    setTimeout(async () => {
      const aiResponse = await generateAIResponse(action.prompt)
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1000)
  }

  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'user') {
      return (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex justify-end mb-4"
        >
          <div className="max-w-xs lg:max-w-md px-4 py-2 bg-blue-600 text-white rounded-2xl rounded-br-sm">
            {message.content}
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-3 mb-4"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 max-w-xs lg:max-w-2xl">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
            <div className="whitespace-pre-wrap text-gray-800">{message.content}</div>
            
            {/* Action buttons */}
            {message.actionType === 'navigate' && message.data && (
              <Link
                href={message.data.href}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                {message.data.label}
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            {/* Search results */}
            {message.actionType === 'search' && message.data?.matches && (
              <div className="mt-4 space-y-3">
                {message.data.matches.map((match: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{match.candidate.name}</h4>
                      <span className="text-sm font-medium text-blue-600">{Math.round(match.overallScore)}/100</span>
                    </div>
                    {match.candidate.university && (
                      <p className="text-sm text-gray-600">{match.candidate.university}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{match.aiExplanation}</p>
                  </div>
                ))}
                
                <Link
                  href="/dashboard/ai-search-v2"
                  className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all results
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Dashboard</h1>
                <p className="text-sm text-gray-600">Your intelligent recruitment assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200/50">
                <span className="text-sm font-medium text-gray-700">15 credits</span>
              </div>
              <Link
                href="/subscription"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-12rem)] flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(renderMessage)}
                
                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask me to find talent, manage projects, or anything else..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* AI Suggestions */}
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">💡 Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setInputValue(suggestion)}
                        className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleQuickAction(action)}
                    className="w-full p-3 text-left border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <action.icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Dashboard Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Projects</span>
                  <span className="font-semibold text-gray-900">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Applications</span>
                  <span className="font-semibold text-green-600">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Credits Remaining</span>
                  <span className="font-semibold text-blue-600">15</span>
                </div>
              </div>
            </div>

            {/* AI Features */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200/50 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">AI Features</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>✨ Natural language search</p>
                <p>🎯 Smart candidate matching</p>
                <p>📊 Activity-based scoring</p>
                <p>💬 Conversational interface</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 