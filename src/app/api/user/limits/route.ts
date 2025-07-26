import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'
import { SubscriptionManager } from '@/lib/subscription-manager'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: {
        id: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        applicationsThisMonth: true,
        lastMonthlyReset: true,
        role: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use centralized subscription manager
    const subscriptionStatus = SubscriptionManager.getSubscriptionStatusDisplay(user)
    const debugInfo = SubscriptionManager.getDebugInfo(user)
    
    let limits = null
    try {
      if (user.role === 'STUDENT') {
        limits = SubscriptionManager.getApplicationLimits(user)
      }
    } catch (error) {
      console.error('❌ Error getting application limits:', error)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus
      },
      subscription: subscriptionStatus,
      limits,
      debug: debugInfo
    })

  } catch (error) {
    console.error('❌ Error fetching user limits:', error)
    return NextResponse.json({ error: 'Failed to fetch limits' }, { status: 500 })
  }
} 