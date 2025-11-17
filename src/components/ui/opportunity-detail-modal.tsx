'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Building2,
  MapPin,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  CheckCircle2,
  Calendar,
  XCircle,
  Trophy,
  Lock,
  Unlock,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface OpportunityDetailModalProps {
  isOpen: boolean
  onClose: () => void
  opportunity: {
    id: string
    title: string
    company: string
    companyLogo?: string
    location: string
    type: 'internal' | 'external' | 'early_access'
    matchScore?: number
    applicationUrl?: string
    postedDate?: Date | string
    description?: string
    requirements?: string[]
    isLocked?: boolean
    unlockCredits?: number
  }
  hasApplied?: boolean
  onMarkAsApplied?: () => void
  onGenerateCV?: () => void
  onGenerateCoverLetter?: () => void
  onUnlock?: (opportunityId: string, opportunityType: string) => void
  userPlan?: string
}

export function OpportunityDetailModal({
  isOpen,
  onClose,
  opportunity,
  hasApplied = false,
  onMarkAsApplied,
  onGenerateCV,
  onGenerateCoverLetter,
  onUnlock,
  userPlan
}: OpportunityDetailModalProps) {
  const handleApply = () => {
    // Treat early_access type as external since they're external opportunities with early access
    if ((opportunity.type === 'external' || opportunity.type === 'early_access') && opportunity.applicationUrl) {
      window.open(opportunity.applicationUrl, '_blank')
    } else if (opportunity.type === 'internal') {
      // For internal opportunities, navigate to application page
      window.location.href = `/dashboard/projects/${opportunity.id}`
    }
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Recently'
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      if (isNaN(d.getTime())) return 'Recently'
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Recently'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-bidaaya-dark border border-bidaaya-light/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 bg-bidaaya-dark/95 backdrop-blur-sm border-b border-bidaaya-light/10 p-6 z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Company Logo */}
                    <div className="w-16 h-16 rounded-xl bg-bidaaya-light/10 flex items-center justify-center overflow-hidden border border-bidaaya-light/10 flex-shrink-0 relative">
                      <div className={cn("w-full h-full", opportunity.isLocked && opportunity.type === 'early_access' && "blur-md")}>
                        {opportunity.companyLogo ? (
                          <img 
                            src={opportunity.companyLogo} 
                            alt={opportunity.company}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-bidaaya-light/60" />
                        )}
                      </div>
                      {opportunity.isLocked && opportunity.type === 'early_access' && (
                        <div className="absolute inset-0 bg-bidaaya-dark/40 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-bidaaya-accent" />
                        </div>
                      )}
                    </div>

                    {/* Title & Company */}
                    <div className="flex-1">
                      <div className={cn("", opportunity.isLocked && opportunity.type === 'early_access' && "blur-md select-none")}>
                        <h2 className="text-2xl font-bold text-bidaaya-light mb-2">
                          {opportunity.title}
                        </h2>
                        <p className="text-bidaaya-light/70 flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4" />
                          {opportunity.company}
                        </p>
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
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-bidaaya-light/10 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-bidaaya-light/60" />
                  </button>
                </div>

                {/* Match Score & Status */}
                <div className="flex items-center gap-3 mt-4">
                  {opportunity.matchScore !== undefined && (
                    <Badge className={cn(
                      'px-3 py-1',
                      opportunity.matchScore >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      opportunity.matchScore >= 60 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      opportunity.matchScore >= 40 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                      'bg-bidaaya-accent/20 text-bidaaya-accent border-bidaaya-accent/30'
                    )}>
                      {opportunity.matchScore}% Match
                    </Badge>
                  )}
                  
                  {opportunity.type === 'external' && (
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      External
                    </Badge>
                  )}

                  {hasApplied && (
                    <Badge className="px-3 py-1 bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Applied
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className={cn("p-6", opportunity.isLocked && opportunity.type === 'early_access' ? "py-8" : "space-y-6")}>
                {opportunity.isLocked && opportunity.type === 'early_access' ? (
                  /* Locked State - Compact Design */
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-bidaaya-accent/10 flex items-center justify-center mb-4">
                      <Lock className="h-8 w-8 text-bidaaya-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-bidaaya-light mb-2">
                      Early Access Opportunity
                    </h3>
                    <p className="text-sm text-bidaaya-light/60 mb-1 max-w-sm">
                      Unlock to view full details and apply early
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-bidaaya-light/50">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>3x better success rate</span>
                    </div>
                  </div>
                ) : (
                  /* Unlocked State - Normal Content */
                  <div className="space-y-6">
                    {/* Description */}
                    {opportunity.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-bidaaya-light/80 mb-2 uppercase tracking-wide">
                          About this opportunity
                        </h3>
                        <p className="text-bidaaya-light/70 leading-relaxed">
                          {opportunity.description}
                        </p>
                      </div>
                    )}

                    {/* Requirements */}
                    {opportunity.requirements && opportunity.requirements.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-bidaaya-light/80 mb-3 uppercase tracking-wide">
                          Requirements
                        </h3>
                        <ul className="space-y-2">
                          {opportunity.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2 text-bidaaya-light/70">
                              <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className={cn("space-y-3", !(opportunity.isLocked && opportunity.type === 'early_access') && "pt-4 border-t border-bidaaya-light/10")}>
                  {/* Main Actions - Hide if locked */}
                  {!(opportunity.isLocked && opportunity.type === 'early_access') && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={onGenerateCV}
                        variant="outline"
                        className="border-bidaaya-accent/30 text-bidaaya-accent hover:bg-bidaaya-accent/10"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Custom CV
                      </Button>
                      <Button
                        onClick={onGenerateCoverLetter}
                        variant="outline"
                        className="border-bidaaya-accent/30 text-bidaaya-accent hover:bg-bidaaya-accent/10"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Cover Letter
                      </Button>
                    </div>
                  )}

                  {/* Apply Button or Unlock Button */}
                  {opportunity.isLocked && opportunity.type === 'early_access' && onUnlock ? (
                    <div className="mt-6">
                      {userPlan === 'STUDENT_PRO' ? (
                        <Button
                          onClick={() => onUnlock(opportunity.id, 'external')}
                          className="w-full bg-green-500 hover:bg-green-600 text-white py-6 text-base font-semibold"
                        >
                          <Unlock className="h-5 w-5 mr-2" />
                          Unlock Free (Pro Member)
                        </Button>
                      ) : (
                        <Button
                          onClick={() => onUnlock(opportunity.id, 'external')}
                          className="w-full bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white py-6 text-base font-semibold"
                        >
                          <Lock className="h-5 w-5 mr-2" />
                          Unlock Now ({opportunity.unlockCredits || 7} Credits)
                        </Button>
                      )}
                    </div>
                  ) : !hasApplied ? (
                    <Button
                      onClick={handleApply}
                      className="w-full bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        disabled
                        className="w-full bg-green-500/20 text-green-400 cursor-default"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Applied
                      </Button>
                      <p className="text-xs text-center text-bidaaya-light/60">
                        Track this application in your Applications page
                      </p>
                    </div>
                  )}

                  {/* Mark as Applied Button (after clicking Apply) - Hide if locked or already applied */}
                  {!hasApplied && onMarkAsApplied && !(opportunity.isLocked && opportunity.type === 'early_access') && (
                    <Button
                      onClick={onMarkAsApplied}
                      variant="outline"
                      size="sm"
                      className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as Applied
                    </Button>
                  )}
                  
                  {/* Already Applied Indicator */}
                  {hasApplied && (
                    <div className="w-full py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center text-green-400 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4 inline mr-2" />
                      Already Applied
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

