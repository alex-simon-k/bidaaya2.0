"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Zap, Settings, ExternalLink } from 'lucide-react'

export function SubscriptionStatus() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  // For now, we'll use mock data since the database fields might not be available yet
  const subscriptionPlan = (session?.user as any)?.subscriptionPlan || 'FREE'
  const subscriptionStatus = (session?.user as any)?.subscriptionStatus || 'FREE'

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      // Try new subscription management endpoint
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal' })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.type === 'stripe_portal' && data.url) {
          // User has Stripe customer - open Stripe portal
          window.open(data.url, '_blank')
        } else if (data.type === 'custom_management') {
          // User doesn't have Stripe customer - show custom options
          console.log('🔧 Custom management needed for plan:', data.currentPlan)
          alert(`Current Plan: ${data.currentPlan}\n\nAvailable actions:\n- Downgrade to Free\n- Upgrade via Stripe\n\nImplementing custom management UI...`)
        }
      } else {
        console.error('Failed to access subscription management')
        // Fallback: try old portal method
        const fallbackResponse = await fetch('/api/subscription/portal', {
          method: 'POST',
        })
        
        if (fallbackResponse.ok) {
          const { url } = await fallbackResponse.json()
          window.open(url, '_blank')
        } else {
          alert('Subscription management temporarily unavailable. Please contact support.')
        }
      }
    } catch (error) {
      console.error('Error accessing subscription management:', error)
      alert('Unable to access subscription management. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'STUDENT_PREMIUM':
        return {
          name: 'Premium',
          color: 'bg-emerald-100 text-emerald-800',
          icon: <Zap className="w-4 h-4" />,
          price: '$5/month'
        }
      case 'STUDENT_PRO':
        return {
          name: 'Pro',
          color: 'bg-purple-100 text-purple-800',
          icon: <Crown className="w-4 h-4" />,
          price: '$15/month'
        }
      case 'COMPANY_BASIC':
        return {
          name: 'Company Basic',
          color: 'bg-blue-100 text-blue-800',
          icon: <Zap className="w-4 h-4" />,
          price: '$49/month'
        }
      case 'COMPANY_PREMIUM':
        return {
          name: 'Company Premium',
          color: 'bg-purple-100 text-purple-800',
          icon: <Crown className="w-4 h-4" />,
          price: '$149/month'
        }
      case 'COMPANY_PRO':
        return {
          name: 'Company Pro',
          color: 'bg-gold-100 text-gold-800',
          icon: <Crown className="w-4 h-4" />,
          price: '$299/month'
        }
      default:
        return {
          name: 'Free Trial',
          color: 'bg-gray-100 text-gray-800',
          icon: <Zap className="w-4 h-4" />,
          price: 'Free'
        }
    }
  }

  const planInfo = getPlanInfo(subscriptionPlan)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
        {subscriptionPlan !== 'FREE' && (
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Manage
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          {planInfo.icon}
          <span className="font-medium text-gray-900">{planInfo.name} Plan</span>
        </div>
        <Badge className={planInfo.color}>
          {subscriptionStatus === 'ACTIVE' ? 'Active' : subscriptionStatus}
        </Badge>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <div className="flex justify-between">
          <span>Price:</span>
          <span className="font-medium">{planInfo.price}</span>
        </div>
        {subscriptionPlan !== 'FREE' && (
          <div className="flex justify-between mt-1">
            <span>Status:</span>
            <span className="font-medium capitalize">
              {subscriptionStatus.toLowerCase().replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {subscriptionPlan === 'FREE' && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-emerald-900">Upgrade to Premium</span>
          </div>
          <p className="text-sm text-emerald-700 mb-3">
            Get unlimited access to projects, enhanced profile features, and priority support.
          </p>
          <Button 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            View Plans
          </Button>
        </div>
      )}

      {subscriptionPlan !== 'FREE' && (
        <div className="text-xs text-gray-500">
          You can manage your subscription, update payment methods, or cancel anytime through the customer portal.
        </div>
      )}
    </div>
  )
} 