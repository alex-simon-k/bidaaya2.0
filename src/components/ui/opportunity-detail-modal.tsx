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
  Trophy
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
  }
  applicationStatus?: 'not_applied' | 'applied' | 'interview' | 'rejected' | 'accepted'
  onUpdateStatus?: (status: 'applied' | 'interview' | 'rejected' | 'accepted') => void
  onGenerateCV?: () => void
  onGenerateCoverLetter?: () => void
}

export function OpportunityDetailModal({
  isOpen,
  onClose,
  opportunity,
  applicationStatus = 'not_applied',
  onUpdateStatus,
  onGenerateCV,
  onGenerateCoverLetter
}: OpportunityDetailModalProps) {
  const [showStatusOptions, setShowStatusOptions] = useState(false)

  const handleApply = () => {
    if (opportunity.type === 'external' && opportunity.applicationUrl) {
      window.open(opportunity.applicationUrl, '_blank')
      // Show status tracking options after they click apply
      setShowStatusOptions(true)
    } else {
      // For internal opportunities, navigate to application page
      window.location.href = `/dashboard/projects/${opportunity.id}`
    }
  }

  const getStatusIcon = (status: typeof applicationStatus) => {
    switch (status) {
      case 'applied':
        return <CheckCircle2 className="h-4 w-4" />
      case 'interview':
        return <Calendar className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'accepted':
        return <Trophy className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: typeof applicationStatus) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'interview':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return ''
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
                    <div className="w-16 h-16 rounded-xl bg-bidaaya-light/10 flex items-center justify-center overflow-hidden border border-bidaaya-light/10 flex-shrink-0">
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

                    {/* Title & Company */}
                    <div className="flex-1">
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

                  {applicationStatus !== 'not_applied' && (
                    <Badge className={cn('px-3 py-1', getStatusColor(applicationStatus))}>
                      {getStatusIcon(applicationStatus)}
                      <span className="ml-1.5 capitalize">{applicationStatus}</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
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

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-bidaaya-light/10">
                  {/* Main Actions */}
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

                  {/* Apply Button */}
                  <Button
                    onClick={handleApply}
                    disabled={applicationStatus === 'applied' || applicationStatus === 'interview' || applicationStatus === 'accepted'}
                    className="w-full bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {applicationStatus === 'applied' || applicationStatus === 'interview' || applicationStatus === 'accepted' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Already Applied
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply Now
                      </>
                    )}
                  </Button>

                  {/* Status Tracking */}
                  {(showStatusOptions || applicationStatus !== 'not_applied') && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs text-bidaaya-light/60 mb-2">Track your application:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => onUpdateStatus?.('applied')}
                          variant="outline"
                          size="sm"
                          className={cn(
                            'text-xs',
                            applicationStatus === 'applied' 
                              ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' 
                              : 'border-bidaaya-light/20 text-bidaaya-light/60'
                          )}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Applied
                        </Button>
                        <Button
                          onClick={() => onUpdateStatus?.('interview')}
                          variant="outline"
                          size="sm"
                          className={cn(
                            'text-xs',
                            applicationStatus === 'interview' 
                              ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' 
                              : 'border-bidaaya-light/20 text-bidaaya-light/60'
                          )}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Interview
                        </Button>
                        <Button
                          onClick={() => onUpdateStatus?.('rejected')}
                          variant="outline"
                          size="sm"
                          className={cn(
                            'text-xs',
                            applicationStatus === 'rejected' 
                              ? 'border-red-500/50 bg-red-500/10 text-red-400' 
                              : 'border-bidaaya-light/20 text-bidaaya-light/60'
                          )}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejected
                        </Button>
                        <Button
                          onClick={() => onUpdateStatus?.('accepted')}
                          variant="outline"
                          size="sm"
                          className={cn(
                            'text-xs',
                            applicationStatus === 'accepted' 
                              ? 'border-green-500/50 bg-green-500/10 text-green-400' 
                              : 'border-bidaaya-light/20 text-bidaaya-light/60'
                          )}
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          Accepted
                        </Button>
                      </div>
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

