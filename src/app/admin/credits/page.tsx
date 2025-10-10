'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface CreditPricing {
  id: string
  internalApplication: number
  companyProposal: number
  customCV: number
  freeMonthlyCredits: number
  premiumMonthlyCredits: number
  proMonthlyCredits: number
  updatedAt: string
  updatedBy?: string
}

export default function AdminCreditsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [pricing, setPricing] = useState<CreditPricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    internalApplication: 5,
    companyProposal: 7,
    customCV: 10,
    freeMonthlyCredits: 20,
    premiumMonthlyCredits: 100,
    proMonthlyCredits: 200,
  })

  useEffect(() => {
    if (session?.user && (session.user as any).role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    loadPricing()
  }, [session, router])

  const loadPricing = async () => {
    try {
      const res = await fetch('/api/credits/pricing')
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setPricing(data)
          setFormData({
            internalApplication: data.internalApplication || 5,
            companyProposal: data.companyProposal || 7,
            customCV: data.customCV || 10,
            freeMonthlyCredits: data.freeMonthlyCredits || 20,
            premiumMonthlyCredits: data.premiumMonthlyCredits || 100,
            proMonthlyCredits: data.proMonthlyCredits || 200,
          })
        }
      }
    } catch (error) {
      console.error('Failed to load pricing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/credits/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const updated = await res.json()
        setPricing(updated)
        alert('✅ Credit pricing updated successfully!')
      } else {
        alert('❌ Failed to update pricing')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('❌ Error saving pricing')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseInt(value) || 0
    setFormData(prev => ({ ...prev, [field]: numValue }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Credit System Management</h1>
          <p className="text-gray-600 mt-2">Configure action costs and monthly credit allocations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Action Costs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Action Costs (Credits)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Application
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.internalApplication}
                  onChange={(e) => handleInputChange('internalApplication', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Cost to apply to internal Bidaaya projects</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Proposal
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.companyProposal}
                  onChange={(e) => handleInputChange('companyProposal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Cost to send proposals directly to companies</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom CV Generation
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.customCV}
                  onChange={(e) => handleInputChange('customCV', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Cost to generate AI-powered custom CVs</p>
              </div>
            </div>
          </div>

          {/* Monthly Allocations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Credit Allocations</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Tier
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.freeMonthlyCredits}
                  onChange={(e) => handleInputChange('freeMonthlyCredits', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Credits given to free users each month</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Premium Tier
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.premiumMonthlyCredits}
                  onChange={(e) => handleInputChange('premiumMonthlyCredits', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Credits given to premium users each month</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pro Tier
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.proMonthlyCredits}
                  onChange={(e) => handleInputChange('proMonthlyCredits', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Credits given to pro users each month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Current Status */}
        {pricing && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Configuration</h3>
            <p className="text-xs text-gray-600">
              Last updated: {new Date(pricing.updatedAt).toLocaleDateString()} at {new Date(pricing.updatedAt).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
