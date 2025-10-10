'use client'

import { useEffect, useState } from 'react'

interface Pricing {
  internalApplication: number
  companyProposal: number
  customCV: number
  freeMonthlyCredits: number
  premiumMonthlyCredits: number
  proMonthlyCredits: number
}

export default function CreditBalanceWidget() {
  const [balance, setBalance] = useState<number>(0)
  const [nextRefresh, setNextRefresh] = useState<string | null>(null)
  const [pricing, setPricing] = useState<Pricing | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/credits/balance', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch balance')
        const data = await res.json()
        setBalance(data.balance || 0)
        setNextRefresh(data.nextRefresh || null)
        setPricing(data.pricing || null)
      } catch (e) {
        // noop
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const daysUntilRefresh = (() => {
    if (!nextRefresh) return null
    const d = Math.max(0, Math.ceil((new Date(nextRefresh).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    return d
  })()

  return (
    <div className="w-full bg-bidaaya-dark/50 backdrop-blur border border-bidaaya-light/20 rounded-xl p-4 md:p-5 shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-bidaaya-light/60">Available credits</p>
          <p className="text-3xl font-bold text-bidaaya-light">{loading ? '—' : balance}</p>
          {daysUntilRefresh !== null && (
            <p className="text-xs text-bidaaya-light/50 mt-1">Refreshes in {daysUntilRefresh} day{daysUntilRefresh === 1 ? '' : 's'}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-bidaaya-light/60 mb-1">Actions cost</p>
          <div className="text-sm text-bidaaya-light/80">
            <div>Apply (internal): <span className="font-semibold text-bidaaya-accent">{pricing?.internalApplication ?? '—'}</span></div>
            <div>Proposal (company): <span className="font-semibold text-bidaaya-accent">{pricing?.companyProposal ?? '—'}</span></div>
            <div>Custom CV: <span className="font-semibold text-bidaaya-accent">{pricing?.customCV ?? '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}


