'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Target, Briefcase, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentControlsProps {
  onPreferencesChange?: (preferences: { commitmentLevel: string; field: string }) => void
}

const COMMITMENT_LEVELS = [
  { value: 'full_time', label: 'Full-Time', description: '40+ hours/week' },
  { value: 'part_time', label: 'Part-Time', description: '20-30 hours/week' },
  { value: 'flexible', label: 'Flexible', description: 'As available' },
]

const FIELDS = [
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'business', label: 'Business', icon: '📊' },
  { value: 'marketing', label: 'Marketing', icon: '📱' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'consulting', label: 'Consulting', icon: '🤝' },
  { value: 'engineering', label: 'Engineering', icon: '⚙️' },
  { value: 'any', label: 'Open to All', icon: '🌟' },
]

export function AgentControls({ onPreferencesChange }: AgentControlsProps) {
  const [commitmentLevel, setCommitmentLevel] = useState<string>('flexible')
  const [field, setField] = useState<string>('any')
  const [isActive, setIsActive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleFieldChange = (value: string) => {
    setField(value)
    savePreferences(undefined, value, undefined)
  }

  const toggleAgent = () => {
    const newActive = !isActive
    setIsActive(newActive)
    savePreferences(undefined, undefined, newActive)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-bidaaya-accent/10 to-blue-500/10 border border-bidaaya-accent/20 rounded-xl p-4 mb-6"
    >
      {/* Compact Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className={cn(
            "w-5 h-5",
            isActive ? "text-green-400" : "text-bidaaya-light/40"
          )} />
          <h2 className="text-base font-semibold text-bidaaya-light">AI Agent</h2>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            isActive ? "bg-green-500/20 text-green-400" : "bg-bidaaya-light/10 text-bidaaya-light/40"
          )}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={toggleAgent}
          disabled={isSaving}
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors duration-300",
            isActive ? "bg-green-500" : "bg-bidaaya-light/20",
            isSaving && "opacity-50 cursor-not-allowed"
          )}
        >
          <motion.div
            animate={{ x: isActive ? 24 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
          />
        </button>
      </div>

      {/* Compact Controls Row */}
      <div className="flex gap-3">
        {/* Commitment Level Dropdown */}
        <div className="flex-1">
          <label className="text-xs text-bidaaya-light/60 mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Commitment
          </label>
          <select
            value={commitmentLevel}
            onChange={(e) => handleCommitmentChange(e.target.value)}
            disabled={isSaving}
            className="w-full bg-bidaaya-light/5 border border-bidaaya-light/20 rounded-lg px-3 py-2 text-sm text-bidaaya-light focus:border-bidaaya-accent focus:outline-none"
          >
            {COMMITMENT_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label} ({level.description})
              </option>
            ))}
          </select>
        </div>

        {/* Field Dropdown */}
        <div className="flex-1">
          <label className="text-xs text-bidaaya-light/60 mb-1 flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            Field
          </label>
          <select
            value={field}
            onChange={(e) => handleFieldChange(e.target.value)}
            disabled={isSaving}
            className="w-full bg-bidaaya-light/5 border border-bidaaya-light/20 rounded-lg px-3 py-2 text-sm text-bidaaya-light focus:border-bidaaya-accent focus:outline-none"
          >
            {FIELDS.map((fieldOption) => (
              <option key={fieldOption.value} value={fieldOption.value}>
                {fieldOption.icon} {fieldOption.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Message */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg"
        >
          <p className="text-xs text-green-400 flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            Agent active - finding opportunities for you
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

