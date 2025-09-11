'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Calendar, ChevronDown, ChevronRight, ExternalLink, X, Briefcase, Users, Zap, Trophy, Building } from 'lucide-react'

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  type: 'link' | 'manual' | 'feature' | 'modal'
  url?: string
  action?: string
  phase: 'mvp' | 'phase2' | 'phase3' | 'phase4'
  category: 'setup' | 'projects' | 'recruitment' | 'advanced'
  tier?: 'basic' | 'pro' | 'premium'
}

interface CompanyOnboardingChecklistProps {
  companyName: string
  userTier?: 'basic' | 'pro' | 'premium'
  onDismiss?: () => void
}

export default function CompanyOnboardingChecklist({ 
  companyName, 
  userTier = 'basic',
  onDismiss 
}: CompanyOnboardingChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([
    // MVP Phase - Core Setup
    {
      id: 'calendly-booking',
      title: 'Schedule your onboarding call',
      description: 'Book a 15-minute call with our team to get started',
      completed: false,
      type: 'manual',
      url: 'https://calendly.com/alex-simon-bidaaya/interview',
      phase: 'mvp',
      category: 'setup'
    },
    {
      id: 'first-project',
      title: 'Post your first project',
      description: 'Create a project using our standardized templates',
      completed: false,
      type: 'feature',
      url: '/dashboard/projects/new',
      phase: 'mvp',
      category: 'projects'
    },
    {
      id: 'company-profile',
      title: 'Complete company profile',
      description: 'Add your company details, logo, and description',
      completed: false,
      type: 'feature',
      url: '/dashboard/profile',
      phase: 'mvp',
      category: 'setup'
    },
    
    // Phase 2 - Smart Recruitment
    {
      id: 'smart-recruitment-guide',
      title: 'Learn smart recruitment basics',
      description: 'Interactive walkthrough: How to use AI shortlisting, what to look for in candidates, and optimal timing',
      completed: false,
      type: 'modal',
      action: 'open_recruitment_guide',
      phase: 'phase2',
      category: 'recruitment',
      tier: 'basic' // Available to Company Basic+
    },
    {
      id: 'ai-preferences',
      title: 'Configure smart candidate ranking',
      description: 'Set your criteria for automatic candidate scoring and ranking',
      completed: false,
      type: 'feature',
      phase: 'phase2',
      category: 'recruitment',
      tier: 'pro'
    },
    {
      id: 'interview-process',
      title: 'Automate your interview workflow',
      description: 'Set up scheduling automation and evaluation templates',
      completed: false,
      type: 'feature',
      phase: 'phase2',
      category: 'recruitment',
      tier: 'pro'
    },
    
    // Phase 3 - Advanced Insights
    {
      id: 'transcript-analysis',
      title: 'Enable interview intelligence',
      description: 'Get AI insights from interview transcripts and improve hiring decisions',
      completed: false,
      type: 'feature',
      phase: 'phase3',
      category: 'recruitment',
      tier: 'premium'
    },
    {
      id: 'onboarding-automation',
      title: 'Automate team onboarding',
      description: 'Streamline new hire processes with automated workflows and integrations',
      completed: false,
      type: 'feature',
      phase: 'phase3',
      category: 'advanced',
      tier: 'premium'
    },
    
    // Phase 4 - Enterprise Features
    {
      id: 'custom-analytics',
      title: 'Build your executive dashboard',
      description: 'Create custom analytics and KPI tracking for leadership reporting',
      completed: false,
      type: 'feature',
      phase: 'phase4',
      category: 'advanced',
      tier: 'premium'
    }
  ])
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [isDismissed, setIsDismissed] = useState(false)
  const [activePhase, setActivePhase] = useState<'mvp' | 'phase2' | 'phase3' | 'phase4'>('mvp')
  const [showRecruitmentGuide, setShowRecruitmentGuide] = useState(false)

  // Filter items based on user tier and phase
  const filteredItems = items.filter(item => {
    // Always show MVP items
    if (item.phase === 'mvp') return true
    
    // For other phases, check tier requirements
    if (item.tier) {
      const tierHierarchy = { basic: 0, pro: 1, premium: 2 }
      return tierHierarchy[userTier] >= tierHierarchy[item.tier]
    }
    
    return true
  })

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(`bidaaya_checklist_${companyName}`)
    if (savedState) {
      try {
        const { items: savedItems, isDismissed: savedDismissed, activePhase: savedPhase } = JSON.parse(savedState)
        setItems(savedItems)
        setIsDismissed(savedDismissed)
        setActivePhase(savedPhase || 'mvp')
      } catch (error) {
        console.error('Failed to load checklist state:', error)
      }
    }
  }, [companyName])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = { items, isDismissed, activePhase }
    localStorage.setItem(`bidaaya_checklist_${companyName}`, JSON.stringify(stateToSave))
  }, [items, isDismissed, activePhase, companyName])

  const toggleItemCompletion = (itemId: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, completed: !item.completed }
          : item
      )
    )
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const handleActionClick = (item: ChecklistItem) => {
    if ((item.type === 'link' || item.type === 'manual') && item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
    } else if (item.type === 'feature' && item.url) {
      window.location.href = item.url
    } else if (item.type === 'modal' && item.action === 'open_recruitment_guide') {
      setShowRecruitmentGuide(true)
      // Mark as completed when they open the guide
      toggleItemCompletion(item.id)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const currentPhaseItems = filteredItems.filter(item => item.phase === activePhase)
  const completedCount = currentPhaseItems.filter(item => item.completed).length
  const totalCount = currentPhaseItems.length

  const phaseInfo = {
    mvp: { 
      title: 'Getting Started', 
      icon: Briefcase, 
      color: 'blue',
      description: 'Essential setup to start posting projects and finding talent'
    },
    phase2: { 
      title: 'Smart Recruitment', 
      icon: Zap, 
      color: 'purple',
      description: 'AI-powered candidate matching and automated workflows'
    },
    phase3: { 
      title: 'Advanced Insights', 
      icon: Trophy, 
      color: 'emerald',
      description: 'Deep analytics, interview analysis, and team onboarding'
    },
    phase4: { 
      title: 'Enterprise Features', 
      icon: Building, 
      color: 'orange',
      description: 'Full customization and premium analytics dashboard'
    }
  }

  // Don't render if dismissed
  if (isDismissed) {
    return null
  }

  const currentPhase = phaseInfo[activePhase]
  const PhaseIcon = currentPhase.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 mb-6"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-r from-${currentPhase.color}-500 to-${currentPhase.color}-600 flex items-center justify-center`}>
            <PhaseIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Welcome to Bidaaya! 🎉
            </h3>
            <p className="text-sm text-gray-600">
              {currentPhase.description}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Phase Selector */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(phaseInfo).map(([phase, info]) => {
                         const available = phase === 'mvp' || userTier === 'premium' || (userTier === 'pro' && ['mvp', 'phase2'].includes(phase))
            return (
              <button
                key={phase}
                onClick={() => available && setActivePhase(phase as any)}
                disabled={!available}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activePhase === phase
                    ? `bg-${info.color}-100 text-${info.color}-700 border border-${info.color}-200`
                    : available
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {info.title}
                {!available && ' (Upgrade Required)'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {currentPhase.title}: {completedCount} of {totalCount} completed
          </span>
          <span className="text-sm text-gray-500">
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
            transition={{ duration: 0.5 }}
            className={`bg-gradient-to-r from-${currentPhase.color}-500 to-${currentPhase.color}-600 h-2 rounded-full`}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {currentPhaseItems.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleItemCompletion(item.id)}
                  className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    item.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  {item.completed && <CheckCircle className="h-3 w-3 fill-current" />}
                </button>

                {/* Item Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {item.title}
                        </h4>
                        {item.tier && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.tier === 'premium' 
                              ? 'bg-purple-100 text-purple-700'
                              : item.tier === 'pro'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.tier.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${item.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.description}
                      </p>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                    >
                      {expandedItems[item.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedItems[item.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pl-8 border-t border-gray-100 pt-4"
                  >
                    {item.id === 'calendly-booking' && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Schedule a quick 15-minute call with our team to:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• Get a personalized tour of the platform</li>
                          <li>• Learn best practices for posting projects</li>
                          <li>• Discover how to find the right talent</li>
                          <li>• Understand our AI recruitment features</li>
                        </ul>
                        
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => handleActionClick(item)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Calendar className="h-4 w-4" />
                            Book via Calendly
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {item.id === 'first-project' && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Choose from 5 standardized project categories:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• <strong>Marketing:</strong> Social media campaigns, content creation, market research</li>
                          <li>• <strong>Business Development:</strong> Lead generation, partnership research, sales support</li>
                          <li>• <strong>Computer Science/Coding:</strong> Web/app development, data analysis, automation</li>
                          <li>• <strong>Finance:</strong> Financial modeling, investment research, budgeting support</li>
                          <li>• <strong>Psychology:</strong> User research, behavioral analysis, HR recruitment support</li>
                        </ul>
                        
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => handleActionClick(item)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            <Briefcase className="h-4 w-4" />
                            Create Project
                          </button>
                        </div>
                      </div>
                    )}

                    {item.type === 'feature' && item.id !== 'first-project' && item.id !== 'calendly-booking' && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          This feature will be available in {item.phase === 'phase2' ? 'Phase 2' : item.phase === 'phase3' ? 'Phase 3' : 'Phase 4'} of our platform rollout.
                        </p>
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          Expected launch: {item.phase === 'phase2' ? 'Q2 2024' : item.phase === 'phase3' ? 'Q3 2024' : 'Q4 2024'}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Tier Upgrade Prompt */}
      {userTier === 'basic' && activePhase !== 'mvp' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl"
        >
                     <div className="flex items-center gap-2 mb-2">
             <Users className="h-5 w-5 text-purple-600" />
             <span className="text-sm font-medium text-purple-800">
               {activePhase === 'phase2' ? 'Unlock Smart Recruitment' : activePhase === 'phase3' ? 'Unlock Advanced Insights' : 'Unlock Enterprise Features'}
             </span>
           </div>
           <p className="text-sm text-purple-700 mb-3">
             {activePhase === 'phase2' 
               ? 'Get AI-powered candidate ranking and save 80% of your screening time.'
               : activePhase === 'phase3' 
               ? 'Access interview analysis, team onboarding automation, and performance insights.'
               : 'Full platform customization and premium analytics dashboard.'}
           </p>
           <div className="flex items-center gap-3">
             <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
               {activePhase === 'phase2' ? 'Upgrade to Pro' : 'Upgrade to Premium'}
             </button>
             <span className="text-xs text-purple-600">
               {activePhase === 'phase2' ? 'Starting at £75/month' : 'Starting at £175/month'}
             </span>
           </div>
        </motion.div>
      )}

      {/* Completion Message */}
      {completedCount === totalCount && totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              🎉 {currentPhase.title} complete! {activePhase !== 'phase4' ? 'Ready for the next level?' : 'You\'re using our most advanced features!'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Smart Recruitment Guide Modal */}
      {showRecruitmentGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🤖 Smart Recruitment Guide</h3>
                  <p className="text-gray-600">Master AI shortlisting and optimal hiring practices</p>
                </div>
                <button
                  onClick={() => setShowRecruitmentGuide(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📊 How AI Shortlisting Works</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• AI analyzes applications against your project requirements</li>
                    <li>• Scores candidates on skills match, experience relevance, and motivation</li>
                    <li>• Ranks top 10 candidates for your review</li>
                    <li>• Saves you 80% of initial screening time</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h4 className="font-semibold text-green-900 mb-2">👀 What to Look For in Candidates</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• <strong>Skills Match:</strong> Relevant technical and soft skills</li>
                    <li>• <strong>Motivation:</strong> Clear understanding of your project goals</li>
                    <li>• <strong>Availability:</strong> Time commitment aligns with project needs</li>
                    <li>• <strong>Communication:</strong> Clear, professional application responses</li>
                    <li>• <strong>Experience:</strong> Relevant past projects or education</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">⏰ Optimal Timing</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• <strong>Wait for 10+ applications</strong> before shortlisting for best results</li>
                    <li>• <strong>Review shortlist within 2-3 days</strong> to maintain candidate interest</li>
                    <li>• <strong>Send interview invites</strong> to top 3-5 candidates immediately</li>
                    <li>• <strong>Schedule interviews</strong> within 1 week of shortlisting</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">💡 Pro Tips</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Use detailed project descriptions for better AI matching</li>
                    <li>• Check candidate portfolios and GitHub profiles</li>
                    <li>• Ask specific questions during interviews</li>
                    <li>• Provide feedback to improve future shortlisting</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowRecruitmentGuide(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Got it! Let's start hiring smart 🚀
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
} 