import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { checkApplicationLimits } from '@/lib/application-limits'
import { getSubscriptionTier } from '@/lib/subscription'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        applicationsThisMonth: true,
        lastMonthlyReset: true,
        stripeSubscriptionId: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Test application limits
    const applicationLimits = checkApplicationLimits(user as any)
    
    // Test subscription tier
    const subscriptionTier = getSubscriptionTier(user.subscriptionPlan, user.role as any)

    // Verify consistency
    const consistency = {
      applicationLimitsVsTier: applicationLimits.maxApplications === subscriptionTier?.applicationsPerMonth,
      subscriptionStatusCorrect: user.subscriptionStatus === 'ACTIVE' as any,
      subscriptionPlanValid: ['FREE', 'STUDENT_PREMIUM', 'STUDENT_PRO', 'COMPANY_BASIC', 'COMPANY_PRO', 'COMPANY_PREMIUM'].includes(user.subscriptionPlan),
    }

    console.log(`🧪 SUBSCRIPTION TEST for user ${user.id}:`, {
      user: {
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        hasStripeSubscription: !!user.stripeSubscriptionId
      },
      applicationLimits: {
        maxApplications: applicationLimits.maxApplications,
        applicationsUsed: applicationLimits.applicationsUsed,
        applicationsRemaining: applicationLimits.applicationsRemaining,
        canApply: applicationLimits.canApply
      },
      subscriptionTier: subscriptionTier ? {
        name: subscriptionTier.name,
        price: subscriptionTier.price,
        applicationsPerMonth: subscriptionTier.applicationsPerMonth
      } : null,
      consistency
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        hasStripeSubscription: !!user.stripeSubscriptionId
      },
      applicationLimits: {
        maxApplications: applicationLimits.maxApplications,
        applicationsUsed: applicationLimits.applicationsUsed,
        applicationsRemaining: applicationLimits.applicationsRemaining,
        canApply: applicationLimits.canApply,
        requiresUpgrade: applicationLimits.requiresUpgrade
      },
      subscriptionTier: subscriptionTier ? {
        name: subscriptionTier.name,
        price: subscriptionTier.price,
        applicationsPerMonth: subscriptionTier.applicationsPerMonth
      } : null,
      consistency,
      tests: {
        defaultUserSetupCorrect: user.subscriptionPlan === 'FREE' && user.subscriptionStatus === 'ACTIVE',
        applicationLimitsConsistent: consistency.applicationLimitsVsTier,
        subscriptionFieldsValid: consistency.subscriptionStatusCorrect && consistency.subscriptionPlanValid
      }
    })

  } catch (error) {
    console.error('❌ Subscription test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
} 