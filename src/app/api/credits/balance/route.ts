import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Force dynamic rendering to avoid static build issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        credits: true,
        creditsRefreshDate: true,
        subscriptionPlan: true,
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Also return current pricing for client UX if needed
    const pricing = await prisma.creditPricing.findFirst()

    return NextResponse.json({
      balance: user.credits,
      nextRefresh: user.creditsRefreshDate,
      subscriptionPlan: user.subscriptionPlan,
      pricing,
    })
  } catch (error) {
    console.error('GET /api/credits/balance error:', error)
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
  }
}


