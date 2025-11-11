'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Target, Briefcase, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentControlsV2Props {
  onPreferencesChange?: (preferences: { commitmentLevel: string; field: string }) => void
}

const FIELDS = [
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
  { value: 'part_time', label: 'Part-time', description: '≤20h/week' },
  { value: 'full_time', label: 'Full-time', description: '40+h/week' },
]

const ACTIVITY_MESSAGES = [
  'Scanning sources...',
  'Ranking fit...',
  'Removing duplicates...',
  'Ready',
]

export function AgentControlsV2({ onPreferencesChange }: AgentControlsV2Props) {
  const [commitmentLevel, setCommitmentLevel] = useState<string>('part_time')
  const [field, setField] = useState<string>('any')
  const [isActive, setIsActive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showFieldDropdown, setShowFieldDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activityMessageIndex, setActivityMessageIndex] = useState(0)

  // Rotate activity messages when active
  useEffect(() => {
    if (!isActive) return
    
    const interval = setInterval(() => {
      setActivityMessageIndex((prev) => (prev + 1) % ACTIVITY_MESSAGES.length)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [isActive])

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.preferences) {
          setCommitmentLevel(data.preferences.commitmentLevel || 'part_time')
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

  const filteredFields = FIELDS.filter(f => 
    f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedField = FIELDS.find(f => f.value === field)

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-8">
      {/* Logo Header */}
      <motion.div 
        className="text-center mb-6"
        animate={{ 
          opacity: [0.9, 1, 0.9],
          scale: [0.98, 1, 0.98]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-8 h-8 text-bidaaya-accent" />
          <h1 className="text-2xl font-semibold text-bidaaya-light">Bidaaya AI Agent</h1>
        </div>
        <p className="text-sm text-bidaaya-light/60">
          Set your preferences and let our AI agent find opportunities
        </p>
      </motion.div>

      {/* Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className={cn(
              "w-5 h-5 transition-colors",
              isActive ? "text-green-400" : "text-bidaaya-light/40"
            )} />
            <span className="text-base font-medium text-bidaaya-light">AI Agent</span>
          </div>

          {/* Glowing Toggle Switch */}
          <button
            onClick={toggleAgent}
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
        </div>

        {/* Commitment Segmented Control */}
        <div className="mb-5">
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
                <span className="relative z-10 flex flex-col items-center">
                  <span>{option.label}</span>
                  <span className="text-xs opacity-60">{option.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Smart Select Field */}
        <div className="mb-5 relative">
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
                className="absolute top-full left-0 right-0 mt-2 bg-[#0f1320]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {/* Search Input */}
                <div className="p-3 border-b border-white/[0.05]">
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

                {/* Options */}
                <div className="max-h-64 overflow-y-auto">
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
                          "w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.06] transition-colors",
                          field === option.value && "bg-bidaaya-accent/10"
                        )}
                      >
                        <span className="text-xl">{option.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="text-sm text-bidaaya-light font-medium">{option.label}</div>
                          <div className="text-xs text-bidaaya-light/50">{option.description}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Bar */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-lg"
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
            <button
              onClick={toggleAgent}
              className="text-xs text-green-400/70 hover:text-green-400 transition-colors"
            >
              Pause
            </button>
          </motion.div>
        )}

        {/* Paused State */}
        {!isActive && (
          <div className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-lg">
            <span className="text-xs text-bidaaya-light/40">
              Agent paused — turn me on to keep scouting
            </span>
          </div>
        )}
      </motion.div>

      {/* Close dropdown when clicking outside */}
      {showFieldDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowFieldDropdown(false)}
        />
      )}
    </div>
  )
}

