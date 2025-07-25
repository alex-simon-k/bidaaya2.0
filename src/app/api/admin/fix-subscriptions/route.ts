import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admin users to run this
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you might want to add proper admin check)
    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: { role: true, email: true }
    })

    if (!user || !user.email?.includes('admin')) { // Simple admin check - replace with proper logic
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🔧 ADMIN: Starting subscription migration...')

    // Fix all users with subscriptionStatus = 'FREE' to 'ACTIVE'
    const usersWithFreeStatus = await prisma.user.updateMany({
      where: {
        subscriptionStatus: 'FREE' as any
      },
      data: {
        subscriptionStatus: 'ACTIVE' as any
      }
    })

    console.log(`✅ Updated ${usersWithFreeStatus.count} users from FREE status to ACTIVE status`)

    // Fix all students who don't have subscriptionPlan set to FREE
    const studentsToFix = await prisma.user.updateMany({
      where: {
        role: 'STUDENT',
        NOT: {
          subscriptionPlan: {
            in: ['FREE', 'STUDENT_PREMIUM', 'STUDENT_PRO']
          }
        }
      },
      data: {
        subscriptionPlan: 'FREE' as any
      }
    })

    console.log(`✅ Fixed ${studentsToFix.count} students to FREE plan`)

    // Fix all companies who are on COMPANY_BASIC but should be on FREE (if they haven't paid)
    const companiesToFix = await prisma.user.updateMany({
      where: {
        role: 'COMPANY',
        subscriptionPlan: 'COMPANY_BASIC' as any,
        stripeSubscriptionId: null // No active Stripe subscription
      },
      data: {
        subscriptionPlan: 'FREE' as any
      }
    })

    console.log(`✅ Fixed ${companiesToFix.count} companies to FREE plan (no active subscription)`)

    // Get final stats
    const finalStats = await prisma.user.groupBy({
      by: ['role', 'subscriptionPlan', 'subscriptionStatus'],
      _count: true
    })

    console.log('📊 Final subscription stats:', finalStats)

    return NextResponse.json({
      success: true,
      message: 'Subscription migration completed',
      stats: {
        usersStatusFixed: usersWithFreeStatus.count,
        studentsFixed: studentsToFix.count,
        companiesFixed: companiesToFix.count,
        finalStats
      }
    })

  } catch (error) {
    console.error('❌ Subscription migration error:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
} 