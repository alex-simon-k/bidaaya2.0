'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Coins, Sparkles } from 'lucide-react'
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

  const handleUpgrade = (planId: string) => {
    const params = new URLSearchParams({
      plan: planId,
      interval: 'month'
    })
    window.location.href = `/subscription?${params.toString()}`
  }

  const plans = [
    {
      id: PRICING_PLANS.STUDENT_PREMIUM.id,
      name: "Fries in the Bag",
      price: PRICING_PLANS.STUDENT_PREMIUM.price,
      credits: 100,
      image: '/pricing/cooked-guy.png',
      gradient: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
      buttonGradient: 'from-orange-500 to-red-500',
    },
    {
      id: PRICING_PLANS.STUDENT_PRO.id,
      name: 'Unemployed Bro',
      price: PRICING_PLANS.STUDENT_PRO.price,
      credits: 200,
      image: '/pricing/unemployed-guy.png',
      gradient: 'from-bidaaya-accent/20 to-purple-500/20',
      borderColor: 'border-bidaaya-accent/30',
      buttonGradient: 'from-bidaaya-accent to-purple-500',
      badge: 'Early Access',
      highlight: true
    }
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-bidaaya-dark border border-bidaaya-light/10 rounded-2xl shadow-2xl max-w-lg w-full"
        >
          {/* Header */}
          <div className="relative p-6 pb-4 border-b border-bidaaya-light/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-bidaaya-light/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-bidaaya-light/60" />
            </button>
            <h2 className="text-xl font-bold text-bidaaya-light">
              Get More Credits
            </h2>
            <p className="text-sm text-bidaaya-light/60 mt-1">
              Upgrade to apply to more opportunities
            </p>
          </div>

          {/* Plans */}
          <div className="p-6 space-y-4">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.02 }}
                className={`relative bg-gradient-to-br ${plan.gradient} border ${plan.borderColor} rounded-xl p-5 cursor-pointer`}
                onClick={() => handleUpgrade(plan.id)}
              >
                {plan.badge && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-gradient-to-r from-bidaaya-accent to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                      <Sparkles className="h-3 w-3" />
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={plan.image} 
                      alt={plan.name}
                      className="w-16 h-16 object-contain"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-bidaaya-light">{plan.name}</h3>
                      <div className="flex items-center gap-1.5 text-bidaaya-light/80">
                        <Coins className="h-3.5 w-3.5" />
                        <span className="text-sm font-semibold">{plan.credits} credits/mo</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-bidaaya-light">${plan.price}</div>
                    <div className="text-xs text-bidaaya-light/60">/month</div>
                  </div>
                </div>

                {plan.highlight && (
                  <div className="text-xs text-bidaaya-accent font-medium mb-3">
                    ✨ Early access to all new projects
                  </div>
                )}

                <button
                  className={`w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r ${plan.buttonGradient} hover:opacity-90 transition-opacity shadow-lg`}
                >
                  Upgrade Now
                </button>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 pt-0 text-center">
            <button
              onClick={onClose}
              className="text-sm text-bidaaya-light/40 hover:text-bidaaya-light/60 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
