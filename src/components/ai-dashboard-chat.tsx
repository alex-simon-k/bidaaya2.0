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
  Star,
  Target,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react'
import Link from 'next/link'

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'action' | 'system'
  content: string
  timestamp: Date
  actionType?: 'search' | 'navigate' | 'info' | 'guidance' | 'credit-action'
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

interface CreditTransaction {
  candidateId: string
  candidateName: string
  cost: number
  type: 'contact_reveal' | 'detailed_profile'
}

export default function AIDashboardChat({ user }: { user: any }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: `👋 Hey ${user?.name?.split(' ')[0] || 'there'}! I'm your AI recruitment strategist. I can help you find the perfect candidates, guide your hiring strategy, and manage everything efficiently. What's your recruitment goal today?`,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [credits, setCredits] = useState({ available: 15, used: 0, tier: 'FREE' })
  const [pendingCreditAction, setPendingCreditAction] = useState<CreditTransaction | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickActions: QuickAction[] = [
    {
      id: 'hiring-strategy',
      title: 'Hiring Strategy',
      description: 'Get recruitment advice',
      icon: Target,
      href: '',
      prompt: 'Help me decide the best way to find talent for my needs'
    },
    {
      id: 'find-talent',
      title: 'Find Talent',
      description: 'Search candidates now',
      icon: Users,
      href: '',
      prompt: 'I want to find specific candidates with particular skills'
    },
    {
      id: 'post-project',
      title: 'Post Project',
      description: 'Create job posting',
      icon: Plus,
      href: '/dashboard/projects/new',
      prompt: 'I want to post a project and wait for applications'
    }
  ]

  const strategicQuestions = [
    "Should I post a project or search for specific talent?",
    "I need someone for a short-term project urgently",
    "I want to set up a long-term internship program", 
    "What's the most cost-effective approach for my needs?",
    "I need multiple hires - what's the best strategy?"
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
      const aiResponse = await generateStrategicAIResponse(inputValue)
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateStrategicAIResponse = async (userInput: string): Promise<ChatMessage> => {
    const input = userInput.toLowerCase()

    // Strategic guidance for hiring decisions
    if (input.includes('should i') || input.includes('what approach') || input.includes('strategy') || input.includes('recommend') || input.includes('advice')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎯 **Strategic Recruitment Advice**

Let me help you choose the best approach! Here are your options:

**🚀 Active Search (Direct Talent Hunt):**
• Best for: Specific skills, urgent roles, competitive candidates
• Timeline: Immediate results (same day)
• Cost: 1-2 credits per contact reveal
• Success Rate: Higher for specialized roles

**📋 Project Posting (Passive Recruitment):**
• Best for: General roles, building talent pipeline, multiple positions  
• Timeline: 1-2 weeks for good applications
• Cost: No credits, just posting fee
• Success Rate: Higher volume, broader reach

**💡 My Recommendation:**
Tell me more about your role (urgency, skills needed, budget) and I'll give you a personalized strategy!`,
        timestamp: new Date(),
        actionType: 'guidance',
        data: {
          options: [
            { text: "I need someone urgently (< 1 week)", type: "urgent" },
            { text: "I have time to review applications (1-4 weeks)", type: "patient" },
            { text: "I need very specific/rare skills", type: "specialized" },
            { text: "It's a common role with many candidates", type: "general" }
          ]
        }
      }
    }

    // Handle urgency/timeline responses
    if (input.includes('urgent') || input.includes('asap') || input.includes('immediately') || input.includes('rush')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `⚡ **Urgent Hiring Strategy**

For urgent needs, I recommend **Active Talent Search**:

✅ **Immediate Benefits:**
• Search 648+ active candidates right now
• AI-powered matching in seconds
• Direct contact with pre-screened talent
• Skip the waiting period

💰 **Cost Analysis:**
• 1-2 credits per contact reveal
• Average 3-5 contacts needed for success
• Total cost: ~5-10 credits vs weeks of waiting

🎯 **Next Steps:**
1. Tell me the specific role/skills needed
2. I'll find perfect matches instantly
3. You can contact them today

**Ready to start your urgent search?**`,
        timestamp: new Date(),
        actionType: 'guidance',
        data: {
          recommended: 'active_search',
          urgency: 'high'
        }
      }
    }

    // Handle specific skill/role requests
    if (input.includes('developer') || input.includes('engineer') || input.includes('designer') || input.includes('marketer') || input.includes('analyst')) {
      const role = input.includes('developer') ? 'developer' : 
                   input.includes('engineer') ? 'engineer' :
                   input.includes('designer') ? 'designer' :
                   input.includes('marketer') ? 'marketer' : 'analyst'
      
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `🔍 **${role.charAt(0).toUpperCase() + role.slice(1)} Recruitment Strategy**

Great choice! Here's my tailored approach for finding a ${role}:

**📊 Market Analysis:**
• High demand role - active search recommended
• Competition is fierce - speed matters
• Quality candidates are usually employed

**🎯 Recommended Strategy: ACTIVE SEARCH**
• Search our 648+ student database
• Filter by relevant skills/education
• Direct outreach to top matches
• Bypass the application wait time

**💡 Smart Approach:**
1. Start with AI search (costs 1-2 credits per contact)
2. Contact top 3-5 candidates immediately  
3. If needed, post project as backup plan

**Ready to find your perfect ${role}?**`,
        timestamp: new Date(),
        actionType: 'guidance',
        data: {
          role: role,
          strategy: 'active_search_recommended'
        }
      }
    }

    // Handle talent search with credit awareness
    if (input.includes('find') || input.includes('search') || input.includes('student') || input.includes('talent') || input.includes('candidate')) {
      try {
        // Show credit awareness first
        const creditWarning = credits.available < 5 ? 
          `⚠️ **Credit Alert:** You have ${credits.available} credits remaining. Each contact reveal costs 1-2 credits. Consider upgrading for unlimited access!

` : ''

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
            content: `${creditWarning}🎯 **Perfect! I found ${data.data.matches.length} candidates matching "${userInput}"**

Here are your top matches with **credit-based contact reveals**:`,
            timestamp: new Date(),
            actionType: 'search',
            data: { 
              matches: data.data.matches.slice(0, 3), 
              searchQuery: userInput,
              creditWarning: credits.available < 5
            }
          }
        }
      } catch (error) {
        console.error('Search failed:', error)
      }
    }

    // Handle project posting guidance
    if (input.includes('post') && (input.includes('project') || input.includes('job'))) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `📋 **Project Posting Strategy**

Excellent choice for building a talent pipeline! Here's why posting works great:

**✅ Benefits of Project Posting:**
• No credit costs - just one-time posting
• Attracts motivated, interested candidates
• Builds your employer brand
• Great for multiple similar roles

**🎯 When Project Posting Works Best:**
• You have 1-4 weeks timeline
• Role has broad appeal
• You want multiple options to choose from
• Building long-term talent relationships

**🚀 Optimization Tips:**
• Use clear, specific job descriptions
• Highlight learning opportunities
• Set competitive compensation
• Respond quickly to applications

**Ready to create an attractive project posting?**`,
        timestamp: new Date(),
        actionType: 'navigate',
        data: { 
          href: '/dashboard/projects/new', 
          label: 'Create Project Posting',
          strategy: 'project_posting'
        }
      }
    }

    // Handle internship program requests
    if (input.includes('internship') && (input.includes('program') || input.includes('long-term') || input.includes('multiple'))) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎓 **Long-term Internship Program Strategy**

Perfect choice for building a structured talent pipeline! Here's my recommendation:

**📋 Post a Project - Best for Internship Programs:**
• Attract students specifically interested in your program
• Build your employer brand in universities
• Get detailed applications showing genuine interest
• No credit costs - cost-effective for multiple hires

**🎯 Why Project Posting Works for Internships:**
• Students prefer applying to structured programs
• You can detail learning opportunities and growth path
• Build relationships with educational institutions
• Multiple candidates can apply and you choose the best fit

**💡 Internship Program Tips:**
• Highlight learning and mentorship opportunities
• Specify program duration and structure
• Mention potential for full-time conversion
• Include details about projects they'll work on

**Ready to create your internship program posting?**`,
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
    if (input.includes('short-term') || input.includes('temporary') || input.includes('quick') || input.includes('immediate')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: `⚡ **Short-term/Quick Hire Strategy**

For immediate or short-term needs, I recommend using this **chatbot for active search**:

**🚀 Why Active Search for Quick Hires:**
• Find candidates immediately (same day)
• Direct contact with active talent
• Skip the application waiting period
• Perfect for urgent project needs

**💰 Credit-Efficient Approach:**
• Search specific skills: "React developer with 2+ years experience"
• Contact top 3-5 matches (cost: 3-10 credits)
• Much faster than waiting for project applications

**🎯 Quick Hire Process:**
1. Tell me exactly what skills/experience you need
2. I'll find the best matches instantly
3. Reveal contacts for promising candidates
4. Reach out same day for quick turnaround

**What specific skills are you looking for in your quick hire?**`,
        timestamp: new Date(),
        actionType: 'guidance',
        data: {
          strategy: 'quick_hire_active_search'
        }
      }
    }

    // Handle navigation requests
    if (input.includes('project') && !input.includes('find') && !input.includes('search')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "📊 **Project Management Hub**\n\nI'll take you to your projects dashboard where you can view, edit, and manage all your job postings. You can track applications, review candidates, and optimize your listings for better results.",
        timestamp: new Date(),
        actionType: 'navigate',
        data: { href: '/dashboard/projects', label: 'Go to Projects Dashboard' }
      }
    }

    if (input.includes('applicant') || input.includes('application')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "👥 **Application Management**\n\nLet me show you all recent applications across your projects. I can help you review candidates, compare profiles, and make informed hiring decisions efficiently.",
        timestamp: new Date(),
        actionType: 'navigate', 
        data: { href: '/dashboard/projects', label: 'View All Applications' }
      }
    }

    // Default strategic response
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: `🤖 **I'm your strategic recruitment advisor!** Here's how I can help:
      
**🎯 Strategic Guidance:**
• Should you post a project or search directly?
• What's the best approach for your timeline/budget?
• How to optimize your hiring success rate?

**🔍 Active Talent Search:** *(Uses Credits)*
• Find specific candidates instantly
• AI-powered matching and scoring
• Direct contact reveals (1-2 credits each)

**📋 Project Management:**
• Create optimized job postings
• Track and manage applications
• Review candidate profiles

**💡 Smart Tips:**
• Ask me "Should I post or search?" for personalized advice
• Tell me your role requirements for targeted recommendations
• I'll help you make data-driven hiring decisions!

What's your recruitment challenge today?`,
      timestamp: new Date()
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    if (action.href) {
      window.location.href = action.href
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user', 
      content: action.prompt,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    setTimeout(async () => {
      const aiResponse = await generateStrategicAIResponse(action.prompt)
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1000)
  }

  const handleCreditAction = async (action: 'reveal' | 'cancel', candidateId?: string, cost?: number) => {
    if (action === 'cancel') {
      setPendingCreditAction(null)
      return
    }

    if (action === 'reveal' && candidateId && cost) {
      if (credits.available < cost) {
        // Not enough credits
        const upgradeMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'system',
          content: `❌ **Insufficient Credits**\n\nYou need ${cost} credits but only have ${credits.available} remaining.\n\nUpgrade your plan to continue accessing candidate contacts!`,
          timestamp: new Date(),
          actionType: 'credit-action',
          data: { type: 'upgrade_required' }
        }
        setMessages(prev => [...prev, upgradeMessage])
        return
      }

      try {
        const response = await fetch('/api/ai-matching/search-v2', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'reveal_contact', 
            candidateId 
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setCredits(prev => ({ 
            ...prev, 
            available: prev.available - cost,
            used: prev.used + cost 
          }))

          const successMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'system',
            content: `✅ **Contact Revealed!**\n\n📧 **Email:** ${data.data.email}\n${data.data.whatsapp ? `📱 **WhatsApp:** ${data.data.whatsapp}\n` : ''}\n💰 **Credits Used:** ${cost}\n💳 **Remaining:** ${credits.available - cost} credits\n\n*Pro tip: Reach out quickly! Active candidates respond better to fast outreach.*`,
            timestamp: new Date(),
            actionType: 'credit-action',
            data: { 
              type: 'contact_revealed',
              contact: data.data,
              cost: cost
            }
          }
          setMessages(prev => [...prev, successMessage])
          setPendingCreditAction(null)
        }
      } catch (error) {
        console.error('Credit action failed:', error)
      }
    }
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

    const isSystemMessage = message.type === 'system'

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-3 mb-4"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSystemMessage 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
        }`}>
          {isSystemMessage ? <CheckCircle className="w-4 h-4 text-white" /> : <Brain className="w-4 h-4 text-white" />}
        </div>
        <div className="flex-1 max-w-xs lg:max-w-2xl">
          <div className={`border rounded-2xl rounded-tl-sm p-4 shadow-sm ${
            isSystemMessage ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
          }`}>
            <div className="whitespace-pre-wrap text-gray-800">{message.content}</div>
            
            {/* Strategic Guidance Options */}
            {message.actionType === 'guidance' && message.data?.options && (
              <div className="mt-4 space-y-2">
                {message.data.options.map((option: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(option.text)}
                    className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-blue-800 transition-colors"
                  >
                    💡 {option.text}
                  </button>
                ))}
              </div>
            )}

            {/* Navigation Buttons */}
            {message.actionType === 'navigate' && message.data && (
              <Link
                href={message.data.href}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                {message.data.label}
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            {/* Search Results with Credit Integration */}
            {message.actionType === 'search' && message.data?.matches && (
              <div className="mt-4 space-y-3">
                {message.data.matches.map((match: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{match.candidate.name}</h4>
                        {match.candidate.university && (
                          <p className="text-sm text-gray-600">{match.candidate.university}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-600">{Math.round(match.overallScore)}/100</span>
                        <p className="text-xs text-gray-500">AI Match</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{match.aiExplanation}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Zap className="h-4 w-4" />
                        {match.contactCredits} credits to reveal contact
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPendingCreditAction({
                          candidateId: match.candidate.id,
                          candidateName: match.candidate.name,
                          cost: match.contactCredits,
                          type: 'contact_reveal'
                        })}
                        disabled={credits.available < match.contactCredits}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {credits.available >= match.contactCredits ? 'Reveal Contact' : 'Need More Credits'}
                      </motion.button>
                    </div>
                  </div>
                ))}
                
                <Link
                  href="/dashboard/ai-search-v2"
                  className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all results & advanced search
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Credit Action Results */}
            {message.actionType === 'credit-action' && message.data?.type === 'upgrade_required' && (
              <Link
                href="/subscription"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Crown className="w-4 h-4" />
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Credit Confirmation Modal */}
      {pendingCreditAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reveal Contact Information?</h3>
              <p className="text-gray-600 mb-1">
                <strong>{pendingCreditAction.candidateName}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This will cost <strong>{pendingCreditAction.cost} credits</strong>
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleCreditAction('cancel')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreditAction('reveal', pendingCreditAction.candidateId, pendingCreditAction.cost)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg"
                >
                  Use {pendingCreditAction.cost} Credits
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Recruitment Strategist</h1>
                <p className="text-sm text-gray-600">Your intelligent hiring advisor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200/50">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {credits.available} credits
                  </span>
                  <span className="text-xs text-gray-500">
                    ({credits.tier})
                  </span>
                </div>
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
              {/* Strategic Guidance Banner */}
              <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-3 text-sm">
                  <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-700">
                      <strong>Quick hire?</strong> Use this chatbot for immediate talent search • 
                      <strong> Long-term internship programs?</strong> 
                      <Link href="/dashboard/projects/new" className="text-blue-600 hover:text-blue-700 underline ml-1">
                        Post a project instead
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

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
                    placeholder="Ask me about hiring strategy, search for talent, or get recruitment advice..."
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

                {/* Strategic Suggestions */}
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">💡 Strategic questions to ask:</p>
                  <div className="flex flex-wrap gap-2">
                    {strategicQuestions.slice(0, 2).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setInputValue(question)}
                        className="text-xs px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg text-blue-700 transition-colors border border-blue-200"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Actions Sidebar */}
          <div className="space-y-6">
            {/* Strategic Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Strategic Actions
              </h3>
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

            {/* Credit Status */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200/50 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                Credit Management
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Available Credits</span>
                  <span className="font-bold text-emerald-600">{credits.available}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Credits Used</span>
                  <span className="font-semibold text-gray-900">{credits.used}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Plan</span>
                  <span className="font-semibold text-blue-600">{credits.tier}</span>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <p className="text-xs text-gray-600">
                    💡 Contact reveals cost 1-2 credits each. Upgrade for unlimited access!
                  </p>
                </div>
              </div>
            </div>

            {/* AI Features */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200/50 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">AI Capabilities</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>🎯 Strategic hiring advice</p>
                <p>💰 Cost-effective recommendations</p>
                <p>⚡ Instant talent matching</p>
                <p>💳 Smart credit management</p>
                <p>📊 Activity-based scoring</p>
                <p>🤖 Conversational guidance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 