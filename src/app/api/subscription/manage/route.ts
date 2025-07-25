import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

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

    const { action, planId } = await req.json()

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email },
      select: { 
        id: true,
        stripeCustomerId: true, 
        subscriptionPlan: true,
        subscriptionStatus: true 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`🔧 Subscription management - Action: ${action}, User: ${session.user?.email}`)
    console.log(`🔧 Current plan: ${user.subscriptionPlan}, Stripe customer: ${user.stripeCustomerId || 'None'}`)

    // Handle different actions
    switch (action) {
      case 'portal':
        // If user has Stripe customer ID, use Stripe portal
        if (user.stripeCustomerId) {
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXTAUTH_URL}/subscription`,
          })
          
          return NextResponse.json({ 
            type: 'stripe_portal',
            url: portalSession.url 
          })
        } else {
          // User doesn't have Stripe customer - return custom management options
          return NextResponse.json({ 
            type: 'custom_management',
            currentPlan: user.subscriptionPlan,
            availableActions: ['downgrade_to_free', 'upgrade_via_stripe']
          })
        }

      case 'downgrade_to_free':
        // Allow any user to downgrade to free (no Stripe required)
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionPlan: 'FREE',
            subscriptionStatus: 'ACTIVE',
            // Clear Stripe data if downgrading
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          }
        })

        console.log(`✅ Downgraded user ${session.user?.email} to FREE plan`)

        return NextResponse.json({
          success: true,
          message: 'Successfully downgraded to free plan',
          newPlan: 'FREE'
        })

      case 'get_current_plan':
        return NextResponse.json({
          currentPlan: user.subscriptionPlan,
          subscriptionStatus: user.subscriptionStatus,
          hasStripeCustomer: !!user.stripeCustomerId
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Subscription management error:', error)
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 