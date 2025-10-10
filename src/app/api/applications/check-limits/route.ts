import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'
import { checkApplicationLimits } from '@/lib/application-limits'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
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

    // Check if user has already applied to this project
    const existingApplication = await prisma.application.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user?.id,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json({
        canApply: false,
        reason: 'You have already applied to this project',
        limits: null
      })
    }

    // Check application limits
    const limits = checkApplicationLimits(user)

    return NextResponse.json({
      canApply: limits.canApply,
      reason: limits.canApply ? null : limits.upgradeReason,
      limits
    })

  } catch (error) {
    console.error('❌ Error checking application limits:', error)
    return NextResponse.json({ error: 'Failed to check limits' }, { status: 500 })
  }
} 
