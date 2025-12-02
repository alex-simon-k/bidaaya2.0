import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import { selectDailyPicks } from '@/lib/opportunity-matcher'
import { getVisualStreak } from '@/lib/streak'

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

    // Get current time and calculate UAE time (UTC+4)
    // Daily picks refresh at 4am UAE time
    const now = new Date()
    const utcHour = now.getUTCHours()
    const utcDate = new Date(now)
    utcDate.setUTCHours(0, 0, 0, 0)
    
    // Calculate what day and hour it is in UAE (UTC+4)
    // UAE hour = (UTC hour + 4) % 24
    // If UTC hour + 4 >= 24, it's the next day in UAE
    const uaeHour = (utcHour + 4) % 24
    const isNextDayInUae = utcHour + 4 >= 24
    
    // Determine the refresh date
    // Refresh happens at 4am UAE time
    // If it's before 4am UAE, we're still showing previous day's picks
    // If it's 4am or later UAE, we show today's picks
    let refreshDate: Date
    if (uaeHour < 4) {
      // Before 4am UAE - still showing previous day
      // If it's next day in UAE, previous day is today's UTC date
      // Otherwise, previous day is yesterday's UTC date
      if (isNextDayInUae) {
        refreshDate = utcDate // Today's UTC date (which is yesterday in UAE)
      } else {
        refreshDate = new Date(utcDate.getTime() - 24 * 60 * 60 * 1000) // Yesterday UTC
      }
    } else {
      // 4am or later UAE - showing today's picks
      // If it's next day in UAE, today is tomorrow's UTC date
      // Otherwise, today is today's UTC date
      if (isNextDayInUae) {
        refreshDate = new Date(utcDate.getTime() + 24 * 60 * 60 * 1000) // Tomorrow UTC
      } else {
        refreshDate = utcDate // Today UTC
      }
    }
    
    // Normalize last picks date for comparison
    const lastPicksDate = user.dailyPicksDate ? new Date(user.dailyPicksDate) : null
    const lastPicksDateNormalized = lastPicksDate ? new Date(lastPicksDate.getTime()) : null
    if (lastPicksDateNormalized) {
      lastPicksDateNormalized.setUTCHours(0, 0, 0, 0)
    }

    // Check if we need to generate new daily picks
    const needsNewPicks = !lastPicksDateNormalized || 
      lastPicksDateNormalized.getTime() !== refreshDate.getTime()

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
          dailyPicksDate: refreshDate,
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

    // Format opportunities for frontend (match scores already calculated by selectDailyPicks)
    const formattedOpportunities = dailyOpportunities.map((opp) => {
      const isEarlyAccess = opp.isNewOpportunity && opp.earlyAccessUntil && new Date(opp.earlyAccessUntil) > new Date()
      const hasUnlocked = unlockedIds.includes(opp.id)
      const hasApplied = appliedIds.includes(opp.id)

      return {
        id: opp.id,
        title: opp.title,
        company: opp.company,
        companyLogo: opp.companyLogo,
        location: opp.location,
        description: opp.description,
        applicationUrl: opp.applicationUrl, // Add the application URL!
        postedDate: opp.addedAt,
        type: isEarlyAccess ? 'early_access' : 'external',
        isLocked: isEarlyAccess && !hasUnlocked,
        unlockCredits: 7,
        matchScore: opp.matchScore || 75,
        matchReasons: opp.matchReasons || ['General match'],
        hasApplied,
      }
    })

    // Calculate visual streak (decays gradually instead of resetting immediately)
    const visualStreak = await getVisualStreak(prisma, userId)

    return NextResponse.json({
      success: true,
      dailyPicks: formattedOpportunities,
      streak: {
        current: visualStreak, // Use visual streak for smoother UX
        actual: user.currentStreak, // Actual consecutive days
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

