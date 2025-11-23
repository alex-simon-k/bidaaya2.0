import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch user with streak data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        primaryGoal: true,
        currentStreak: true,
        longestStreak: true,
        lastStreakDate: true,
        dailyPicksDate: true,
        dailyPicksOpportunities: true,
        interests: true,
        education: true,
        externalOpportunityApps: {
          select: { externalOpportunityId: true },
        },
        earlyAccessUnlocks: {
          select: { externalOpportunityId: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastPicksDate = user.dailyPicksDate ? new Date(user.dailyPicksDate) : null
    lastPicksDate?.setHours(0, 0, 0, 0)

    // Check if we need to generate new daily picks
    const needsNewPicks = !lastPicksDate || lastPicksDate.getTime() !== today.getTime()

    // Get applied and unlocked opportunity IDs (needed in both branches)
    const appliedIds = user.externalOpportunityApps.map(app => app.externalOpportunityId)
    const unlockedIds = user.earlyAccessUnlocks.map(unlock => unlock.externalOpportunityId).filter(Boolean) as string[]

    let dailyOpportunities: any[] = []

    if (needsNewPicks) {
      console.log('🎯 Generating new daily picks for user:', userId)

      // Fetch 1 early access opportunity (highest match, not applied)
      const earlyAccessOpp = await prisma.$queryRaw<any[]>`
        SELECT 
          id, title, company, location, description,
          "postedDate", "isNewOpportunity", "earlyAccessUntil",
          "aiCategory", "aiMatchKeywords"
        FROM "ExternalOpportunity"
        WHERE 
          "isActive" = true
          AND "isNewOpportunity" = true
          AND "earlyAccessUntil" > NOW()
          AND id NOT IN (${appliedIds.length > 0 ? appliedIds.join("','") : "''"})
        ORDER BY RANDOM()
        LIMIT 1
      `

      // Fetch 2 regular opportunities (highest match, not applied)
      const regularOpps = await prisma.$queryRaw<any[]>`
        SELECT 
          id, title, company, location, description,
          "postedDate", "isNewOpportunity", "earlyAccessUntil",
          "aiCategory", "aiMatchKeywords"
        FROM "ExternalOpportunity"
        WHERE 
          "isActive" = true
          AND ("isNewOpportunity" = false OR "earlyAccessUntil" IS NULL OR "earlyAccessUntil" < NOW())
          AND id NOT IN (${appliedIds.length > 0 ? appliedIds.join("','") : "''"})
        ORDER BY RANDOM()
        LIMIT 2
      `

      // Combine opportunities
      dailyOpportunities = [...earlyAccessOpp, ...regularOpps]

      // Store the daily picks in the database
      const oppIds = dailyOpportunities.map(opp => opp.id)
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyPicksDate: today,
          dailyPicksOpportunities: oppIds,
        },
      })

      console.log(`✅ Generated ${dailyOpportunities.length} daily picks (${earlyAccessOpp.length} early access + ${regularOpps.length} regular)`)
    } else {
      console.log('📋 Using existing daily picks for user:', userId)

      // Fetch the stored daily picks
      if (user.dailyPicksOpportunities && user.dailyPicksOpportunities.length > 0) {
        dailyOpportunities = await prisma.externalOpportunity.findMany({
          where: {
            id: { in: user.dailyPicksOpportunities },
          },
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            description: true,
            addedAt: true,
            isNewOpportunity: true,
            earlyAccessUntil: true,
            aiCategory: true,
            aiMatchKeywords: true,
          },
        })
      } else {
        dailyOpportunities = []
      }
    }

    // Format opportunities for frontend
    const formattedOpportunities = dailyOpportunities.map(opp => {
      const isEarlyAccess = opp.isNewOpportunity && opp.earlyAccessUntil && new Date(opp.earlyAccessUntil) > new Date()
      const hasUnlocked = unlockedIds.includes(opp.id)
      const hasApplied = appliedIds.includes(opp.id)

      return {
        id: opp.id,
        title: opp.title,
        company: opp.company,
        location: opp.location,
        description: opp.description,
        postedDate: opp.addedAt,
        type: isEarlyAccess ? 'early_access' : 'external',
        isLocked: isEarlyAccess && !hasUnlocked,
        unlockCredits: 7,
        matchScore: 85, // Placeholder - implement proper matching
        hasApplied,
      }
    })

    return NextResponse.json({
      success: true,
      dailyPicks: formattedOpportunities,
      streak: {
        current: user.currentStreak,
        longest: user.longestStreak,
        lastDate: user.lastStreakDate,
      },
      goal: user.primaryGoal || 'Get Employed',
    })

  } catch (error: any) {
    console.error('❌ Daily picks error:', error)
    return NextResponse.json({
      error: 'Failed to fetch daily picks',
      details: error.message,
    }, { status: 500 })
  }
}

