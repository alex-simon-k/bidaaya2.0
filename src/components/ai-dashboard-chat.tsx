import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Sparkles, Send, User, Bot, Zap, Crown, Brain, Target, Activity, X, ArrowLeft } from 'lucide-react'
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
  // Key database fields for better matching
  education?: string | null
  subjects?: string | null
  dateOfBirth?: Date | string | null
  mena?: boolean | null
  lastActiveAt?: Date | string | null
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
  const [isAnimatingInput, setIsAnimatingInput] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Chat persistence key
  const CHAT_STORAGE_KEY = `bidaaya_chat_${session?.user?.id || 'anonymous'}`
  
  // Save messages to localStorage
  const saveMessagesToStorage = (messages: ChatMessage[]) => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch (error) {
      console.error('Failed to save chat messages:', error)
    }
  }

  // Load messages from localStorage
  const loadMessagesFromStorage = (): ChatMessage[] => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY)
      if (stored) {
        const parsedMessages = JSON.parse(stored)
        // Convert timestamp strings back to Date objects
        return parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error)
    }
    return []
  }

  // Clear messages from localStorage
  const clearMessagesFromStorage = () => {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear chat messages:', error)
    }
  }

  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current) return
    
    // Only auto-scroll if user is near the bottom or force is true
    const container = messagesEndRef.current.closest('.overflow-y-auto')
    if (container) {
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100
      
      if (force || isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      // Fallback if container not found
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    // Only force scroll for the first message or if we have very few messages
    const shouldForceScroll = messages.length <= 2
    scrollToBottom(shouldForceScroll)
  }, [messages])

  // Load chat history on component mount
  useEffect(() => {
    if (session?.user?.id) {
      const savedMessages = loadMessagesFromStorage()
      if (savedMessages.length > 0) {
        setMessages(savedMessages)
        console.log(`📚 Restored ${savedMessages.length} chat messages`)
      }
    }
  }, [session?.user?.id])

  // Save messages whenever they change (but only if we have messages)
  useEffect(() => {
    if (messages.length > 0 && session?.user?.id) {
      saveMessagesToStorage(messages)
    }
  }, [messages, session?.user?.id])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSendMessage = async (message: string, autoMode?: 'create-project' | 'find-talent', withAnimation = false) => {
    if (!message.trim() || isProcessing) return

    setIsProcessing(true)

    // Start transition animation if this is the first message
    const isFirstMessage = messages.length === 0
    if (isFirstMessage) {
      setIsTransitioning(true)
    }

    if (withAnimation) {
      setIsAnimatingInput(true)
      setInput(message)
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsAnimatingInput(false)
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Complete transition after message is added
    if (isFirstMessage) {
      setTimeout(() => setIsTransitioning(false), 800)
    }

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
      setIsProcessing(false)
    }
  }

  const generateModeBasedResponse = async (input: string, mode?: 'create-project' | 'find-talent'): Promise<ChatMessage> => {
    try {
      console.log('🤖 Attempting AI chat API call for:', input)
      
      // Use the new AI service for intelligent responses
      const response = await fetch('/api/ai-chat/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: input,
          userRole: session?.user?.role || 'COMPANY',
          userName: session?.user?.id,
          detectedIntent: mode,
          previousMessages: messages.slice(-3) // Last 3 messages for context
        })
      })

      console.log('🤖 AI API response status:', response.status)

      if (response.ok) {
        const aiResponse = await response.json()
        console.log('✅ AI response received:', aiResponse.actionType)
        return {
          id: Date.now().toString(),
          type: 'ai',
          content: aiResponse.content,
          timestamp: new Date(),
          actionType: aiResponse.actionType,
          data: aiResponse.data
        }
      } else {
        const errorText = await response.text()
        console.error('❌ AI API error:', response.status, errorText)
      }
    } catch (error) {
      console.error('❌ Error generating AI response:', error)
    }

    console.log('🔄 Using fallback response')
    // Fallback to original logic if AI service fails
    return getFallbackResponse(input, mode)
  }

  const getFallbackResponse = (input: string, mode?: 'create-project' | 'find-talent'): ChatMessage => {
    const inputLower = input.toLowerCase()

    // Auto-detect mode if not provided
    if (!mode) {
      if (inputLower.includes('find') || inputLower.includes('search') || inputLower.includes('talent') || 
          inputLower.includes('candidate') || inputLower.includes('students') || inputLower.includes('aud') ||
          inputLower.includes('aus') || inputLower.includes('university')) {
        mode = 'find-talent'
      } else if (inputLower.includes('create') || inputLower.includes('post') || inputLower.includes('project') || inputLower.includes('job')) {
        mode = 'create-project'
      }
    }

    // Add debug logging
    console.log('🔄 Fallback mode detected:', mode, 'for input:', input)

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
      // Extract key details from the query for more personalized response
      const university = inputLower.includes('aud') ? 'American University of Dubai (AUD)' : 
                        inputLower.includes('aus') ? 'American University of Sharjah (AUS)' :
                        inputLower.includes('university') ? 'specific universities' : 'top universities'
      
      const field = inputLower.includes('business') ? 'Business Development' :
                   inputLower.includes('marketing') ? 'Marketing' :
                   inputLower.includes('computer') || inputLower.includes('cs') ? 'Computer Science' :
                   inputLower.includes('engineering') ? 'Engineering' : 'relevant fields'

      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `🔍 **Perfect! Searching for ${field} talent${university !== 'top universities' ? ` from ${university}` : ''}.**

Analyzing your request: "${input}"

I'm using our advanced AI matching system to find:
• **${field} students** with relevant experience
• **${university} candidates** for quality assurance
• **Active students** with high engagement levels
• **Business-focused profiles** matching your needs

**🎯 Search Strategy:**
• Filtering by university: ${university}
• Matching field of study: ${field}
• Prioritizing recent activity and response rates
• Relevance-first scoring for quality matches

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

      const response = await fetch('/api/test-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          limit: 20
        })
      })

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      
      // Transform results to match existing UI structure (what display code expects)
      const transformedResults = data.results?.map((result: any) => ({
        candidate: {
          id: result.student.id,
          name: result.student.name,
          email: result.student.email,
          university: result.student.university,
          major: result.student.major,
          skills: Array.isArray(result.student.skills) ? result.student.skills : [result.student.skills].filter(Boolean),
          location: result.student.location,
          graduationYear: result.student.graduationYear,
          interests: result.student.interests || [],
          goal: result.student.goal || [],
          bio: result.student.bio || `${result.student.major || 'Student'} at ${result.student.university || 'University'}`,
          education: result.student.education,
          subjects: result.student.subjects,
          dateOfBirth: result.student.dateOfBirth,
          mena: result.student.mena,
          lastActiveAt: result.student.lastActiveAt,
          image: null,
          engagementLevel: result.student.activityScore > 70 ? 'High' : 
                          result.student.activityScore > 40 ? 'Medium' : 'Low',
          applicationsThisMonth: 0
        },
        overallScore: result.matching.score,
        matchScore: result.matching.score,
        matchReasons: result.matching.reasons,
        activityScore: result.student.activityScore,
        overallRating: result.matching.overallRating,
        contactCredits: 1,
        aiExplanation: result.matching.reasons.join(', ')
      })) || []

      setSearchResults(transformedResults)
      setShowResults(true)
      // Don't decrease credits for intelligent search since it's automated processing
      // setCredits(credits - 1)

      // Add results summary message
      const resultsMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎉 **Found ${transformedResults.length} excellent matches!**

${transformedResults.length > 0 ? 
  `I've analyzed **${data.searchMetadata?.candidatesEvaluated || 'multiple'}** candidates and selected the **top ${transformedResults.length}** based on relevance and quality.

**💳 Credits:** ${credits} remaining | **📞 Contact reveals:** 1 credit each

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
      const response = await fetch('/api/ai-matching/search-v2', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reveal_contact',
          candidateId,
          creditsToSpend: cost 
        })
      })

      if (!response.ok) throw new Error('Failed to reveal contact')

      const data = await response.json()
      setCredits(data.creditsRemaining || credits - cost)
      
      // Update the search results to show revealed contact
      setSearchResults(prev => prev.map(result => 
        result.candidate.id === candidateId 
          ? { ...result, contactRevealed: true, contact: data.data }
          : result
      ))

      // Add a concise success message with delay to prevent immediate scroll
      setTimeout(() => {
        const contactMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: `✅ **Contact revealed for ${data.data?.name || 'candidate'}!**
          
📧 **Email:** ${data.data?.email}
${data.data?.whatsapp ? `📱 **WhatsApp:** ${data.data.whatsapp}` : ''}

Use "Send Calendar Invite" to schedule an interview automatically.`,
          timestamp: new Date(),
          actionType: 'guidance'
        }
        setMessages(prev => [...prev, contactMessage])
      }, 300)
      
    } catch (error) {
      console.error('Error revealing contact:', error)
      alert('Error revealing contact. Please try again.')
    }
  }

  const sendCalendarInvite = async (candidateId: string, candidateEmail: string, candidateName: string) => {
    try {
      const response = await fetch('/api/contact/send-calendar-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          candidateId,
          candidateEmail,
          candidateName
        })
      })

      if (!response.ok) throw new Error('Failed to send calendar invite')

      const data = await response.json()
      
      // Add success message
      const inviteMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `📅 **Calendar invite sent to ${candidateName}!**
        
✅ **Email sent to:** ${candidateEmail}
🔗 **Calendly link included in email**
📧 **Company contact:** Your email is CC'd for reference

The candidate will receive a professional email with your calendar link and can book a time that works for both of you.`,
        timestamp: new Date(),
        actionType: 'guidance'
      }
      setMessages(prev => [...prev, inviteMessage])
      
    } catch (error) {
      console.error('Error sending calendar invite:', error)
      alert('Error sending calendar invite. Please try again.')
    }
  }

  // Auto-suggestion buttons
  const suggestionButtons = [
    {
      icon: Plus,
      label: "Create Project",
      description: "Post internships & job opportunities",
      action: () => handleSendMessage("I want to create a new project", 'create-project', true)
    },
    {
      icon: Search,
      label: "Find Talent", 
      description: "Search our database of 500+ candidates",
      action: () => handleSendMessage("I want to find talent", 'find-talent', true)
    }
  ]

  // Quick search examples
  const quickSearches = [
    "Computer Science students at AUD",
    "Marketing interns with high activity", 
    "Business students ready for internships",
    "Active users in Dubai",
    "Recent graduates interested in startups"
  ]

  const firstName = session?.user?.name?.split(' ')[0] || 'there'
  const hasContent = input.trim() !== ""
  const hasMessages = messages.length > 0

  // Function to reset chat and return to main view
  const resetChat = () => {
    setMessages([])
    setSearchResults([])
    setShowResults(false)
    setInput('')
    setIsLoading(false)
    setIsProcessing(false)
    setIsAnimatingInput(false)
    setIsTransitioning(false)
    clearMessagesFromStorage()
    console.log('🗑️ Chat history cleared')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasMessages && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetChat}
                  className="mr-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              )}
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Recruitment Assistant</h1>
                <p className="text-sm text-gray-600">Find perfect candidates & create projects effortlessly</p>
              </div>
            </div>
            
            {/* Credit Display */}
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200/50">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {credits} credits
                  </span>
                  <span className="text-xs text-gray-500">(FREE)</span>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                Upgrade
              </motion.button>
              
              {hasMessages && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetChat}
                  className="ml-2 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container with ChatGPT-like Layout */}
      <motion.div 
        className={`${hasMessages ? 'h-[calc(100vh-88px)]' : 'min-h-screen'} flex flex-col`}
        layout
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {hasMessages ? (
          // Full Chat Layout 
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="max-w-4xl mx-auto space-y-6">
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
                          message.type === 'user' ? 'bg-gray-900 order-2' : 'bg-blue-100'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <Brain className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        
                        {/* Message Content */}
                        <div className={`rounded-2xl px-6 py-4 ${
                          message.type === 'user' 
                            ? 'bg-gray-900 text-white order-1' 
                            : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
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
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Brain className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
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

                {/* Search Results in Chat Mode - NOW INSIDE SCROLLABLE AREA */}
                {showResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="w-full max-w-4xl mr-12 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Search className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex-1">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                          <Search className="h-5 w-5 text-blue-600" />
                          Found {searchResults.length} Students
                        </h3>
                        <div className="grid gap-4">
                          {searchResults.map((result) => (
                            <div key={result.candidate.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                      <span className="text-lg font-semibold text-white">
                                        {result.candidate.name.charAt(0)}
                                      </span>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">{result.candidate.name}</h4>
                                      <p className="text-sm text-gray-600">
                                        {result.candidate.university} • {result.candidate.major}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Key Student Information */}
                                  <div className="text-sm text-gray-700 mb-3 bg-white rounded-lg p-3 border space-y-2">
                                    {/* Education & Institution */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="font-medium text-gray-900">Education: {result.candidate.education || 'Not specified'}</p>
                                        {result.candidate.university && (
                                          <p className="text-gray-600 text-xs">Institution: {result.candidate.university}</p>
                                        )}
                                      </div>
                                      <div>
                                        {result.candidate.dateOfBirth && (
                                          <p className="font-medium text-gray-900">
                                            Age: {new Date().getFullYear() - new Date(result.candidate.dateOfBirth).getFullYear()}
                                          </p>
                                        )}
                                        {result.candidate.mena && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                            🌍 MENA Based
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Studies & Subjects */}
                                    {(result.candidate.major || result.candidate.subjects) && (
                                      <div>
                                        <p className="font-medium text-gray-900">Studies:</p>
                                        {result.candidate.major && <p className="text-gray-600 text-sm">Major: {result.candidate.major}</p>}
                                        {result.candidate.subjects && <p className="text-gray-600 text-sm">Subjects: {result.candidate.subjects}</p>}
                                      </div>
                                    )}

                                    {/* Goals & Interests */}
                                    <div className="grid grid-cols-2 gap-4">
                                      {result.candidate.goal && result.candidate.goal.length > 0 && (
                                        <div>
                                          <p className="font-medium text-gray-900">Goals:</p>
                                          <p className="text-gray-600 text-sm">{result.candidate.goal.join(', ')}</p>
                                        </div>
                                      )}
                                      {result.candidate.interests && result.candidate.interests.length > 0 && (
                                        <div>
                                          <p className="font-medium text-gray-900">Interests:</p>
                                          <p className="text-gray-600 text-sm">{result.candidate.interests.join(', ')}</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Bio */}
                                    {result.candidate.bio && (
                                      <div>
                                        <p className="font-medium text-gray-900">About:</p>
                                        {(() => {
                                          // Enhanced detection for discovery quiz JSON data
                                          const bio = result.candidate.bio
                                          const isJsonData = bio.startsWith('{') && 
                                            (bio.includes('discoveryProfile') || 
                                             bio.includes('skills') || 
                                             bio.includes('careerGoals') || 
                                             bio.includes('workPreferences') ||
                                             bio.includes('industries') ||
                                             bio.includes('experienceLevel'))
                                          
                                          if (isJsonData) {
                                            try {
                                              const discoveryData = JSON.parse(bio)
                                              const profile = discoveryData.discoveryProfile || discoveryData
                                              
                                              return (
                                                <div className="text-sm text-gray-600 space-y-1">
                                                  {profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && (
                                                    <p><span className="font-medium">Skills:</span> {profile.skills.join(', ')}</p>
                                                  )}
                                                  {profile.careerGoals && Array.isArray(profile.careerGoals) && profile.careerGoals.length > 0 && (
                                                    <p><span className="font-medium">Career Goals:</span> {profile.careerGoals.join(', ')}</p>
                                                  )}
                                                  {profile.workPreferences && (
                                                    <div>
                                                      {profile.workPreferences.projectDuration && (
                                                        <p><span className="font-medium">Preferred Duration:</span> {profile.workPreferences.projectDuration}</p>
                                                      )}
                                                      {profile.workPreferences.teamSize && (
                                                        <p><span className="font-medium">Team Preference:</span> {profile.workPreferences.teamSize}</p>
                                                      )}
                                                      {profile.workPreferences.workStyle && (
                                                        <p><span className="font-medium">Work Style:</span> {profile.workPreferences.workStyle}</p>
                                                      )}
                                                    </div>
                                                  )}
                                                  {profile.industries && Array.isArray(profile.industries) && profile.industries.length > 0 && (
                                                    <p><span className="font-medium">Industry Interests:</span> {profile.industries.join(', ')}</p>
                                                  )}
                                                  {profile.experienceLevel && (
                                                    <p><span className="font-medium">Experience Level:</span> {profile.experienceLevel}</p>
                                                  )}
                                                  {profile.learningGoals && Array.isArray(profile.learningGoals) && profile.learningGoals.length > 0 && (
                                                    <p><span className="font-medium">Learning Goals:</span> {profile.learningGoals.join(', ')}</p>
                                                  )}
                                                </div>
                                              )
                                            } catch (e) {
                                              console.error('Failed to parse discovery profile JSON:', e)
                                              // If JSON parsing fails, try to extract basic info or show truncated
                                              const truncatedBio = bio.length > 150 ? bio.substring(0, 150) + '...' : bio
                                              return <p className="text-gray-600 text-sm italic">{truncatedBio}</p>
                                            }
                                          } else {
                                            // Regular bio text
                                            return <p className="text-gray-600 text-sm italic">{bio}</p>
                                          }
                                        })()}
                                      </div>
                                    )}

                                    {/* Activity & Last Seen */}
                                    <div className="pt-2 border-t border-gray-100">
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>Apps this month: {result.candidate.applicationsThisMonth || 0}</span>
                                        {result.candidate.lastActiveAt && (
                                          <span>Last seen: {new Date(result.candidate.lastActiveAt).toLocaleDateString()}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                      Match: {result.overallScore.toFixed(0)}%
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                      Activity: {result.candidate.engagementLevel}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                      {result.candidate.applicationsThisMonth} apps this month
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 italic">{result.aiExplanation}</p>
                                </div>
                                
                                <div className="ml-4 space-y-2">
                                  {!(result as any).contactRevealed ? (
                                    <Button
                                      size="sm"
                                      onClick={() => revealContact(result.candidate.id, 1)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                    >
                                      Reveal Contact (1 credit)
                                    </Button>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="text-sm text-green-600 font-medium">
                                        ✅ Contact Revealed
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => sendCalendarInvite(
                                          result.candidate.id, 
                                          (result as any).contact?.email || result.candidate.email,
                                          result.candidate.name
                                        )}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                      >
                                        📅 Send Calendar Invite
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>



            {/* Bottom Input Area - Fixed Position */}
            <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm px-6 py-4">
              <div className="max-w-4xl mx-auto">
                <motion.div layout className="space-y-3">
                  {/* Chat Input */}
                  <div className="relative">
                    <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg focus-within:border-blue-500 transition-colors overflow-hidden">
                      <div className="flex items-end gap-3 p-4">
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
                            placeholder="Continue the conversation..."
                                                    disabled={isLoading || isAnimatingInput || isProcessing}
                        className="w-full bg-transparent text-gray-900 placeholder-gray-400 border-none outline-none resize-none text-base leading-relaxed"
                            rows={1}
                          />
                        </div>
                        
                        <Button
                          size="icon"
                          className={`rounded-xl transition-all duration-200 flex-shrink-0 ${
                            hasContent && !isProcessing
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg scale-100"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed scale-95"
                          }`}
                          onClick={() => {
                            if (hasContent && !isProcessing) handleSendMessage(input);
                          }}
                          disabled={!hasContent || isLoading || isAnimatingInput || isProcessing}
                        >
                          {isLoading || isAnimatingInput || isProcessing ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        ) : (
          // Centered Landing Layout
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-4xl w-full">
              {/* Welcome Header */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200/50 mb-6">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Next-Generation AI Powered</span>
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Hey {firstName}, ready to recruit?
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Describe what you need and I'll help you find perfect talent or create amazing projects.
                </p>
              </motion.div>

              {/* Input Area */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6"
              >
                {/* Chat Input */}
                <div className="relative">
                  <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg focus-within:border-blue-500 transition-colors overflow-hidden">
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
                          placeholder="Ready to find amazing talent? Describe what you're looking for..."
                          disabled={isLoading || isAnimatingInput}
                          className="w-full bg-transparent text-gray-900 placeholder-gray-400 border-none outline-none resize-none text-lg leading-relaxed"
                          rows={1}
                        />
                      </div>
                      
                      <Button
                        size="icon"
                        className={`rounded-xl transition-all duration-200 flex-shrink-0 ${
                          hasContent
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg scale-100"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed scale-95"
                        }`}
                        onClick={() => {
                          if (hasContent) handleSendMessage(input);
                        }}
                        disabled={!hasContent || isLoading || isAnimatingInput}
                      >
                        {isLoading || isAnimatingInput ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-wrap gap-3 justify-center"
                >
                  {suggestionButtons.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 border-gray-300 hover:bg-gray-50 flex items-center gap-3 text-left bg-white shadow-sm"
                      onClick={suggestion.action}
                      disabled={isLoading || isAnimatingInput}
                    >
                      <suggestion.icon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{suggestion.label}</div>
                        <div className="text-sm text-gray-600">{suggestion.description}</div>
                      </div>
                    </Button>
                  ))}
                </motion.div>

                {/* Try These Examples */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center"
                >
                  <p className="text-sm text-gray-600 mb-4">💡 Try these examples:</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {quickSearches.map((example, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setInput(example)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-sm"
                        disabled={isLoading || isAnimatingInput}
                      >
                        {example}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Features Showcase */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid md:grid-cols-3 gap-6 mt-12"
                >
                  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="p-3 bg-blue-100 rounded-xl w-fit mb-4">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Activity Intelligence</h3>
                    <p className="text-gray-600 text-sm">Real-time engagement scoring based on platform activity and application patterns.</p>
                  </div>
                  
                  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="p-3 bg-emerald-100 rounded-xl w-fit mb-4">
                      <Target className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Smart Matching</h3>
                    <p className="text-gray-600 text-sm">AI analyzes profiles, education, and goals to find the most relevant candidates.</p>
                  </div>
                  
                  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
                      <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Credit System</h3>
                    <p className="text-gray-600 text-sm">Fair usage with credits. Reveal contacts only when you find the perfect match.</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
} 