import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch user's current streak data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastStreakDate: true,
        dailyPicksOpportunities: true,
        externalOpportunityApps: {
          select: { externalOpportunityId: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastStreakDate = user.lastStreakDate ? new Date(user.lastStreakDate) : null
    lastStreakDate?.setHours(0, 0, 0, 0)

    // Check if user has applied to at least one daily pick today
    const appliedIds = user.externalOpportunityApps.map(app => app.externalOpportunityId)
    const dailyPickIds = user.dailyPicksOpportunities || []
    
    const hasAppliedToDaily = dailyPickIds.some(pickId => appliedIds.includes(pickId))

    if (!hasAppliedToDaily) {
      return NextResponse.json({
        success: false,
        message: 'Apply to at least one daily pick to maintain your streak!',
        streak: user.currentStreak,
      })
    }

    // Check if already updated today
    if (lastStreakDate && lastStreakDate.getTime() === today.getTime()) {
      return NextResponse.json({
        success: true,
        message: 'Streak already updated today!',
        streak: user.currentStreak,
        alreadyUpdated: true,
      })
    }

    // Calculate new streak
    let newStreak = user.currentStreak || 0
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (!lastStreakDate || lastStreakDate.getTime() === yesterday.getTime()) {
      // Continue streak
      newStreak += 1
    } else if (lastStreakDate.getTime() < yesterday.getTime()) {
      // Streak broken, start over
      newStreak = 1
    }

    // Update longest streak if needed
    const newLongest = Math.max(newStreak, user.longestStreak || 0)

    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastStreakDate: today,
      },
    })

    console.log(`🔥 Streak updated for user ${userId}: ${newStreak} days`)

    return NextResponse.json({
      success: true,
      message: `🔥 ${newStreak} day streak!`,
      streak: newStreak,
      longestStreak: newLongest,
      isNewRecord: newStreak === newLongest && newStreak > 1,
    })

  } catch (error: any) {
    console.error('❌ Streak update error:', error)
    return NextResponse.json({
      error: 'Failed to update streak',
      details: error.message,
    }, { status: 500 })
  }
}

