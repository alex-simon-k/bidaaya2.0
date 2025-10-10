'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Zap, Check } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/pricing'

interface MembershipSelectionPopupProps {
  isOpen: boolean
  onClose: () => void
  userRole: 'STUDENT' | 'COMPANY'
  userName: string
}

export function MembershipSelectionPopup({ 
  isOpen, 
  onClose, 
  userRole, 
  userName 
}: MembershipSelectionPopupProps) {
  const { data: session } = useSession()

  if (!isOpen) return null

  // For students, only show the PAID upgrade options (Premium & Pro)
  const studentPlans = [
    PRICING_PLANS.STUDENT_PREMIUM,
    PRICING_PLANS.STUDENT_PRO
  ]

  const handleUpgrade = (planId: string) => {
    // Redirect to subscription page with plan info
    const params = new URLSearchParams({
      plan: planId,
      interval: 'month'
    })
    window.location.href = `/subscription?${params.toString()}`
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Unlock Your Career Potential
                </h2>
                <p className="text-blue-100 mt-1">
                  Hi {userName}! Get more credits and access premium features
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Plans - Only show paid upgrades */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studentPlans.map((plan) => {
                const planAny = plan as any
                return (
                <div
                  key={plan.id}
                  className={`relative border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                    planAny.popular
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {planAny.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {planAny.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {planAny.badge}
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-gray-900">
                      ${plan.price}
                      <span className="text-lg text-gray-600">/month</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 font-medium">
                      {planAny.credits} credits per month
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.slice(0, 6).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      planAny.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Upgrade Now
                  </button>
                </div>
              )})}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Start applying to more opportunities and unlock premium features!
              </p>
              <button
                onClick={onClose}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
