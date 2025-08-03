import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Lightbulb, Users, Briefcase, Search, Plus, Eye, ArrowRight, Sparkles, Bot, Building2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
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
  actionType?: 'search' | 'navigate' | 'guidance'
  data?: any
}

export default function AIDashboardChat() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<AIMatchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [credits, setCredits] = useState(15)
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
        content: `Hey there! 👋 I'm your AI recruitment assistant, ready to help ${session.user.name || 'your company'} find amazing talent.

I can help you:
🎯 **Find specific talent instantly** using our AI search
📋 **Plan recruitment strategies** for different hiring needs  
⚡ **Quick hires** for urgent projects
🎓 **Internship programs** for long-term talent building
📊 **Optimize your hiring** with data-driven insights

**What can I help you with today?**`,
        timestamp: new Date(),
        actionType: 'guidance'
      }
      setMessages([welcomeMessage])
    }
  }, [session, messages.length])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Generate AI response
      const aiResponse = await generateAIResponse(input)
      setMessages(prev => [...prev, aiResponse])

      // If it's a search, perform the search
      if (aiResponse.actionType === 'search') {
        await performTalentSearch(input)
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

  const generateAIResponse = async (input: string): Promise<ChatMessage> => {
    const inputLower = input.toLowerCase()

    // Handle talent search requests
    if (inputLower.includes('find') || inputLower.includes('search') || inputLower.includes('looking for') || 
        inputLower.includes('need') || inputLower.includes('developer') || inputLower.includes('designer') || 
        inputLower.includes('student') || inputLower.includes('marketing') || inputLower.includes('business')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `🔍 **Perfect! Let me search for talent matching your criteria.**

I'll analyze your request and find the best candidates based on:
• **Exact skill matching** for relevant experience
• **University/education background** for quality candidates  
• **Activity levels** for responsive talent
• **Engagement scores** for reliable hires

**Searching now...** This will cost 1-2 credits per contact reveal.`,
        timestamp: new Date(),
        actionType: 'search',
        data: { query: input }
      }
    }

    // Handle internship program requests
    if (inputLower.includes('internship') && (inputLower.includes('program') || inputLower.includes('long-term') || inputLower.includes('multiple'))) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎓 **Excellent choice for building a structured talent pipeline!**

For **internship programs**, I recommend **posting a project** rather than active search:

**✅ Why Project Posting Works Best:**
• Attract students specifically interested in your program  
• Build your employer brand in universities
• Get detailed applications showing genuine interest
• No credit costs - cost-effective for multiple hires
• Students prefer applying to structured programs

**💡 Internship Program Success Tips:**
• Highlight learning and mentorship opportunities
• Specify program duration and structure  
• Mention potential for full-time conversion
• Include details about projects they'll work on

**Ready to create your internship program?**`,
        timestamp: new Date(),
        actionType: 'navigate',
        data: { 
          href: '/dashboard/projects/new', 
          label: 'Create Internship Program',
          strategy: 'internship_program'
        }
      }
    }

    // Handle short-term hiring requests
    if (inputLower.includes('short-term') || inputLower.includes('temporary') || inputLower.includes('quick') || inputLower.includes('immediate') || inputLower.includes('urgent')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `⚡ **Perfect! For urgent/short-term needs, active search is your best bet.**

**🚀 Why Active Search for Quick Hires:**
• Find candidates immediately (same day)
• Direct contact with active talent  
• Skip the application waiting period
• Perfect for urgent project needs

**💰 Credit-Efficient Quick Hire Process:**
1. **Tell me exactly what you need** (skills, experience, timeline)
2. **I'll find 9 top matches instantly** using AI
3. **Reveal contacts for 3-5 promising candidates** (3-10 credits total)
4. **Reach out same day** for quick turnaround

**What specific skills/experience are you looking for?**`,
        timestamp: new Date(),
        actionType: 'guidance',
        data: { strategy: 'quick_hire_active_search' }
      }
    }

    // Handle project posting requests
    if (inputLower.includes('post') && (inputLower.includes('project') || inputLower.includes('job') || inputLower.includes('opportunity'))) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `📋 **Smart choice! Project posting builds a strong talent pipeline.**

**✅ Benefits of Project Posting:**
• No credit costs - just one-time posting
• Attracts motivated, interested candidates
• Builds your employer brand naturally
• Great for roles with broad appeal
• Multiple candidates apply - you choose the best

**🎯 When Project Posting Works Best:**
• Timeline of 1-4 weeks  
• Role has learning opportunities
• Building long-term relationships
• Want to showcase company culture

**🚀 Optimization Tips:**
• Use clear, compelling job descriptions
• Highlight growth and learning opportunities  
• Set competitive compensation
• Respond quickly to applications

**Ready to create an attractive posting?**`,
        timestamp: new Date(),
        actionType: 'navigate',
        data: { 
          href: '/dashboard/projects/new', 
          label: 'Create Project Posting',
          strategy: 'project_posting'
        }
      }
    }

    // Handle strategy/guidance requests
    if (inputLower.includes('strategy') || inputLower.includes('approach') || inputLower.includes('best') || 
        inputLower.includes('recommend') || inputLower.includes('should i') || inputLower.includes('help')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎯 **Let me help you choose the perfect recruitment strategy!**

**Quick Questions to Optimize Your Approach:**

**⏰ Timeline:**
• **Immediate (1-3 days):** Active search with credits
• **Short-term (1-2 weeks):** Active search or quick posting
• **Long-term (3+ weeks):** Project posting for best results

**🎯 Hiring Type:**
• **Single specific role:** Active search for exact match
• **Multiple similar roles:** Project posting for pipeline  
• **Internship program:** Always post a project
• **Exploration/networking:** Active search for discovery

**💰 Budget Considerations:**
• **Credit-based:** 1-2 credits per contact reveal
• **Free posting:** No costs, just time investment

**Tell me about your specific situation and I'll give you a personalized recommendation!**`,
        timestamp: new Date(),
        actionType: 'guidance',
        data: { strategy: 'consultation' }
      }
    }

    // Handle navigation requests
    if (inputLower.includes('view') || inputLower.includes('see') || inputLower.includes('browse') || inputLower.includes('projects')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `📊 **Let me help you navigate your recruitment dashboard!**

**Quick Navigation:**
• **View Active Projects:** See all your current postings and applications
• **Create New Project:** Post a new opportunity or internship
• **Browse Applications:** Review candidates who've applied  
• **Manage Team:** Handle your company settings and team

**What would you like to explore?**`,
        timestamp: new Date(),
        actionType: 'navigate',
        data: { strategy: 'navigation' }
      }
    }

    // Default helpful response
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: `I'm here to help with your recruitment needs! Here are some things I can assist with:

🎯 **Active Talent Search:** "Find me a React developer with 2+ years experience"
📋 **Project Strategy:** "Should I post a project or search actively?"  
⚡ **Quick Hires:** "I need someone urgently for a short-term project"
🎓 **Internship Programs:** "Help me set up a structured internship program"
📊 **Navigation:** "Show me my active projects" or "Create a new posting"

**What recruitment challenge can I help you solve today?**`,
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

  const suggestedPrompts = [
    "Find me Computer Science students at AUD",
    "I need a marketing intern urgently",
    "Help me set up an internship program", 
    "Should I post a project or search actively?",
    "Find business students with high activity"
  ]

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

        {/* Input Area */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about recruitment, talent search, or hiring strategy..."
              className="flex-1 border-none bg-gray-50 focus:bg-white transition-colors"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Suggested Prompts */}
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInput(prompt)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 