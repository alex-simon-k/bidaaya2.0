'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, Clock, Lock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EarlyAccessBannerProps {
  opportunity: {
    id: string
    title: string
    company: string
    earlyAccessUntil?: Date | string
  }
  onDismiss: () => void
  onClick: () => void
  isLocked?: boolean
}

export function EarlyAccessBanner({ opportunity, onDismiss, onClick, isLocked = true }: EarlyAccessBannerProps) {
  const getTimeRemaining = () => {
    if (!opportunity.earlyAccessUntil) return ''
    
    try {
      const until = typeof opportunity.earlyAccessUntil === 'string' 
        ? new Date(opportunity.earlyAccessUntil) 
        : opportunity.earlyAccessUntil
      
      if (isNaN(until.getTime())) return ''
      
      const now = new Date()
      const diffTime = until.getTime() - now.getTime()
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      
      if (diffHours < 1) return 'Less than 1 hour left'
      if (diffHours < 24) return `${diffHours}h left`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ${diffHours % 24}h left`
    } catch {
      return ''
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      className="relative mb-4"
    >
      <div
        onClick={onClick}
        className={cn(
          "relative rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-yellow-600/20 backdrop-blur-sm p-6 cursor-pointer overflow-hidden",
          "hover:border-yellow-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/30"
        )}
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5 animate-pulse" />
        
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-2 hover:bg-bidaaya-light/10 rounded-lg transition-colors z-10"
        >
          <X className="h-4 w-4 text-bidaaya-light/60 hover:text-bidaaya-light" />
        </button>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/30 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-bidaaya-light">
                  🔥 24-Hour Early Access
                </h3>
                {getTimeRemaining() && (
                  <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/30 px-2.5 py-1 rounded-full font-semibold">
                    <Clock className="h-3 w-3" />
                    {getTimeRemaining()}
                  </span>
                )}
              </div>
              <p className="text-xs text-yellow-400/80 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" />
                Apply early for 3x better chances
              </p>
            </div>
          </div>

          {/* Opportunity Details - Blurred if Locked */}
          <div className="relative">
            {isLocked && (
              <div className="absolute inset-0 backdrop-blur-md bg-bidaaya-dark/40 rounded-xl flex items-center justify-center z-10">
                <div className="text-center">
                  <Lock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-bidaaya-light mb-1">Use Credits to Unlock</p>
                  <p className="text-xs text-bidaaya-light/60">See full opportunity details</p>
                </div>
              </div>
            )}
            
            <div className={cn("space-y-2", isLocked && "blur-sm select-none")}>
              <p className="text-sm font-semibold text-bidaaya-light">
                {opportunity.title}
              </p>
              <p className="text-xs text-bidaaya-light/70">
                at {opportunity.company}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-yellow-400/70">
              ✨ Exclusive to premium members
            </div>
            <Button
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-600 text-bidaaya-dark font-semibold shadow-lg"
            >
              {isLocked ? 'Unlock Now' : 'View Details'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

