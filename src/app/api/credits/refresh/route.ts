import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

// Monthly credit refresh job - can be called by cron or manually by admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userIds } = await request.json() // optional: refresh specific users

    // Get pricing config
    const pricing = await prisma.creditPricing.findFirst()
    if (!pricing) {
      return NextResponse.json({ error: 'No pricing config found' }, { status: 400 })
    }

    // Find users who need credit refresh (monthly)
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    const usersToRefresh = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...(userIds ? { id: { in: userIds } } : {}),
        OR: [
          { creditsRefreshDate: null },
          { creditsRefreshDate: { lt: oneMonthAgo } }
        ]
      },
      select: {
        id: true,
        subscriptionPlan: true,
        credits: true,
        creditsRefreshDate: true,
      }
    })

    let refreshedCount = 0
    const results = []

    for (const user of usersToRefresh) {
      try {
        // Determine credits based on subscription plan
        let newCredits = pricing.freeMonthlyCredits
        if (user.subscriptionPlan === 'STUDENT_PREMIUM') {
          newCredits = pricing.premiumMonthlyCredits
        } else if (user.subscriptionPlan === 'STUDENT_PRO') {
          newCredits = pricing.proMonthlyCredits
        }

        const balanceBefore = user.credits
        const nextRefreshDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

        await prisma.$transaction(async (tx) => {
          // Update user credits and refresh date
          await tx.user.update({
            where: { id: user.id },
            data: {
              credits: newCredits,
              creditsRefreshDate: nextRefreshDate,
            }
          })

          // Log the transaction
          await tx.creditTransaction.create({
            data: {
              userId: user.id,
              type: 'monthly_refresh',
              amount: newCredits - balanceBefore,
              balanceBefore,
              balanceAfter: newCredits,
              description: `Monthly credit refresh for ${user.subscriptionPlan} plan`,
            }
          })
        })

        refreshedCount++
        results.push({
          userId: user.id,
          plan: user.subscriptionPlan,
          oldCredits: balanceBefore,
          newCredits,
          nextRefresh: nextRefreshDate,
        })
      } catch (error) {
        console.error(`Failed to refresh credits for user ${user.id}:`, error)
        results.push({
          userId: user.id,
          error: 'Failed to refresh',
        })
      }
    }

    return NextResponse.json({
      success: true,
      refreshedCount,
      totalFound: usersToRefresh.length,
      results,
    })
  } catch (error) {
    console.error('POST /api/credits/refresh error:', error)
    return NextResponse.json({ error: 'Failed to refresh credits' }, { status: 500 })
  }
}
