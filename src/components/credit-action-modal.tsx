'use client'

import { useState, useEffect } from 'react'

interface CreditActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  action: 'internalApplication' | 'companyProposal' | 'customCV'
  title: string
  description: string
  relatedId?: string
}

const actionLabels = {
  internalApplication: 'Apply to Internal Project',
  companyProposal: 'Send Company Proposal', 
  customCV: 'Generate Custom CV'
}

const actionDescriptions = {
  internalApplication: 'Submit your application to this Bidaaya project',
  companyProposal: 'Send a direct proposal to this company through Bidaaya',
  customCV: 'Generate an AI-powered custom CV tailored for this opportunity'
}

export default function CreditActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  title,
  description,
  relatedId
}: CreditActionModalProps) {
  const [currentBalance, setCurrentBalance] = useState<number>(0)
  const [cost, setCost] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [confirming, setConfirming] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      loadBalanceAndPricing()
    }
  }, [isOpen, action])

  const loadBalanceAndPricing = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/credits/balance')
      if (res.ok) {
        const data = await res.json()
        setCurrentBalance(data.balance || 0)
        
        const pricing = data.pricing
        if (pricing) {
          setCost(pricing[action] || 0)
        }
      }
    } catch (error) {
      console.error('Failed to load balance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      // First spend the credits
      const spendRes = await fetch('/api/credits/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          relatedId,
          description: `${actionLabels[action]}: ${title}`
        })
      })

      if (!spendRes.ok) {
        const error = await spendRes.json()
        throw new Error(error.error || 'Failed to spend credits')
      }

      // Then execute the actual action
      await onConfirm()
      
      onClose()
    } catch (error) {
      console.error('Credit action error:', error)
      alert(`❌ ${error instanceof Error ? error.message : 'Action failed'}`)
    } finally {
      setConfirming(false)
    }
  }

  const canAfford = currentBalance >= cost
  const newBalance = currentBalance - cost

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Confirm Action
        </h3>
        
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">{actionLabels[action]}</h4>
          <p className="text-gray-600 text-sm mb-2">{title}</p>
          <p className="text-gray-500 text-xs">{description || actionDescriptions[action]}</p>
        </div>

        {loading ? (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <div className="animate-pulse">Loading pricing...</div>
          </div>
        ) : (
          <div className={`rounded-lg p-4 mb-6 ${canAfford ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Cost:</span>
              <span className="text-2xl font-bold text-blue-600">{cost} credits</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Your balance:</span>
              <span className="text-gray-800 font-semibold">{currentBalance} credits</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">After action:</span>
              <span className={`font-semibold ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                {canAfford ? newBalance : 'Insufficient'} credits
              </span>
            </div>
          </div>
        )}

        {!canAfford && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">
              ❌ You don't have enough credits for this action. 
              <br />
              <a href="/pricing" className="text-red-600 underline hover:text-red-700">
                Upgrade your plan
              </a> to get more credits.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={confirming}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canAfford || loading || confirming}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {confirming ? 'Processing...' : `Spend ${cost} Credits`}
          </button>
        </div>
      </div>
    </div>
  )
}
