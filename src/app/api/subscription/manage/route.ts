import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, confirmDowngrade, reason } = await req.json()

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email },
      select: { 
        id: true,
        email: true,
        stripeCustomerId: true, 
        stripeSubscriptionId: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`🔧 Subscription management - Action: ${action}, User: ${session.user?.email}`)
    console.log(`🔧 Current plan: ${user.subscriptionPlan}, Stripe customer: ${user.stripeCustomerId || 'None'}`)

    // Handle different actions
    switch (action) {
      case 'get_status':
        // Get comprehensive subscription status
        return NextResponse.json({
          success: true,
          user: {
            subscriptionPlan: user.subscriptionPlan,
            subscriptionStatus: user.subscriptionStatus,
            hasStripeSubscription: !!user.stripeSubscriptionId,
            hasStripeCustomer: !!user.stripeCustomerId,
            role: user.role
          },
          managementOptions: {
            canUseStripePortal: !!user.stripeCustomerId,
            canDowngradeImmediately: user.subscriptionPlan !== 'FREE',
            canUpgrade: true
          }
        })

      case 'stripe_portal':
        // Redirect to Stripe Customer Portal for full management
        if (!user.stripeCustomerId) {
          return NextResponse.json({ 
            error: 'No Stripe subscription found. You can downgrade to free immediately or contact support.' 
          }, { status: 404 })
        }

        try {
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXTAUTH_URL}/subscription?portal_return=true`,
          })
          
          return NextResponse.json({ 
            success: true,
            type: 'stripe_portal',
            url: portalSession.url,
            message: 'Redirecting to Stripe Customer Portal...'
          })
        } catch (error) {
          console.error('❌ Stripe portal error:', error)
          return NextResponse.json({ 
            error: 'Unable to access Stripe portal. You can downgrade to free immediately below.' 
          }, { status: 500 })
        }

      case 'downgrade_to_free':
        // Immediate downgrade to free - no Stripe required
        if (user.subscriptionPlan === 'FREE') {
          return NextResponse.json({ 
            success: true,
            message: 'You are already on the free plan.',
            currentPlan: 'FREE'
          })
        }

        if (!confirmDowngrade) {
          return NextResponse.json({ 
            error: 'Please confirm that you want to downgrade to the free plan.' 
          }, { status: 400 })
        }

        // Cancel Stripe subscription if it exists
        if (user.stripeSubscriptionId) {
          try {
            console.log(`🚮 Cancelling Stripe subscription: ${user.stripeSubscriptionId}`)
            await stripe.subscriptions.cancel(user.stripeSubscriptionId)
            console.log(`✅ Stripe subscription cancelled successfully`)
          } catch (error) {
            console.error('❌ Error cancelling Stripe subscription:', error)
            // Continue with database update even if Stripe fails
          }
        }

        // Update user to free plan
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionPlan: 'FREE',
            subscriptionStatus: 'ACTIVE',
            // Clear Stripe data
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          }
        })

        // Log the downgrade for analytics (optional)
        try {
          console.log(`📊 User downgrade: ${user.email} from ${user.subscriptionPlan} to FREE. Reason: ${reason || 'Not specified'}`)
        } catch (error) {
          // Analytics logging failed, but don't fail the request
        }

        console.log(`✅ Successfully downgraded user ${session.user?.email} to FREE plan`)

        return NextResponse.json({
          success: true,
          message: 'Successfully downgraded to free plan. You still have access to core features!',
          newPlan: 'FREE',
          newStatus: 'ACTIVE',
          effectiveImmediately: true
        })

      case 'pause_subscription':
        // Pause instead of cancel (if user has Stripe subscription)
        if (!user.stripeSubscriptionId) {
          return NextResponse.json({ 
            error: 'No active subscription to pause.' 
          }, { status: 404 })
        }

        try {
          // Pause subscription until specific date
          const pauseUntil = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now

          await stripe.subscriptions.update(user.stripeSubscriptionId, {
            pause_collection: {
              behavior: 'void',
              resumes_at: pauseUntil
            }
          })

          return NextResponse.json({
            success: true,
            message: 'Subscription paused for 30 days. You can resume anytime via Stripe portal.',
            pausedUntil: new Date(pauseUntil * 1000).toLocaleDateString()
          })
        } catch (error) {
          console.error('❌ Error pausing subscription:', error)
          return NextResponse.json({ 
            error: 'Unable to pause subscription. Please try the Stripe portal or contact support.' 
          }, { status: 500 })
        }

      case 'request_refund':
        // Help user request refund
        return NextResponse.json({
          success: true,
          type: 'refund_request',
          message: 'Refund requests are handled through our support team.',
          supportEmail: 'support@bidaaya.co',
          instructions: [
            'Email us at support@bidaaya.co',
            'Include your account email and reason for refund',
            'We typically respond within 24 hours',
            'Refunds are processed within 5-7 business days'
          ]
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Subscription management error:', error)
    return NextResponse.json(
      { error: 'Failed to manage subscription. Please try again or contact support.' },
      { status: 500 }
    )
  }
} 
