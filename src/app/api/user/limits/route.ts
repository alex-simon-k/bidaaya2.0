import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'
import { checkApplicationLimits } from '@/lib/application-limits'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with application data
    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: {
        id: true,
        subscriptionPlan: true,
        applicationsThisMonth: true,
        lastMonthlyReset: true,
        role: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get application limits
    const limits = checkApplicationLimits(user)

    return NextResponse.json({
      success: true,
      user: {
        subscriptionPlan: user.subscriptionPlan,
        role: user.role,
      },
      limits
    })

  } catch (error) {
    console.error('❌ Error fetching user limits:', error)
    return NextResponse.json({ error: 'Failed to fetch limits' }, { status: 500 })
  }
} 