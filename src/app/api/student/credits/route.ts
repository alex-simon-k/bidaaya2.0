import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user credit information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        credits: true,
        lifetimeCreditsUsed: true,
        creditsRefreshDate: true,
        subscriptionPlan: true,
        earlyAccessUnlocksRemaining: true,
        earlyAccessUnlocksResetAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      currentCredits: user.credits,
      lifetimeCreditsUsed: user.lifetimeCreditsUsed,
      creditsRefreshDate: user.creditsRefreshDate,
      subscriptionPlan: user.subscriptionPlan,
      earlyAccessUnlocksRemaining: user.earlyAccessUnlocksRemaining,
      earlyAccessUnlocksResetAt: user.earlyAccessUnlocksResetAt,
    })
  } catch (error) {
    console.error('Error fetching credit info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit information' },
      { status: 500 }
    )
  }
}

