import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'
import { Send, Lightbulb, Users, Briefcase, Search, Plus, Eye, ArrowRight, Sparkles, Bot, Building2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
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
  const [searchResults, setSearchResults] = useState<AIMatchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [credits, setCredits] = useState(15)
  const [currentMode, setCurrentMode] = useState<'create-project' | 'find-talent'>('create-project')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Welcome message
  useEffect(() => {
    if (session?.user && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'ai',
        content: `Hey there! 👋 I'm your AI recruitment assistant, ready to help ${session.user.name || 'your company'} find amazing talent and create perfect projects.

I can help you:
🎯 **Create Projects** - Describe your needs and I'll guide you through project creation
🔍 **Find Talent** - Search our database of 500+ active students and candidates  
⚡ **Strategic Guidance** - Get personalized hiring recommendations
📊 **Optimize Process** - Improve your recruitment workflow

**Choose an option below and describe what you need!**`,
        timestamp: new Date(),
        actionType: 'guidance'
      }
      setMessages([welcomeMessage])
    }
  }, [session, messages.length])

  const handleSendMessage = async (message: string, files?: File[]) => {
    if (!message.trim()) return

    // Extract mode and clean message
    let cleanMessage = message
    let messageMode = currentMode
    
    if (message.startsWith('[CREATE PROJECT]:')) {
      cleanMessage = message.replace('[CREATE PROJECT]:', '').trim()
      messageMode = 'create-project'
    } else if (message.startsWith('[FIND TALENT]:')) {
      cleanMessage = message.replace('[FIND TALENT]:', '').trim()
      messageMode = 'find-talent'
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: cleanMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Generate AI response based on mode
      const aiResponse = await generateModeBasedResponse(cleanMessage, messageMode, files)
      setMessages(prev => [...prev, aiResponse])

      // Handle different action types
      if (aiResponse.actionType === 'search') {
        await performTalentSearch(cleanMessage)
      } else if (aiResponse.actionType === 'project-creation') {
        // For now, just guide to project creation page
        // Later we can implement AI-powered project creation
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

  const generateModeBasedResponse = async (input: string, mode: 'create-project' | 'find-talent', files?: File[]): Promise<ChatMessage> => {
    const inputLower = input.toLowerCase()

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

    // Fallback
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: `I'm here to help with your recruitment needs! Please select either **Create Project** or **Find Talent** mode and describe what you need.`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* ChatGPT-style Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Recruitment Assistant</h1>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {session?.user?.name || 'Your Company'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {credits} credits
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Quick Action Buttons */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard/projects/new">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Create Project</h3>
                    <p className="text-sm text-gray-600">Post internships & job opportunities</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </motion.div>
            </Link>

            <Link href="/dashboard/projects">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">View Projects</h3>
                    <p className="text-sm text-gray-600">Manage active postings & applications</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="space-y-6 mb-8">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                  <div className={`rounded-2xl px-6 py-4 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    {message.type === 'ai' && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">AI Assistant</span>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className={`${i === 0 ? 'mt-0' : ''} ${message.type === 'user' ? 'text-white' : ''}`}>
                          {line}
                        </p>
                      ))}
                    </div>
                    
                    {/* Action Button */}
                    {message.actionType === 'navigate' && message.data?.href && (
                      <div className="mt-4">
                        <Link href={message.data.href}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            {message.data.label || 'Take Action'}
                          </Button>
                        </Link>
                      </div>
                    )}
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
              <div className="max-w-3xl mr-12">
                <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Talent Search Results
              </h3>
              <div className="grid gap-4">
                {searchResults.map((result) => (
                  <div key={result.candidate.id} className="border border-gray-200 rounded-xl p-4">
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
                          className="bg-blue-600 hover:bg-blue-700"
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

        {/* AI Prompt Input Box */}
        <div className="sticky bottom-8">
          <PromptInputBox
            onSend={handleSendMessage}
            isLoading={isLoading}
            mode={currentMode}
            onModeChange={setCurrentMode}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
} 