'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Building2, MapPin, ExternalLink, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface OpportunityCardCompactProps {
  opportunity: {
    id: string
    title: string
    company: string
    companyLogo?: string
    location: string
    type: 'internal' | 'external' | 'early_access'
    matchScore?: number
  }
  onClick?: () => void
  className?: string
}

export function OpportunityCardCompact({
  opportunity,
  onClick,
  className
}: OpportunityCardCompactProps) {
  const getMatchColor = () => {
    if (!opportunity.matchScore) return 'border-bidaaya-light/10 bg-bidaaya-light/5'
    if (opportunity.matchScore >= 80) return 'border-green-500/30 bg-green-500/5'
    if (opportunity.matchScore >= 60) return 'border-blue-500/30 bg-blue-500/5'
    if (opportunity.matchScore >= 40) return 'border-orange-500/30 bg-orange-500/5'
    return 'border-bidaaya-light/10 bg-bidaaya-light/5'
  }

  const getAccentColor = () => {
    if (!opportunity.matchScore) return 'text-bidaaya-accent'
    if (opportunity.matchScore >= 80) return 'text-green-400'
    if (opportunity.matchScore >= 60) return 'text-blue-400'
    if (opportunity.matchScore >= 40) return 'text-orange-400'
    return 'text-bidaaya-accent'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'relative rounded-xl border backdrop-blur-sm p-4 cursor-pointer transition-all duration-300 hover:shadow-lg',
        getMatchColor(),
        className
      )}
    >
      {/* Company Logo & Title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-bidaaya-light/10 flex items-center justify-center overflow-hidden border border-bidaaya-light/10 flex-shrink-0">
          {opportunity.companyLogo ? (
            <img 
              src={opportunity.companyLogo} 
              alt={opportunity.company}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="h-5 w-5 text-bidaaya-light/60" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-bidaaya-light mb-0.5 line-clamp-2 leading-tight">
            {opportunity.title}
          </h3>
          <p className="text-xs text-bidaaya-light/60 line-clamp-1">
            {opportunity.company}
          </p>
        </div>

        {/* External Badge */}
        {opportunity.type === 'external' && (
          <ExternalLink className="h-4 w-4 text-purple-400 flex-shrink-0" />
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-bidaaya-light/60 mb-3">
        <MapPin className="h-3 w-3" />
        <span className="line-clamp-1">{opportunity.location}</span>
      </div>

      {/* Match Score */}
      {opportunity.matchScore !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-bidaaya-light/60">Match</span>
          <div className="flex items-center gap-2">
            <div className="w-16 bg-bidaaya-light/10 rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${opportunity.matchScore}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={cn(
                  'h-1.5 rounded-full',
                  opportunity.matchScore >= 80 ? 'bg-green-400' :
                  opportunity.matchScore >= 60 ? 'bg-blue-400' :
                  opportunity.matchScore >= 40 ? 'bg-orange-400' :
                  'bg-bidaaya-accent'
                )}
              />
            </div>
            <span className={cn('text-sm font-bold', getAccentColor())}>
              {opportunity.matchScore}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

