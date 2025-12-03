'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Lock, ExternalLink, Sparkles, Building2, MapPin, Clock, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useSession } from "next-auth/react"

interface OpportunityCardV2Props {
  opportunity: {
    id: string
    title: string
    company: string
    companyLogo?: string
    location: string
    type: 'internal' | 'external' | 'early_access'
    matchScore?: number
    earlyAccessUntil?: Date | string | null
    isLocked?: boolean
    applicationUrl?: string
    postedDate?: Date | string
  }
  isEarlyRelease?: boolean
  userPlan?: string
  earlyAccessUnlocksRemaining?: number
  onApply?: (opportunityId: string) => void
  onUnlock?: (opportunityId: string) => void
}

export function OpportunityCardV2({
  opportunity,
  isEarlyRelease = false,
  userPlan = 'FREE',
  earlyAccessUnlocksRemaining = 0,
  onApply,
  onUnlock,
}: OpportunityCardV2Props) {
  const { data: session } = useSession()
  const isLocked = isEarlyRelease && opportunity.isLocked && userPlan !== 'STUDENT_PRO'
  const hasPro = userPlan === 'STUDENT_PRO'
  const hasPremium = userPlan === 'STUDENT_PREMIUM'
  const hasFreeUnlocks = hasPremium && earlyAccessUnlocksRemaining > 0

  // Determine card color based on match score or type
  const getColorClass = () => {
    if (isEarlyRelease) return 'border-yellow-500/30 bg-yellow-500/5'
    if (opportunity.matchScore && opportunity.matchScore >= 80) return 'border-green-500/30 bg-green-500/5'
    if (opportunity.matchScore && opportunity.matchScore >= 60) return 'border-blue-500/30 bg-blue-500/5'
    if (opportunity.matchScore && opportunity.matchScore >= 40) return 'border-orange-500/30 bg-orange-500/5'
    return 'border-bidaaya-light/10 bg-bidaaya-light/5'
  }

  const getAccentColor = () => {
    if (isEarlyRelease) return 'text-yellow-400'
    if (opportunity.matchScore && opportunity.matchScore >= 80) return 'text-green-400'
    if (opportunity.matchScore && opportunity.matchScore >= 60) return 'text-blue-400'
    if (opportunity.matchScore && opportunity.matchScore >= 40) return 'text-orange-400'
    return 'text-bidaaya-accent'
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Recently'
    
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      
      if (!d || !(d instanceof Date) || isNaN(d.getTime())) {
        return 'Recently'
      }
      
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - d.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Recently'
    }
  }

  const getTimeRemaining = () => {
    if (!opportunity.earlyAccessUntil) return ''
    
    try {
      const until = typeof opportunity.earlyAccessUntil === 'string' 
        ? new Date(opportunity.earlyAccessUntil) 
        : opportunity.earlyAccessUntil
      
      if (!until || !(until instanceof Date) || isNaN(until.getTime())) {
        return ''
      }
      
      const now = new Date()
      const diffTime = until.getTime() - now.getTime()
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      
      if (diffHours < 1) return 'Less than 1 hour'
      if (diffHours < 24) return `${diffHours} hours left`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} day${diffDays > 1 ? 's' : ''} left`
    } catch (error) {
      console.error('Error calculating time remaining:', error)
      return ''
    }
  }

  const handleApply = () => {
    // Check if Phase II is completed
    if (!(session?.user as any)?.profileCompleted) {
      console.log('⚠️ Phase II not completed, redirecting to builder...');
      window.location.href = '/dashboard?cv_edit=true';
      return;
    }

    if (opportunity.type === 'external' && opportunity.applicationUrl) {
      window.open(opportunity.applicationUrl, '_blank')
    } else if (onApply) {
      onApply(opportunity.id)
    }
  }

  const handleUnlock = () => {
    if (onUnlock) {
      onUnlock(opportunity.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative rounded-2xl border backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-xl',
        getColorClass(),
        isLocked && 'opacity-90'
      )}
    >
      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-bidaaya-dark/80 backdrop-blur-sm rounded-full p-3 border border-yellow-500/30">
            <Lock className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      )}

      {/* Early Release Badge */}
      {isEarlyRelease && (
        <div className="absolute -top-3 left-6">
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-3 py-1">
            <Zap className="h-3 w-3 mr-1" />
            Early Release
          </Badge>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Company Logo */}
          <div className="w-12 h-12 rounded-xl bg-bidaaya-light/10 flex items-center justify-center overflow-hidden border border-bidaaya-light/10">
            {opportunity.companyLogo ? (
              <img 
                src={opportunity.companyLogo} 
                alt={opportunity.company}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="h-6 w-6 text-bidaaya-light/60" />
            )}
          </div>

          {/* Title & Company */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-bidaaya-light mb-1 line-clamp-1">
              {opportunity.title}
            </h3>
            <p className="text-sm text-bidaaya-light/70 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {opportunity.company}
            </p>
          </div>
        </div>

        {/* External Link Badge */}
        {opportunity.type === 'external' && (
          <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            External
          </Badge>
        )}
      </div>

      {/* Card Body */}
      <div className="space-y-3 mb-4">
        {/* Location & Date */}
        <div className="flex items-center gap-4 text-sm text-bidaaya-light/60">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {opportunity.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(opportunity.postedDate)}
          </span>
        </div>

        {/* Match Score */}
        {opportunity.matchScore !== undefined && (
          <div className="bg-bidaaya-dark/30 rounded-lg p-3 border border-bidaaya-light/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-bidaaya-light/70">Match Score</span>
              <span className={cn('text-xl font-bold', getAccentColor())}>
                {opportunity.matchScore}%
              </span>
            </div>
            <div className="w-full bg-bidaaya-light/10 rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${opportunity.matchScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-1.5 rounded-full',
                  isEarlyRelease ? 'bg-yellow-400' :
                  opportunity.matchScore >= 80 ? 'bg-green-400' :
                  opportunity.matchScore >= 60 ? 'bg-blue-400' :
                  opportunity.matchScore >= 40 ? 'bg-orange-400' :
                  'bg-bidaaya-accent'
                )}
              />
            </div>
          </div>
        )}

        {/* Early Access Timer */}
        {isEarlyRelease && opportunity.earlyAccessUntil && (
          <div className="flex items-center justify-between text-xs text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2 border border-yellow-500/20">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Early access ends in:
            </span>
            <span className="font-semibold">{getTimeRemaining()}</span>
          </div>
        )}
      </div>

      {/* Card Footer - Action Buttons */}
      <div className="flex gap-2 pt-2">
        {isLocked ? (
          <>
            {hasPro ? (
              <Button
                onClick={handleUnlock}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-bidaaya-dark"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Unlock (Free)
              </Button>
            ) : hasFreeUnlocks ? (
              <Button
                onClick={handleUnlock}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-bidaaya-dark"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Use Free Unlock ({earlyAccessUnlocksRemaining} left)
              </Button>
            ) : (
              <Button
                onClick={handleUnlock}
                variant="outline"
                className="flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock with Credits
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={handleApply}
              disabled
              className="flex-1 bg-bidaaya-accent/50 hover:bg-bidaaya-accent/50 cursor-not-allowed opacity-60"
            >
              Custom CV
              <span className="ml-2 text-xs opacity-75">(Coming Soon)</span>
            </Button>
            <Button
              onClick={handleApply}
              variant="outline"
              className="flex-1 border-bidaaya-accent/30 text-bidaaya-accent hover:bg-bidaaya-accent/10"
            >
              Apply Now
            </Button>
          </>
        )}
      </div>
    </motion.div>
  )
}

