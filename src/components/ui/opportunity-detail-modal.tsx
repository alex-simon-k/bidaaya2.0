'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronLeft,
  MoreHorizontal,
  Zap,
  FileText,
  Sparkles,
  CheckCircle2,
  Briefcase,
  Check,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GlassFrame } from '@/components/ui/glass-frame'
import { ActionRow, ButtonVariant } from '@/components/ui/action-row'
import { CVEnhancementModal } from '@/components/ui/cv-enhancement-modal'

import { useSession } from "next-auth/react"

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
  const { data: session } = useSession()
  // Credits & Unlocks State
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [isCVUnlocked, setIsCVUnlocked] = useState(false)
  
  // Loading States
  const [isGeneratingCV, setIsGeneratingCV] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  
  // Modal States
  const [showCVModal, setShowCVModal] = useState(false)
  const [showCreditConfirm, setShowCreditConfirm] = useState(false)
  
  // Applied Status
  const [markedAsApplied, setMarkedAsApplied] = useState(hasApplied)
  const [isUnlocked, setIsUnlocked] = useState(!opportunity.isLocked)

  // Fetch user credits when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/credits/balance')
        .then(res => res.json())
        .then(data => setUserCredits(data.balance))
        .catch(() => setUserCredits(null))
      
      // Reset state when modal opens
      setMarkedAsApplied(hasApplied)
      setIsCVUnlocked(false)
      setIsUnlocked(!opportunity.isLocked)
    }
  }, [isOpen, hasApplied, opportunity.isLocked])

  // Extract company color from logo or use default
  const getCompanyColor = () => {
    // Try to extract from matchScore or use defaults
    if (opportunity.matchScore && opportunity.matchScore >= 80) return '#10b981' // green
    if (opportunity.matchScore && opportunity.matchScore >= 60) return '#3b82f6' // blue
    return '#8b5cf6' // purple default
  }

  // --- Handlers ---

  const handleCVClick = () => {
    // Check if Phase II is completed
    if (!(session?.user as any)?.profileCompleted) {
      console.log('⚠️ Phase II not completed, redirecting to builder...');
      window.location.href = '/dashboard?cv_edit=true';
      return;
    }
    // Show credit confirmation first
    setShowCreditConfirm(true)
  }

  const handleCreditConfirm = () => {
    setShowCreditConfirm(false)
    setShowCVModal(true)
  }

  const handleCVComplete = async (answers: any[]) => {
    if (isCVUnlocked || isGeneratingCV) return
    
    if (!userCredits || userCredits < 5) {
      showToast('error', 'Insufficient Credits', `You need 5 credits but have ${userCredits || 0}`)
      return
    }

    setIsGeneratingCV(true)
    
    try {
      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          opportunityType: opportunity.type === 'internal' ? 'internal' : 'external',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsCVUnlocked(true)
        setUserCredits(prev => prev ? prev - 5 : 0)
        
        // Download the CV
        const downloadResponse = await fetch('/api/cv/export/docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opportunityId: opportunity.id,
            opportunityType: opportunity.type === 'internal' ? 'internal' : 'external',
            generatedCvId: data.generatedCvId,
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
          
          showToast('success', 'CV Downloaded!', '5 credits used')
        }
      } else {
        const error = await response.json()
        showToast('error', 'Generation Failed', error.error || 'Could not generate CV')
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to generate CV')
    } finally {
      setIsGeneratingCV(false)
      setShowCVModal(false)
    }
  }

  const handleCoverLetterClick = () => {
    // Feature coming soon - will use custom technology
    showToast('info', 'Coming Soon', 'Cover letter generation will be available soon!')
  }

  const handleToggleApplied = async () => {
    if (markedAsApplied) {
      const confirmUndo = window.confirm("Are you sure you haven't applied to this? This will remove it from your tracked applications.")
      if (!confirmUndo) return
      setMarkedAsApplied(false)
    } else {
      setMarkedAsApplied(true)
      if (onMarkAsApplied) {
        await onMarkAsApplied()
      }
    }
  }

  const handleApply = async () => {
    // Check if Phase II is completed
    if (!(session?.user as any)?.profileCompleted) {
      console.log('⚠️ Phase II not completed, redirecting to builder...');
      window.location.href = '/dashboard?cv_edit=true';
      return;
    }

    if (opportunity.applicationUrl) {
      // Open external application URL IMMEDIATELY
      window.open(opportunity.applicationUrl, '_blank')
      
      setIsApplying(true)
      
      try {
        // Track application in backend (will enforce Phase II check)
        const response = await fetch(`/api/external-opportunities/${opportunity.id}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const data = await response.json()

        if (response.ok) {
          setMarkedAsApplied(true)
          showToast('success', 'Application Tracked', 'Good luck with your application!')
        } else {
          // Backend blocked the application
          if (data.code === 'PHASE_2_INCOMPLETE') {
            showToast('error', 'Profile Incomplete', 'Please complete your CV profile first')
            setTimeout(() => {
              window.location.href = '/dashboard?cv_edit=true'
            }, 2000)
          } else {
            showToast('error', 'Error', data.error || 'Failed to track application')
          }
        }
      } catch (error) {
        console.error('Error tracking application:', error)
        showToast('error', 'Error', 'Failed to track application')
      } finally {
        setIsApplying(false)
      }
    } else {
      // No URL - just mark as applied
      if (onMarkAsApplied) {
        onMarkAsApplied()
      }
    }
  }

  // Toast notification helper
  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 bg-bidaaya-dark border ${
      type === 'success' ? 'border-green-500/30' : 
      type === 'error' ? 'border-red-500/30' : 'border-bidaaya-accent/30'
    } text-bidaaya-light px-6 py-3 rounded-lg shadow-xl z-[100] flex items-center gap-3 animate-in slide-in-from-top-2`
    
    const icon = type === 'success' 
      ? '<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>'
      : type === 'error' 
      ? '<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>'
      : '<svg class="h-5 w-5 text-bidaaya-accent" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>'
    
    toast.innerHTML = `
      ${icon}
      <div>
        <div class="font-semibold">${title}</div>
        <div class="text-sm text-bidaaya-light/70">${message}</div>
      </div>
    `
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  // Unlock Button Component
  const UnlockButton = ({ cost, onClick, label = "Unlock" }: { cost: number, onClick: () => void, label?: string }) => (
    <button 
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="flex items-center gap-1.5 bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-transform active:scale-95"
    >
      <Zap className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      <span>{label}</span>
      <span className="opacity-70 border-l border-white/20 pl-1.5 ml-0.5">{cost}</span>
    </button>
  )

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

          {/* Modal - iOS Style Mobile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[400px] max-h-[90vh] bg-[#0B0F1A] rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col"
            >
              
              {/* Header Navigation */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 z-10">
                <button 
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-full hover:bg-bidaaya-light/10 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-bidaaya-light" />
                </button>
                
                {/* Credit Counter */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bidaaya-dark/80 rounded-full shadow-sm border border-bidaaya-light/10">
                  <Zap className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-bidaaya-light">{userCredits ?? '...'}</span>
                </div>

                <button className="p-2 -mr-2 rounded-full hover:bg-bidaaya-light/10 transition-colors opacity-50 cursor-not-allowed">
                  <MoreHorizontal className="w-6 h-6 text-bidaaya-light" />
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 px-6 pb-32 overflow-y-auto scrollbar-hide">
                
                {/* Dynamic Glass Frame for Company Logo */}
                <GlassFrame 
                  logoUrl={opportunity.companyLogo} 
                  color={getCompanyColor()}
                  companyName={opportunity.company}
                />

                {/* Title Section */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-bidaaya-light leading-tight mb-2">
                    {opportunity.title}
                  </h1>
                  <p className="text-bidaaya-light/60 font-medium">
                    {opportunity.company} • {opportunity.location}
                  </p>
                  {opportunity.matchScore && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-bidaaya-accent/20 border border-bidaaya-accent/30 rounded-full">
                      <span className="text-sm font-semibold text-bidaaya-accent">{opportunity.matchScore}% Match</span>
                    </div>
                  )}
                </div>

                {/* Check if locked (Early Access) */}
                {opportunity.isLocked && opportunity.type === 'early_access' && !isUnlocked ? (
                  <div className="flex flex-col items-center justify-center text-center py-8 mb-6">
                    <div className="w-16 h-16 rounded-full bg-bidaaya-accent/10 flex items-center justify-center mb-4">
                      <Lock className="h-8 w-8 text-bidaaya-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-bidaaya-light mb-2">
                      Early Access Opportunity
                    </h3>
                    <p className="text-sm text-bidaaya-light/60 mb-4 max-w-sm">
                      Unlock to view full details and apply early
                    </p>
                    {userPlan === 'STUDENT_PRO' && onUnlock ? (
                      <Button
                        onClick={async () => {
                          if (onUnlock) {
                            await onUnlock(opportunity.id, 'external')
                            setIsUnlocked(true)
                          }
                        }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-6 text-base font-semibold"
                      >
                        <Unlock className="h-5 w-5 mr-2" />
                        Unlock Free (Pro Member)
                      </Button>
                    ) : onUnlock ? (
                      <Button
                        onClick={async () => {
                          if (onUnlock) {
                            await onUnlock(opportunity.id, 'external')
                            setIsUnlocked(true)
                          }
                        }}
                        className="w-full bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white py-6 text-base font-semibold"
                      >
                        <Lock className="h-5 w-5 mr-2" />
                        Unlock Now ({opportunity.unlockCredits || 7} Credits)
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <>
                    {/* Main Action Group */}
                    <div className="flex flex-col rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.2)] bg-bidaaya-dark/60 border border-bidaaya-light/10 mb-6">
                      
                      {/* 1. Custom CV */}
                      <ActionRow 
                        icon={<FileText className="w-5 h-5" />}
                        label="Custom CV"
                        subLabel={isCVUnlocked ? "Downloaded successfully" : "Tailored for this role"}
                        isToggled={isCVUnlocked}
                        isLoading={isGeneratingCV}
                        rightAction={
                          !isCVUnlocked ? (
                            <UnlockButton cost={5} onClick={handleCVClick} label="Generate" />
                          ) : (
                            <div className="flex items-center gap-2 text-green-400 pr-2">
                              <span className="text-xs font-semibold">Ready</span>
                              <CheckCircle2 className="w-5 h-5 fill-green-500/20" />
                            </div>
                          )
                        }
                      />
                      
                      {/* 2. Cover Letter - LOCKED (Coming Soon) */}
                      <ActionRow 
                        icon={<Sparkles className="w-5 h-5" />}
                        label="Create Cover Letter"
                        subLabel="Coming soon"
                        disabled={true}
                        onClick={handleCoverLetterClick}
                        rightAction={
                          <div className="flex items-center gap-1 text-bidaaya-light/40 text-xs font-semibold px-2">
                            <Lock className="w-3 h-3" />
                            Soon
                          </div>
                        }
                      />

                      {/* 3. Mark as Applied */}
                      <ActionRow 
                        icon={<Briefcase className="w-5 h-5" />}
                        label="Mark as applied"
                        subLabel="Manually track this role"
                        variant={ButtonVariant.TOGGLE}
                        isToggled={markedAsApplied}
                        onClick={handleToggleApplied}
                      />

                    </div>
                  </>
                )}

              </div>

              {/* Sticky Bottom Action Button */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A] to-transparent">
                {!(opportunity.isLocked && opportunity.type === 'early_access') && (
                  <button 
                    onClick={handleApply}
                    disabled={isApplying || markedAsApplied}
                    className={cn(
                      "w-full h-14 rounded-full font-bold text-[17px] shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 border border-white/10",
                      markedAsApplied 
                        ? 'bg-green-500 text-white shadow-green-500/20 cursor-default' 
                        : 'bg-bidaaya-accent text-white shadow-bidaaya-accent/30 hover:shadow-bidaaya-accent/50'
                    )}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Opening...
                      </>
                    ) : markedAsApplied ? (
                      <>
                        <Check className="w-5 h-5 stroke-[3]" />
                        Application Tracked
                      </>
                    ) : (
                      'Apply Now'
                    )}
                  </button>
                )}
              </div>

            </div>
          </motion.div>

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
        </>
      )}
    </AnimatePresence>
  )
}
