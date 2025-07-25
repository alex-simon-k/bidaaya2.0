import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, action } = body

    console.log(`🧪 TEST ENDPOINT: ${action || 'upgrade'} for user ${session.user.id} to plan ${planId}`)

    if (action === 'fix_all_users') {
      // Fix all users with inconsistent subscription data
      const usersToFix = await prisma.user.updateMany({
        where: {
          subscriptionStatus: 'FREE' as any
        },
        data: {
          subscriptionStatus: 'ACTIVE' as any
        }
      })
      
      console.log(`✅ Fixed ${usersToFix.count} users with FREE status to ACTIVE status`)
      
      return NextResponse.json({
        success: true,
        message: `Fixed ${usersToFix.count} users`,
        action: 'fix_all_users'
      })
    }

    if (action === 'upgrade' && planId) {
      // Test direct upgrade
      const planIdMapping = {
        'student_premium_monthly': 'STUDENT_PREMIUM',
        'student_pro_monthly': 'STUDENT_PRO', 
        'company_basic_monthly': 'COMPANY_BASIC',
        'company_premium_monthly': 'COMPANY_PREMIUM',
        'company_pro_monthly': 'COMPANY_PRO',
      }

      const subscriptionPlan = planIdMapping[planId as keyof typeof planIdMapping]
      
      if (!subscriptionPlan) {
        return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
      }

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          subscriptionPlan: subscriptionPlan as any,
          subscriptionStatus: 'ACTIVE'
        }
      })

      console.log(`✅ TEST: Updated user ${session.user.id} to plan ${subscriptionPlan}`)

      return NextResponse.json({
        success: true,
        message: `Upgraded to ${subscriptionPlan}`,
        subscriptionPlan,
        subscriptionStatus: 'ACTIVE',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          subscriptionPlan: updatedUser.subscriptionPlan,
          subscriptionStatus: updatedUser.subscriptionStatus
        }
      })
    }

    // Default: return current user subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true
      }
    })

    return NextResponse.json({
      success: true,
      user,
      message: 'Current subscription data'
    })

  } catch (error) {
    console.error('❌ TEST ERROR:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true
      }
    })

    // Get all users' subscription stats
    const stats = await prisma.user.groupBy({
      by: ['subscriptionPlan', 'subscriptionStatus'],
      _count: true
    })

    return NextResponse.json({
      success: true,
      currentUser: user,
      allUsersStats: stats,
      message: 'Subscription data retrieved'
    })

  } catch (error) {
    console.error('❌ TEST ERROR:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 