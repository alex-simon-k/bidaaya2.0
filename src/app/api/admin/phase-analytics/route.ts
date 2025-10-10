import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get phase completion analytics
    const phaseAnalytics = await prisma.user.findMany({
      where: {
        role: 'STUDENT' // Focus on student onboarding
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        profileCompleted: true,
        profileCompletedAt: true,
        phase1CompletedAt: true,
        phase2CompletedAt: true,
        onboardingStepsCompleted: true,
        university: true,
        highSchool: true,
        major: true,
        subjects: true,
        firstApplicationAt: true,
        emailVerified: true,
        emailVerifiedAt: true
      }
    })

    // Calculate phase completion stats
    const totalUsers = phaseAnalytics.length
    const phase1Completed = phaseAnalytics.filter(user => 
      user.onboardingStepsCompleted?.includes('phase_1_completed') || user.phase1CompletedAt
    ).length
    const phase2Completed = phaseAnalytics.filter(user => 
      user.onboardingStepsCompleted?.includes('phase_2_completed') || user.phase2CompletedAt ||
      (user.university || user.highSchool || user.major || user.subjects)
    ).length
    const appliedToFirstProject = phaseAnalytics.filter(user => user.firstApplicationAt).length

    // Calculate conversion funnel
    const emailVerified = phaseAnalytics.filter(user => user.emailVerified).length
    
    const conversionRates = {
      emailToPhase1: emailVerified > 0 ? (phase1Completed / emailVerified * 100).toFixed(2) : '0',
      phase1ToPhase2: phase1Completed > 0 ? (phase2Completed / phase1Completed * 100).toFixed(2) : '0',
      phase2ToApplication: phase2Completed > 0 ? (appliedToFirstProject / phase2Completed * 100).toFixed(2) : '0',
      overallConversion: totalUsers > 0 ? (appliedToFirstProject / totalUsers * 100).toFixed(2) : '0'
    }

    // Phase completion over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentPhase1 = await prisma.user.count({
      where: {
        role: 'STUDENT',
        phase1CompletedAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    const recentPhase2 = await prisma.user.count({
      where: {
        role: 'STUDENT',
        phase2CompletedAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Identify users stuck in different phases
    const stuckInPhase1 = phaseAnalytics.filter(user => 
      user.emailVerified && 
      !user.onboardingStepsCompleted?.includes('phase_1_completed') && 
      !user.phase1CompletedAt
    )

    const stuckInPhase2 = phaseAnalytics.filter(user => 
      (user.onboardingStepsCompleted?.includes('phase_1_completed') || user.phase1CompletedAt) &&
      !user.onboardingStepsCompleted?.includes('phase_2_completed') && 
      !user.phase2CompletedAt &&
      !user.university && !user.highSchool && !user.major && !user.subjects
    )

    return NextResponse.json({
      summary: {
        totalStudents: totalUsers,
        emailVerified,
        phase1Completed,
        phase2Completed,
        appliedToFirstProject,
        conversionRates
      },
      recentActivity: {
        phase1CompletionsLast30Days: recentPhase1,
        phase2CompletionsLast30Days: recentPhase2
      },
      stuckUsers: {
        stuckInPhase1: stuckInPhase1.length,
        stuckInPhase2: stuckInPhase2.length,
        stuckInPhase1Details: stuckInPhase1.slice(0, 10), // First 10 for review
        stuckInPhase2Details: stuckInPhase2.slice(0, 10)
      },
      lookerQueries: {
        phase1CompletionRate: `
          SELECT 
            COUNT(CASE WHEN phase1_completed_at IS NOT NULL THEN 1 END) as phase1_completed,
            COUNT(CASE WHEN email_verified = true THEN 1 END) as email_verified,
            ROUND(
              COUNT(CASE WHEN phase1_completed_at IS NOT NULL THEN 1 END) * 100.0 / 
              NULLIF(COUNT(CASE WHEN email_verified = true THEN 1 END), 0), 2
            ) as phase1_conversion_rate
          FROM users 
          WHERE role = 'STUDENT'
        `,
        phase2CompletionRate: `
          SELECT 
            COUNT(CASE WHEN phase2_completed_at IS NOT NULL THEN 1 END) as phase2_completed,
            COUNT(CASE WHEN phase1_completed_at IS NOT NULL THEN 1 END) as phase1_completed,
            ROUND(
              COUNT(CASE WHEN phase2_completed_at IS NOT NULL THEN 1 END) * 100.0 / 
              NULLIF(COUNT(CASE WHEN phase1_completed_at IS NOT NULL THEN 1 END), 0), 2
            ) as phase2_conversion_rate
          FROM users 
          WHERE role = 'STUDENT'
        `,
        dailyPhaseCompletions: `
          SELECT 
            DATE(phase1_completed_at) as completion_date,
            COUNT(*) as phase1_completions
          FROM users 
          WHERE role = 'STUDENT' AND phase1_completed_at IS NOT NULL
          GROUP BY DATE(phase1_completed_at)
          ORDER BY completion_date DESC
          LIMIT 30
        `
      }
    })

  } catch (error) {
    console.error('Failed to fetch phase analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
