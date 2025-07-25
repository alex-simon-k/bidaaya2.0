import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"'
import { 
  getUserGameStats, 
  awardXP, 
  getLeaderboard, 
  XP_ACTIONS,
  ACHIEVEMENTS,
  getLevelInfo
} from '@/lib/gamification'

// GET - Get user's gamification stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    switch (action) {
      case 'stats':
        const stats = await getUserGameStats(session.user.id)
        return NextResponse.json({ stats })

      case 'leaderboard':
        const limit = parseInt(searchParams.get('limit') || '10')
        const leaderboard = await getLeaderboard(limit)
        return NextResponse.json({ leaderboard })

      case 'achievements':
        return NextResponse.json({ 
          achievements: ACHIEVEMENTS,
          userStats: await getUserGameStats(session.user.id)
        })

      case 'actions':
        return NextResponse.json({ 
          actions: XP_ACTIONS,
          levels: [1, 2, 3, 4, 5, 6, 7, 8].map(level => ({
            level,
            info: getLevelInfo((level - 1) * 1000) // Example XP for each level
          }))
        })

      default:
        const userStats = await getUserGameStats(session.user.id)
        return NextResponse.json({
          stats: userStats,
          availableActions: Object.keys(XP_ACTIONS),
          totalAchievements: ACHIEVEMENTS.length
        })
    }

  } catch (error) {
    console.error('❌ Error fetching gamification data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gamification data' },
      { status: 500 }
    )
  }
}

// POST - Award XP for actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized - Students only' }, { status: 401 })
    }

    const body = await request.json()
    const { action, metadata } = body

    if (!action || !(action in XP_ACTIONS)) {
      return NextResponse.json({
        error: 'Invalid action',
        availableActions: Object.keys(XP_ACTIONS)
      }, { status: 400 })
    }

    // Award XP
    const result = await awardXP(session.user.id, action, metadata)

    // Get updated stats
    const updatedStats = await getUserGameStats(session.user.id)

    return NextResponse.json({
      success: true,
      xpAwarded: result.xpGained,
      levelUp: result.levelUp || false,
      newLevel: result.newLevel,
      achievement: result.achievement,
      updatedStats,
      message: result.levelUp 
        ? `🎉 Level Up! You're now level ${result.newLevel}! (+${result.xpGained} XP)`
        : `+${result.xpGained} XP earned!`
    })

  } catch (error) {
    console.error('❌ Error awarding XP:', error)
    return NextResponse.json(
      { 
        error: 'Failed to award XP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 