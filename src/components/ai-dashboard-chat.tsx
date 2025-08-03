import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Sparkles, Send, User, Bot } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// AI Talent Search Integration
interface TalentProfile {
  id: string
  name: string
  email: string
  university?: string | null
  major?: string | null
  graduationYear?: number | null
  bio?: string | null
  location?: string | null
  goal?: string[]
  interests?: string[]
  image?: string | null
  activityScore: number
  responseRate: number
  engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  applicationsThisMonth: number
  totalApplications: number
}

interface AIMatchResult {
  candidate: TalentProfile
  aiScore: number
  activityScore: number
  relevanceScore: number
  overallScore: number
  aiExplanation: string
  strengths: string[]
  matchReasons: string[]
  contactCredits: number
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  actionType?: 'search' | 'navigate' | 'guidance' | 'project-creation'
  data?: any
}

export default function AIDashboardChat() {
  const { data: session } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [searchResults, setSearchResults] = useState<AIMatchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [credits, setCredits] = useState(15)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSendMessage = async (message: string, autoMode?: 'create-project' | 'find-talent') => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Generate AI response based on mode
      const aiResponse = await generateModeBasedResponse(message, autoMode)
      setMessages(prev => [...prev, aiResponse])

      // Handle different action types
      if (aiResponse.actionType === 'search') {
        await performTalentSearch(message)
      } else if (aiResponse.actionType === 'project-creation') {
        setTimeout(() => {
          router.push('/dashboard/projects/new')
        }, 2000)
      }
    } catch (error) {
      console.error('Error generating response:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateModeBasedResponse = async (input: string, mode?: 'create-project' | 'find-talent'): Promise<ChatMessage> => {
    const inputLower = input.toLowerCase()

    // Auto-detect mode if not provided
    if (!mode) {
      if (inputLower.includes('find') || inputLower.includes('search') || inputLower.includes('talent') || inputLower.includes('candidate')) {
        mode = 'find-talent'
      } else if (inputLower.includes('create') || inputLower.includes('post') || inputLower.includes('project') || inputLower.includes('job')) {
        mode = 'create-project'
      }
    }

    if (mode === 'create-project') {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎯 **Perfect! I'll help you create this project.**

Based on your description: "${input}"

I'm analyzing your requirements and preparing the project details:
• **Project Type**: ${inputLower.includes('internship') ? 'Internship Program' : inputLower.includes('full-time') ? 'Full-time Position' : 'Project-based Work'}
• **Duration**: ${inputLower.includes('month') ? 'Multi-month engagement' : inputLower.includes('week') ? 'Short-term project' : 'To be determined'}
• **Skills Needed**: ${inputLower.includes('marketing') ? 'Marketing & Social Media' : inputLower.includes('developer') || inputLower.includes('programming') ? 'Development & Technical' : inputLower.includes('design') ? 'Design & Creative' : 'General skills based on description'}

**Next Steps:**
1. **Redirecting you to project creation** in 2 seconds
2. **Your description will be pre-filled** for faster setup
3. **AI will suggest optimizations** for better applications

This will attract the right candidates and build your employer brand! 🚀`,
        timestamp: new Date(),
        actionType: 'project-creation',
        data: { 
          description: input,
          suggestedType: inputLower.includes('internship') ? 'internship' : 'project'
        }
      }
    }

    if (mode === 'find-talent') {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `🔍 **Excellent! I'll search for the perfect talent match.**

Analyzing your search: "${input}"

I'm using our advanced AI matching system to find:
• **Exact skill matches** for relevant experience
• **University/education filters** for quality candidates  
• **Activity levels** for responsive talent
• **Engagement scores** for reliable candidates

**🎯 Search Optimization:**
• Filtering by universities mentioned
• Matching major/field of study
• Prioritizing recent activity
• Relevance-first scoring (not just activity)

**Searching now...** This will cost 1-2 credits per contact reveal.`,
        timestamp: new Date(),
        actionType: 'search',
        data: { query: input }
      }
    }

    // General guidance
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: `I'm here to help with your recruitment needs! I can help you:

🎯 **Create Projects** - Describe what you need and I'll guide you through project creation
🔍 **Find Talent** - Search our database of 500+ active students and candidates
⚡ **Get Guidance** - Receive personalized hiring recommendations

What would you like to do today?`,
      timestamp: new Date(),
      actionType: 'guidance'
    }
  }

  const performTalentSearch = async (query: string) => {
    try {
      setIsLoading(true)
      setShowResults(false)

      const response = await fetch('/api/ai-matching/search-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          tier: 'FREE'
        })
      })

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setSearchResults(data.matches || [])
      setShowResults(true)
      setCredits(data.creditInfo?.availableCredits || credits - 1)

      // Add results summary message
      const resultsMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎉 **Found ${data.matches?.length || 0} excellent matches!**

${data.matches?.length > 0 ? 
  `I've analyzed **${data.searchMetadata?.candidatesEvaluated || 'multiple'}** candidates and selected the **top ${data.matches.length}** based on relevance and quality.

**💳 Credits:** ${credits} remaining | **📞 Contact reveals:** 1-2 credits each

**👆 Review the candidates above and click "Reveal Contact" for promising matches!**` : 
  `No exact matches found for this search. Try:
• Broader terms like "motivated students" or "active candidates"
• Specific universities: "Computer Science students at AUD"  
• Skills-based search: "Students with marketing experience"`}`,
        timestamp: new Date(),
        actionType: 'guidance'
      }
      setMessages(prev => [...prev, resultsMessage])

    } catch (error) {
      console.error('Search error:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: '❌ **Search encountered an error.** Please try again with different terms or contact support if the issue persists.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const revealContact = async (candidateId: string, cost: number) => {
    if (credits < cost) {
      alert('Insufficient credits. Please upgrade your plan.')
      return
    }

    try {
      const response = await fetch('/api/ai-matching/reveal-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      })

      if (!response.ok) throw new Error('Failed to reveal contact')

      const data = await response.json()
      setCredits(prev => prev - cost)
      
      alert(`Contact revealed!\nEmail: ${data.contact.email}${data.contact.whatsapp ? `\nWhatsApp: ${data.contact.whatsapp}` : ''}`)
    } catch (error) {
      console.error('Error revealing contact:', error)
      alert('Error revealing contact. Please try again.')
    }
  }

  // Auto-suggestion buttons
  const suggestionButtons = [
    {
      icon: Plus,
      label: "Create Project",
      description: "Post internships & job opportunities",
      action: () => handleSendMessage("I want to create a new project", 'create-project')
    },
    {
      icon: Search,
      label: "Find Talent", 
      description: "Search our database of 500+ candidates",
      action: () => handleSendMessage("I want to find talent", 'find-talent')
    }
  ]

  const firstName = session?.user?.name?.split(' ')[0] || 'there'
  const hasContent = input.trim() !== ""
  const hasMessages = messages.length > 0

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Credits Badge - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <Badge variant="outline" className="flex items-center gap-1 bg-gray-900 text-white border-gray-700">
          <Sparkles className="h-3 w-3" />
          {credits} credits
        </Badge>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full">
        
        {/* Welcome Header - Only show when no messages */}
        {!hasMessages && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              How can I help today?
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Type a command or ask a question
            </p>
          </motion.div>
        )}

        {/* Chat Messages Area */}
        {hasMessages && (
          <div className="flex-1 w-full max-h-[60vh] overflow-y-auto mb-8 space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-3xl ${message.type === 'user' ? 'ml-12' : 'mr-12'} flex items-start gap-3`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' ? 'bg-gray-900 order-2' : 'bg-gray-100'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div className={`rounded-2xl px-6 py-4 ${
                      message.type === 'user' 
                        ? 'bg-gray-900 text-white order-1' 
                        : 'bg-gray-50 border border-gray-200 text-gray-900'
                    }`}>
                      <div className="prose prose-sm max-w-none">
                        {message.content.split('\n').map((line, i) => (
                          <p key={i} className={`${i === 0 ? 'mt-0' : ''}`}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="max-w-3xl mr-12 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-8"
          >
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <Search className="h-5 w-5 text-gray-600" />
                Talent Search Results
              </h3>
              <div className="grid gap-4">
                {searchResults.map((result) => (
                  <div key={result.candidate.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            {result.candidate.image ? (
                              <img src={result.candidate.image} alt={result.candidate.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <span className="text-lg font-semibold text-gray-600">
                                {result.candidate.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{result.candidate.name}</h4>
                            <p className="text-sm text-gray-600">
                              {result.candidate.university} • {result.candidate.major}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{result.candidate.bio}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">Match: {result.overallScore.toFixed(0)}%</Badge>
                          <Badge variant="outline">Activity: {result.candidate.engagementLevel}</Badge>
                          <Badge variant="outline">{result.candidate.applicationsThisMonth} apps this month</Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600">{result.aiExplanation}</p>
                      </div>
                      
                      <div className="ml-4">
                        <Button
                          size="sm"
                          onClick={() => revealContact(result.candidate.id, result.contactCredits)}
                          className="bg-gray-900 hover:bg-gray-800 text-white"
                        >
                          Reveal Contact ({result.contactCredits} credits)
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: hasMessages ? 0 : 0.2 }}
          className="w-full space-y-6"
        >
          {/* Chat Input */}
          <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 overflow-hidden">
            <div className="flex items-end gap-3 p-6">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (hasContent) handleSendMessage(input);
                    }
                  }}
                  placeholder="Ask Zap a question..."
                  disabled={isLoading}
                  className="w-full bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none text-base leading-relaxed"
                  rows={1}
                />
              </div>
              
              <Button
                size="icon"
                className={`rounded-full transition-all duration-200 flex-shrink-0 ${
                  hasContent
                    ? "bg-white hover:bg-gray-100 text-gray-900 shadow-lg scale-100"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed scale-95"
                }`}
                onClick={() => {
                  if (hasContent) handleSendMessage(input);
                }}
                disabled={!hasContent || isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-gray-900 border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Suggestion Buttons - Only show when no messages */}
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-3 justify-center"
            >
              {suggestionButtons.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 border-gray-300 hover:bg-gray-50 flex items-center gap-3 text-left"
                  onClick={suggestion.action}
                  disabled={isLoading}
                >
                  <suggestion.icon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">{suggestion.label}</div>
                    <div className="text-sm text-gray-600">{suggestion.description}</div>
                  </div>
                </Button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 