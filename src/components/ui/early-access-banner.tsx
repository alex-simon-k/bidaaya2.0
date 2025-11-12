'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, Clock } from 'lucide-react'
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
}

export function EarlyAccessBanner({ opportunity, onDismiss, onClick }: EarlyAccessBannerProps) {
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
          "relative rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm p-4 cursor-pointer",
          "hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20"
        )}
      >
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-bidaaya-light/10 rounded-lg transition-colors z-10"
        >
          <X className="h-4 w-4 text-bidaaya-light/60 hover:text-bidaaya-light" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-yellow-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-bidaaya-light">
                Today's Early Access Pick
              </h3>
              {getTimeRemaining() && (
                <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full">
                  <Clock className="h-3 w-3" />
                  {getTimeRemaining()}
                </span>
              )}
            </div>
            <p className="text-xs text-bidaaya-light/70 line-clamp-1">
              <span className="font-medium">{opportunity.title}</span> at {opportunity.company}
            </p>
          </div>

          {/* Click indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-bidaaya-light/60">
            <span>Click to view</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

