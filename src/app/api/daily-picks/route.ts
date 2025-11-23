import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import { selectDailyPicks } from '@/lib/opportunity-matcher'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch user with complete profile data for matching
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        primaryGoal: true,
        currentStreak: true,
        longestStreak: true,
        lastStreakDate: true,
        dailyPicksDate: true,
        dailyPicksOpportunities: true,
        
        // Profile data for matching
        skills: true,
        interests: true,
        education: true,
        major: true,
        goal: true,
        
        // CV data for enhanced matching
        cvSkills: {
          select: { skillName: true },
        },
        cvEducation: {
          select: { degreeType: true, degreeTitle: true, fieldOfStudy: true, institution: true },
        },
        cvExperience: {
          select: { title: true, employer: true, location: true, summary: true },
        },
        
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

      // Fetch ALL active opportunities for matching
      const allOpportunities = await prisma.externalOpportunity.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          description: true,
          category: true,
          addedAt: true,
          isNewOpportunity: true,
          earlyAccessUntil: true,
          
          // AI categorization fields
          aiCategory: true,
          aiMatchKeywords: true,
          aiSkillsRequired: true,
          aiEducationMatch: true,
          aiIndustryTags: true,
          
          // Manual matching fields
          requiredDegrees: true,
          preferredMajors: true,
          requiredSkills: true,
          industries: true,
          matchingTags: true,
        },
      })

      console.log(`📊 Found ${allOpportunities.length} active opportunities to match against`)

      // Build student profile for matching
      const studentProfile = {
        skills: user.skills,
        interests: user.interests,
        major: user.major,
        education: user.education,
        goal: user.goal,
        cvSkills: user.cvSkills,
        cvEducation: user.cvEducation,
        cvExperience: user.cvExperience,
      }

      // Use matching algorithm to select best daily picks
      const picks = selectDailyPicks(studentProfile, allOpportunities as any, appliedIds)

      // Combine early access + regular
      dailyOpportunities = [
        ...(picks.earlyAccess ? [picks.earlyAccess] : []),
        ...picks.regular,
      ]

      // Store the daily picks in the database
      const oppIds = dailyOpportunities.map(opp => opp.id)
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyPicksDate: today,
          dailyPicksOpportunities: oppIds,
        },
      })

      console.log(`✅ Generated ${dailyOpportunities.length} daily picks:`)
      console.log(`   - Early Access: ${picks.earlyAccess ? 1 : 0}`)
      console.log(`   - Regular: ${picks.regular.length}`)
      dailyOpportunities.forEach((opp: any) => {
        console.log(`   - ${opp.title} (Match: ${opp.matchScore}%) - ${opp.matchReasons.join(', ')}`)
      })
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
            category: true,
            addedAt: true,
            isNewOpportunity: true,
            earlyAccessUntil: true,
            
            // AI fields
            aiCategory: true,
            aiMatchKeywords: true,
            aiSkillsRequired: true,
            aiEducationMatch: true,
            aiIndustryTags: true,
            
            // Manual fields
            requiredDegrees: true,
            preferredMajors: true,
            requiredSkills: true,
            industries: true,
            matchingTags: true,
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
        matchScore: opp.matchScore || 75, // From matching algorithm
        matchReasons: opp.matchReasons || [],
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

