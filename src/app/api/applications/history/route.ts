import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/applications/history
 * Returns the application history for the last 28 days for heatmap visualization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Calculate date range for last 28 days
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 27) // 28 days including today
    startDate.setHours(0, 0, 0, 0)

    // Fetch all applications in the last 28 days
    const [externalOpportunityApplications, manualExternalApplications] = await Promise.all([
      prisma.externalOpportunityApplication.findMany({
        where: {
          userId,
          appliedAt: {
            gte: startDate,
            lte: today,
          },
        },
        select: {
          appliedAt: true,
        },
        orderBy: {
          appliedAt: 'asc',
        },
      }),
      prisma.externalApplication.findMany({
        where: {
          userId,
          appliedDate: {
            gte: startDate,
            lte: today,
          },
        },
        select: {
          appliedDate: true,
        },
        orderBy: {
          appliedDate: 'asc',
        },
      }),
    ])

    // Initialize array for 28 days (all zeros)
    const history: number[] = Array(28).fill(0)

    // Helper function to get day index (0 = 28 days ago, 27 = today)
    const getDayIndex = (date: Date) => {
      const dayDate = new Date(date)
      dayDate.setHours(0, 0, 0, 0)
      
      const diffTime = dayDate.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      return Math.max(0, Math.min(27, diffDays))
    }

    // Count applications per day
    externalOpportunityApplications.forEach(app => {
      const dayIndex = getDayIndex(app.appliedAt)
      history[dayIndex]++
    })

    manualExternalApplications.forEach(app => {
      const dayIndex = getDayIndex(app.appliedDate)
      history[dayIndex]++
    })

    // Get total application count (all time)
    const totalApplications = await prisma.externalOpportunityApplication.count({
      where: { userId },
    }) + await prisma.externalApplication.count({
      where: { userId },
    })

    return NextResponse.json({
      history,
      totalApplications,
      startDate: startDate.toISOString(),
      endDate: today.toISOString(),
    })

  } catch (error) {
    console.error('Error fetching application history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application history' },
      { status: 500 }
    )
  }
}

