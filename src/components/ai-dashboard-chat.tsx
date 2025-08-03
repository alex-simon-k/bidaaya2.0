import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'
import { Search, Plus, Sparkles } from 'lucide-react'
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

  const firstName = session?.user?.name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
      {/* Credits Badge - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <Badge variant="outline" className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border-white/20">
          <Sparkles className="h-3 w-3" />
          {credits} credits
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Hey, welcome back {firstName}! 👋
          </h1>
          <p className="text-xl text-white/80 max-w-2xl">
            Ready to find amazing talent or create your next project? Just describe what you need below.
          </p>
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-4xl space-y-8"
        >
          
          {/* Chat Messages - Only show if there are any */}
          {messages.length > 0 && (
            <div className="space-y-6 mb-8 max-h-[50vh] overflow-y-auto">
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
                          ? 'bg-white text-gray-900' 
                          : 'bg-white/90 backdrop-blur-sm text-gray-900'
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
                  <div className="max-w-3xl mr-12">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4">
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
          )}

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <Search className="h-5 w-5 text-blue-600" />
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
          <div className="w-full">
            <PromptInputBox
              onSend={handleSendMessage}
              isLoading={isLoading}
              mode={currentMode}
              onModeChange={setCurrentMode}
              className="w-full bg-white border-white shadow-2xl"
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
} 