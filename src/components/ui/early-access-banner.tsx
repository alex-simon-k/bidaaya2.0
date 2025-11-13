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
      className="relative mb-3"
    >
      <div
        className={cn(
          "relative rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm overflow-hidden",
          "hover:border-yellow-500/50 transition-all duration-300"
        )}
      >
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 hover:bg-bidaaya-light/10 rounded-lg transition-colors z-20"
        >
          <X className="h-3.5 w-3.5 text-bidaaya-light/60 hover:text-bidaaya-light" />
        </button>

        {/* Content - Clickable */}
        <div
          onClick={onClick}
          className="relative p-4 pr-10 cursor-pointer"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <img 
                src="/icons/early-access.svg" 
                alt="Early Access"
                className="h-5 w-5 object-contain"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-sm font-bold text-bidaaya-light whitespace-nowrap">
                  🔥 Early Access
                </h3>
                {getTimeRemaining() && (
                  <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full font-semibold">
                    <Clock className="h-2.5 w-2.5" />
                    {getTimeRemaining()}
                  </span>
                )}
              </div>

              {/* Opportunity Details - Blurred if Locked */}
              <div className="relative">
                {isLocked && (
                  <div className="absolute inset-0 backdrop-blur-sm bg-bidaaya-dark/30 rounded-lg flex items-center justify-center z-10">
                    <Lock className="h-5 w-5 text-yellow-400" />
                  </div>
                )}
                
                <div className={cn("", isLocked && "blur-[2px] select-none")}>
                  <p className="text-xs text-bidaaya-light/80 line-clamp-1">
                    {opportunity.title}
                  </p>
                  <p className="text-[10px] text-bidaaya-light/60 line-clamp-1">
                    {opportunity.company}
                  </p>
                </div>
              </div>

              {/* Benefit */}
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="h-3 w-3 text-yellow-400" />
                <span className="text-[10px] text-yellow-400/80">3x better success rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

