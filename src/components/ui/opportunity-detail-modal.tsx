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
import { CVEnhancementModal } from '@/components/ui/cv-enhancement-modal'

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
  const [showCVModal, setShowCVModal] = useState(false)
  const [showCreditConfirm, setShowCreditConfirm] = useState(false)
  const [isGeneratingCV, setIsGeneratingCV] = useState(false)
  const [userCredits, setUserCredits] = useState<number | null>(null)

  // Fetch user credits when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/credits/balance')
        .then(res => res.json())
        .then(data => setUserCredits(data.balance))
        .catch(() => setUserCredits(null))
    }
  }, [isOpen])

  const handleCVClick = () => {
    setShowCreditConfirm(true)
  }

  const handleCreditConfirm = () => {
    setShowCreditConfirm(false)
    setShowCVModal(true)
  }

  const handleCVComplete = async (answers: any[]) => {
    setIsGeneratingCV(true)
    try {
      // Generate custom CV
      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          opportunityType: 'external',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Download the CV as Word document
        const downloadResponse = await fetch('/api/cv/export/docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opportunityId: opportunity.id,
            opportunityType: 'external',
          }),
        })

        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `CV_${opportunity.company}_${opportunity.title.replace(/[^a-z0-9]/gi, '_')}.docx`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)

          alert(`✅ Custom CV generated and downloaded! ${data.creditsDeducted} credits deducted.`)
        }
      } else {
        const error = await response.json()
        if (error.error === 'Insufficient credits') {
          alert(`❌ Insufficient credits! You need ${error.required} credits but have ${error.current}.`)
        } else {
          alert('❌ Failed to generate CV. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error generating CV:', error)
      alert('❌ Failed to generate CV. Please try again.')
    } finally {
      setIsGeneratingCV(false)
      setShowCVModal(false)
    }
  }
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
                        onClick={handleCVClick}
                        variant="outline"
                        className="border-bidaaya-accent/30 text-bidaaya-accent hover:bg-bidaaya-accent/10"
                        disabled={isGeneratingCV}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Custom CV
                      </Button>
                      <Button
                        onClick={() => alert('🔒 Custom Cover Letter feature coming soon!')}
                        variant="outline"
                        className="border-bidaaya-light/20 text-bidaaya-light/60 hover:bg-bidaaya-light/5 cursor-not-allowed"
                      >
                        <Lock className="h-3 w-3 mr-1" />
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

      {/* Credit Confirmation Modal */}
      {showCreditConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-bidaaya-dark border border-bidaaya-light/20 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-bidaaya-light/10">
              <h3 className="text-xl font-bold text-bidaaya-light flex items-center gap-2">
                <FileText className="h-5 w-5 text-bidaaya-accent" />
                Custom CV Generator
              </h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-bidaaya-accent/10 border border-bidaaya-accent/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-bidaaya-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-bidaaya-light font-medium mb-1">
                    Tailored CV for {opportunity.company}
                  </p>
                  <p className="text-xs text-bidaaya-light/60">
                    Answer 3-5 quick questions to create a CV customized for this {opportunity.title} role
                  </p>
                </div>
              </div>

              {/* Credit Info */}
              <div className="flex items-center justify-between p-4 bg-bidaaya-light/5 rounded-lg">
                <div>
                  <p className="text-sm text-bidaaya-light/60">Cost</p>
                  <p className="text-2xl font-bold text-bidaaya-accent">5 Credits</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-bidaaya-light/60">Your Balance</p>
                  <p className="text-2xl font-bold text-bidaaya-light">
                    {userCredits !== null ? userCredits : '...'} Credits
                  </p>
                </div>
              </div>

              {/* Warning if insufficient credits */}
              {userCredits !== null && userCredits < 5 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">
                    ⚠️ Insufficient credits. You need 5 credits but have {userCredits}.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <Button
                onClick={() => setShowCreditConfirm(false)}
                variant="ghost"
                className="flex-1 text-bidaaya-light/60 hover:text-bidaaya-light"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreditConfirm}
                disabled={userCredits !== null && userCredits < 5}
                className="flex-1 bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* CV Enhancement Modal */}
      <CVEnhancementModal
        isOpen={showCVModal}
        onClose={() => setShowCVModal(false)}
        opportunityId={opportunity.id}
        opportunityTitle={opportunity.title}
        opportunityDescription={opportunity.description || ''}
        opportunityCategory={opportunity.type}
        onComplete={handleCVComplete}
      />
    </AnimatePresence>
  )
}

