'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Target, Briefcase, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentControlsV2Props {
  onPreferencesChange?: (preferences: { commitmentLevel?: string; field?: string; agentActive?: boolean; isExpanded?: boolean }) => void
}

const FIELDS = [
  { value: 'best_for_you', label: 'Best for You', icon: '✨', description: 'AI-matched opportunities' },
  { value: 'technology', label: 'Technology', icon: '💻', description: 'Software, AI, Data' },
  { value: 'business', label: 'Business', icon: '📊', description: 'Strategy, Operations' },
  { value: 'marketing', label: 'Marketing', icon: '📱', description: 'Digital, Brand, Growth' },
  { value: 'design', label: 'Design', icon: '🎨', description: 'UI/UX, Product, Visual' },
  { value: 'finance', label: 'Finance', icon: '💰', description: 'Investment, Analysis' },
  { value: 'consulting', label: 'Consulting', icon: '🤝', description: 'Advisory, Strategy' },
  { value: 'engineering', label: 'Engineering', icon: '⚙️', description: 'Mechanical, Civil' },
  { value: 'sustainability', label: 'Sustainability', icon: '🌱', description: 'ESG, Climate' },
  { value: 'data', label: 'Data Science', icon: '📈', description: 'Analytics, ML, BI' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥', description: 'Medical, Biotech' },
  { value: 'legal', label: 'Legal', icon: '⚖️', description: 'Corporate, Compliance' },
  { value: 'any', label: 'Open to All', icon: '🌟', description: 'Any field' },
]

const COMMITMENT_OPTIONS = [
  { value: 'flexible', label: 'Flexible' },
  { value: 'full_time', label: 'Full-time' },
]

const ACTIVITY_MESSAGES = [
  'Scanning sources...',
  'Ranking fit...',
  'Removing duplicates...',
  'Ready',
]

export function AgentControlsV2({ onPreferencesChange }: AgentControlsV2Props) {
  const [commitmentLevel, setCommitmentLevel] = useState<string>('flexible')
  const [field, setField] = useState<string>('best_for_you')
  const [isActive, setIsActive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showFieldDropdown, setShowFieldDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activityMessageIndex, setActivityMessageIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Rotate activity messages when active
  useEffect(() => {
    if (!isActive) return
    
    const interval = setInterval(() => {
      setActivityMessageIndex((prev) => (prev + 1) % ACTIVITY_MESSAGES.length)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [isActive])

  // Click outside to close dropdown
  useEffect(() => {
    if (!showFieldDropdown) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFieldDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFieldDropdown])

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.preferences) {
          setCommitmentLevel(data.preferences.commitmentLevel || 'flexible')
          setField(data.preferences.field || 'any')
          setIsActive(data.preferences.agentActive || false)
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const savePreferences = async (newCommitment?: string, newField?: string, newActive?: boolean) => {
    const preferences = {
      commitmentLevel: newCommitment || commitmentLevel,
      field: newField || field,
      agentActive: newActive !== undefined ? newActive : isActive,
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        onPreferencesChange?.(preferences)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCommitmentChange = (value: string) => {
    setCommitmentLevel(value)
    savePreferences(value, undefined, undefined)
  }

  const handleFieldSelect = (value: string) => {
    setField(value)
    setShowFieldDropdown(false)
    setSearchQuery('')
    savePreferences(undefined, value, undefined)
  }

  const toggleAgent = () => {
    const newActive = !isActive
    setIsActive(newActive)
    savePreferences(undefined, undefined, newActive)
  }

  const toggleExpanded = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onPreferencesChange?.({ isExpanded: newExpanded })
  }

  const filteredFields = FIELDS.filter(f => 
    f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedField = FIELDS.find(f => f.value === field)

  return (
    <div className={cn(
      "w-full mx-auto px-4 mb-4 transition-all duration-500",
      isExpanded ? "max-w-4xl" : "max-w-2xl"
    )}>
      {/* Compact Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      >
        {/* Header Row - Always Visible */}
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <img 
              src="/icons/ai-agent.svg" 
              alt="AI Agent"
              className={cn(
                "w-7 h-7 transition-opacity object-contain",
                isActive ? "opacity-100" : "opacity-40"
              )}
            />
            <span className="text-base font-medium text-bidaaya-light">AI Agent</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Glowing Toggle Switch */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleAgent()
              }}
              disabled={isSaving}
              className={cn(
                "relative w-14 h-7 rounded-full transition-all duration-300",
                isActive 
                  ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]" 
                  : "bg-white/10",
                isSaving && "opacity-50 cursor-not-allowed"
              )}
            >
              <motion.div
                animate={{ x: isActive ? 28 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full shadow-md",
                  isActive ? "bg-white" : "bg-white/60"
                )}
              />
            </button>

            {/* Expand/Collapse Icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-5 h-5 text-bidaaya-light/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Commitment Segmented Control */}
                <div>
                  <label className="text-xs text-bidaaya-light/60 mb-2 block">Commitment Level</label>
                  <div className="relative bg-white/[0.03] rounded-xl p-1 flex">
                    {COMMITMENT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleCommitmentChange(option.value)}
                        disabled={isSaving}
                        className={cn(
                          "relative flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          commitmentLevel === option.value
                            ? "text-bidaaya-light"
                            : "text-bidaaya-light/50 hover:text-bidaaya-light/70",
                          isSaving && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {commitmentLevel === option.value && (
                          <motion.div
                            layoutId="commitment-bg"
                            className="absolute inset-0 bg-bidaaya-accent/20 border border-bidaaya-accent/30 rounded-lg"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Smart Select Field */}
                <div className="relative z-50" ref={dropdownRef}>
                  <label className="text-xs text-bidaaya-light/60 mb-2 block">Field of Interest</label>
                  <button
                    onClick={() => setShowFieldDropdown(!showFieldDropdown)}
                    disabled={isSaving}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-left flex items-center justify-between hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedField?.icon}</span>
                      <div>
                        <div className="text-sm text-bidaaya-light font-medium">{selectedField?.label}</div>
                        <div className="text-xs text-bidaaya-light/50">{selectedField?.description}</div>
                      </div>
                    </div>
                    <Search className="w-4 h-4 text-bidaaya-light/40" />
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {showFieldDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-bidaaya-dark border border-white/[0.08] rounded-xl shadow-2xl z-[99999] overflow-hidden"
                        style={{ maxHeight: '60vh' }}
                      >
                        {/* Search Input */}
                        <div className="p-3 border-b border-white/[0.05] flex-shrink-0">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bidaaya-light/40" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Type to search fields..."
                              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-10 pr-3 py-2 text-sm text-bidaaya-light placeholder:text-bidaaya-light/40 focus:outline-none focus:border-bidaaya-accent/50"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Options - Now properly scrollable */}
                        <div 
                          className="overflow-y-auto overscroll-contain"
                          style={{ maxHeight: 'calc(60vh - 80px)' }}
                        >
                          {filteredFields.length === 0 ? (
                            <div className="p-4 text-center text-sm text-bidaaya-light/40">
                              No fields found
                            </div>
                          ) : (
                            filteredFields.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleFieldSelect(option.value)}
                                className={cn(
                                  "w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.06] transition-colors border-b border-white/[0.02] last:border-0",
                                  field === option.value && "bg-bidaaya-accent/10"
                                )}
                              >
                                <span className="text-xl flex-shrink-0">{option.icon}</span>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="text-sm text-bidaaya-light font-medium truncate">{option.label}</div>
                                  <div className="text-xs text-bidaaya-light/50 truncate">{option.description}</div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status Bar - Outside the Card */}
      <AnimatePresence>
        {isActive ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 flex items-center justify-center px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
              <span className="text-xs text-green-400">
                {ACTIVITY_MESSAGES[activityMessageIndex]}
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-center"
          >
            <span className="text-xs text-bidaaya-light/40">
              Not looking for opportunities
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

