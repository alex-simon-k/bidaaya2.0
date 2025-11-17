'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ExternalLink, 
  MapPin, 
  Building2, 
  Calendar, 
  DollarSign,
  Crown,
  CheckCircle,
  Clock,
  Sparkles,
  Coins
} from 'lucide-react'

interface ExternalOpportunity {
  id: string
  title: string
  company: string
  companyLogoUrl?: string
  description?: string
  location?: string
  applicationUrl: string
  category?: string
  experienceLevel?: string
  remote: boolean
  salary?: string
  deadline?: string
  isPremium: boolean
  addedAt: string
  hasApplied: boolean
  applicationCount: number
  isNewOpportunity: boolean
  earlyAccessUntil?: string
  isUnlocked?: boolean
  unlockCredits: number
}

interface ExternalOpportunitiesListProps {
  searchTerm?: string
  categoryFilter?: string
  remoteFilter?: boolean
}

export function ExternalOpportunitiesList({ 
  searchTerm = '', 
  categoryFilter = 'all',
  remoteFilter 
}: ExternalOpportunitiesListProps) {
  const [opportunities, setOpportunities] = useState<ExternalOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<ExternalOpportunity | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [applyNotes, setApplyNotes] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState(0)

  useEffect(() => {
    fetchOpportunities()
    fetchUserCredits()
  }, [categoryFilter, remoteFilter])

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/student/credits')
      if (response.ok) {
        const data = await response.json()
        setUserCredits(data.currentCredits)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  const fetchOpportunities = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }
      if (remoteFilter) {
        params.append('remote', 'true')
      }

      const response = await fetch(`/api/external-opportunities?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setOpportunities(data.opportunities || [])
        setIsPro(data.isPro || false)
      } else {
        setError(data.error || 'Failed to load opportunities')
        setOpportunities([])
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      setError('Failed to connect to server')
      setOpportunities([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVisitWebsite = async (opportunity: ExternalOpportunity) => {
    // Track view only (not application)
    fetch(`/api/external-opportunities/${opportunity.id}/track-view`, {
      method: 'POST'
    }).catch(() => {})
    
    // Open external link in new tab
    window.open(opportunity.applicationUrl, '_blank')
  }

  const handleMarkAsApplied = async (opportunity: ExternalOpportunity) => {
    setSelectedOpportunity(opportunity)
    setShowModal(true)
  }

  const confirmMarkAsApplied = async () => {
    if (!selectedOpportunity) return

    setIsApplying(true)
    try {
      const response = await fetch(`/api/external-opportunities/${selectedOpportunity.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: applyNotes })
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh opportunities to update hasApplied status
        fetchOpportunities()
        
        setShowModal(false)
        setApplyNotes('')
        alert('✅ Marked as applied! You can track this in your applications.')
      } else {
        alert(data.error || 'Failed to mark as applied')
      }
    } catch (error) {
      alert('Failed to process request')
    } finally {
      setIsApplying(false)
    }
  }

  const handleUnlockEarlyAccess = async (opportunity: ExternalOpportunity) => {
    if (unlockingId) return // Prevent double clicks
    
    if (userCredits < opportunity.unlockCredits && !isPro) {
      alert(`You need ${opportunity.unlockCredits} credits to unlock early access. You currently have ${userCredits} credits. Upgrade your plan to get more credits!`)
      return
    }

    setUnlockingId(opportunity.id)
    
    try {
      const response = await fetch('/api/student/early-access/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          opportunityType: 'external'
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh opportunities and credits
        await fetchOpportunities()
        await fetchUserCredits()
        alert(data.message || 'Opportunity unlocked!')
      } else {
        alert(data.error || 'Failed to unlock opportunity')
      }
    } catch (error) {
      alert('Failed to unlock opportunity. Please try again.')
    } finally {
      setUnlockingId(null)
    }
  }

  const filteredOpportunities = opportunities.filter(opp => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      opp.title.toLowerCase().includes(search) ||
      opp.company.toLowerCase().includes(search) ||
      (opp.description || '').toLowerCase().includes(search) ||
      (opp.location || '').toLowerCase().includes(search)
    )
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading external opportunities...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  if (filteredOpportunities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-600">No external opportunities found</p>
        <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <>
      {!isPro && opportunities.some(o => o.isPremium) && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Unlock Early Access</h3>
              <p className="text-sm text-gray-700">
                Upgrade to Student Pro to see premium opportunities 2 days before other users!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredOpportunities.map((opp, index) => {
          const isEarlyAccess = opp.isNewOpportunity && !opp.isUnlocked && !isPro
          const isLocked = isEarlyAccess
          
          return (
          <motion.div
            key={opp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all relative ${
              opp.isPremium || isEarlyAccess ? 'border-2 border-purple-200' : 'border border-gray-200'
            } ${isLocked ? 'overflow-hidden' : ''}`}
          >
            <div className="flex items-start gap-4 mb-3">
              {/* Company Logo */}
              {opp.companyLogoUrl ? (
                <div className="flex-shrink-0">
                  <img 
                    src={opp.companyLogoUrl} 
                    alt={`${opp.company} logo`}
                    className="w-12 h-12 rounded-lg object-contain bg-white border border-gray-200"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="hidden w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              ) : (
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {opp.title}
                  </h3>
                  {opp.isPremium && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  )}
                  {opp.hasApplied && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      <CheckCircle className="w-3 h-3" />
                      Applied
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">{opp.company}</span>
                </div>
              </div>
            </div>

            {opp.description && (
              <p className="text-gray-700 mb-4 line-clamp-2">{opp.description}</p>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
              {opp.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {opp.location}
                </span>
              )}
              {opp.remote && (
                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                  Remote
                </span>
              )}
              {opp.category && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {opp.category.replace('_', ' ')}
                </span>
              )}
              {opp.salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {opp.salary}
                </span>
              )}
              {opp.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(opp.deadline).toLocaleDateString()}
                </span>
              )}
              {opp.experienceLevel && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {opp.experienceLevel}
                </span>
              )}
            </div>

            {/* Blur Overlay for Early Access */}
            {isLocked && (
              <div className="absolute inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-10">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 border-2 border-purple-300"
                >
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Early Access Opportunity
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      This opportunity is available early! Unlock it now or wait for public release.
                    </p>
                    
                    <div className="bg-purple-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-center gap-2 text-purple-700">
                        <Coins className="w-5 h-5" />
                        <span className="font-semibold text-lg">{opp.unlockCredits} Credits</span>
                      </div>
                      {!isPro && (
                        <p className="text-xs text-purple-600 mt-1">
                          You have {userCredits} credits
                        </p>
                      )}
                    </div>

                    {isPro ? (
                      <button
                        onClick={() => handleUnlockEarlyAccess(opp)}
                        disabled={unlockingId === opp.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                      >
                        {unlockingId === opp.id ? (
                          'Unlocking...'
                        ) : (
                          <>
                            <Crown className="w-5 h-5" />
                            Unlock Free (Pro Member)
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnlockEarlyAccess(opp)}
                        disabled={unlockingId === opp.id || userCredits < opp.unlockCredits}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {unlockingId === opp.id ? (
                          'Unlocking...'
                        ) : userCredits < opp.unlockCredits ? (
                          <>Not Enough Credits</>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Unlock Now
                          </>
                        )}
                      </button>
                    )}

                    {opp.earlyAccessUntil && (
                      <p className="text-xs text-gray-500 mt-3">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Public release: {new Date(opp.earlyAccessUntil).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3">
              <button
                onClick={() => handleVisitWebsite(opp)}
                disabled={isLocked}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Visit Website
                <ExternalLink className="w-4 h-4" />
              </button>
              
              {!opp.hasApplied ? (
                <button
                  onClick={() => handleMarkAsApplied(opp)}
                  disabled={isLocked}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Applied
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium cursor-default">
                  <CheckCircle className="w-4 h-4" />
                  Applied ✓
                </div>
              )}
            </div>
          </motion.div>
          )
        })}
      </div>

      {/* Application Confirmation Modal */}
      <AnimatePresence>
        {showModal && selectedOpportunity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Mark as Applied
                </h2>
                <p className="text-gray-600 mb-4">
                  <strong>{selectedOpportunity.company}</strong> - {selectedOpportunity.title}
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-900">
                    <strong>Track your application:</strong> Use this to keep a personal record that you've applied 
                    to this opportunity. This helps you stay organized and track your application journey.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Optional Notes (for your reference)
                  </label>
                  <textarea
                    value={applyNotes}
                    onChange={(e) => setApplyNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="E.g., 'Applied via their careers page on Jan 15th' or 'Sent resume to recruiter@company.com'"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setApplyNotes('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmMarkAsApplied}
                    disabled={isApplying}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isApplying ? (
                      'Saving...'
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Mark as Applied
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

