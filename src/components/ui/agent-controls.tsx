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
      className="bg-gradient-to-r from-bidaaya-accent/10 to-blue-500/10 border border-bidaaya-accent/20 rounded-xl p-6 mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isActive ? "bg-green-500" : "bg-bidaaya-light/10"
          )}>
            <Zap className={cn(
              "w-5 h-5 transition-colors",
              isActive ? "text-white" : "text-bidaaya-light/40"
            )} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-bidaaya-light">AI Agent</h2>
            <p className="text-xs text-bidaaya-light/60">
              {isActive ? 'Actively searching for opportunities' : 'Set your preferences to start'}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={toggleAgent}
          disabled={isSaving}
          className={cn(
            "relative w-14 h-8 rounded-full transition-colors duration-300",
            isActive ? "bg-green-500" : "bg-bidaaya-light/20",
            isSaving && "opacity-50 cursor-not-allowed"
          )}
        >
          <motion.div
            animate={{ x: isActive ? 24 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
          />
        </button>
      </div>

      {/* Commitment Level */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-bidaaya-accent" />
          <label className="text-sm font-medium text-bidaaya-light">Commitment Level</label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {COMMITMENT_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => handleCommitmentChange(level.value)}
              disabled={isSaving}
              className={cn(
                "p-3 rounded-lg border transition-all text-left",
                commitmentLevel === level.value
                  ? "bg-bidaaya-accent/20 border-bidaaya-accent text-bidaaya-light"
                  : "bg-bidaaya-light/5 border-bidaaya-light/10 text-bidaaya-light/60 hover:border-bidaaya-light/20",
                isSaving && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{level.label}</span>
                {commitmentLevel === level.value && (
                  <CheckCircle className="w-4 h-4 text-bidaaya-accent" />
                )}
              </div>
              <span className="text-xs opacity-70">{level.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Field Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-bidaaya-accent" />
          <label className="text-sm font-medium text-bidaaya-light">Field of Interest</label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FIELDS.map((fieldOption) => (
            <button
              key={fieldOption.value}
              onClick={() => handleFieldChange(fieldOption.value)}
              disabled={isSaving}
              className={cn(
                "p-3 rounded-lg border transition-all text-center",
                field === fieldOption.value
                  ? "bg-bidaaya-accent/20 border-bidaaya-accent text-bidaaya-light"
                  : "bg-bidaaya-light/5 border-bidaaya-light/10 text-bidaaya-light/60 hover:border-bidaaya-light/20",
                isSaving && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="text-2xl mb-1">{fieldOption.icon}</div>
              <div className="text-xs font-medium">{fieldOption.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Status Message */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
        >
          <p className="text-sm text-green-400 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Agent is active! You'll receive personalized opportunities matching your preferences.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

