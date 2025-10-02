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
  Sparkles
} from 'lucide-react'

interface ExternalOpportunity {
  id: string
  title: string
  company: string
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

  useEffect(() => {
    fetchOpportunities()
  }, [categoryFilter, remoteFilter])

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

  const handleApply = async (opportunity: ExternalOpportunity) => {
    setSelectedOpportunity(opportunity)
    setShowModal(true)
  }

  const confirmApply = async () => {
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
        // Track view
        fetch(`/api/external-opportunities/${selectedOpportunity.id}/track-view`, {
          method: 'POST'
        }).catch(() => {})

        // Open external link in new tab
        window.open(selectedOpportunity.applicationUrl, '_blank')
        
        // Refresh opportunities to update hasApplied status
        fetchOpportunities()
        
        setShowModal(false)
        setApplyNotes('')
        alert('✅ Application tracked! Opening company website...')
      } else {
        alert(data.error || 'Failed to track application')
      }
    } catch (error) {
      alert('Failed to process application')
    } finally {
      setIsApplying(false)
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
        {filteredOpportunities.map((opp, index) => (
          <motion.div
            key={opp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all ${
              opp.isPremium ? 'border-2 border-purple-200' : 'border border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
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
                  <Building2 className="w-4 h-4" />
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

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {opp.applicationCount > 0 && (
                  <span>{opp.applicationCount} student{opp.applicationCount !== 1 ? 's' : ''} applied</span>
                )}
              </div>
              <button
                onClick={() => handleApply(opp)}
                disabled={opp.hasApplied}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  opp.hasApplied
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {opp.hasApplied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Already Applied
                  </>
                ) : (
                  <>
                    Apply Now
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
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
                  Apply to {selectedOpportunity.company}
                </h2>
                <p className="text-gray-600 mb-4">
                  {selectedOpportunity.title}
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> This is an external opportunity. You'll be redirected to the company's 
                    website to complete your application. We'll track that you applied for your records.
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any notes about this application..."
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
                    onClick={confirmApply}
                    disabled={isApplying}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isApplying ? (
                      'Processing...'
                    ) : (
                      <>
                        Continue to Apply
                        <ExternalLink className="w-4 h-4" />
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

