import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await req.json()
    
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Map plan IDs to our enum values
    const planMapping: Record<string, string> = {
      'student-free': 'FREE',
      'student-premium': 'STUDENT_BASIC',
      'student-pro': 'STUDENT_PREMIUM',
    }

    const subscriptionPlan = planMapping[planId]
    if (!subscriptionPlan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    // Update user's subscription status
    const updatedUser = await prisma.user.update({
      where: { email: token.email },
      data: {
        subscriptionStatus: 'FREE',
        subscriptionPlan: subscriptionPlan as any,
        // Clear Stripe fields for free plan
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    })

    console.log(`User ${token.email} upgraded to ${planId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully upgraded to free plan',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionStatus: updatedUser.subscriptionStatus,
      }
    })
  } catch (error) {
    console.error('Error upgrading to free plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 