import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get the most recent 5 users to see their tracking status
    const recentUsers = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
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
        educationStatus: true,
        name: true,
        terms: true,
        skills: true
      }
    })

    // Analyze each user's tracking status
    const analysis = recentUsers.map(user => {
      const hasPhase1Marker = user.onboardingStepsCompleted?.includes('phase_1_completed')
      const hasPhase2Marker = user.onboardingStepsCompleted?.includes('phase_2_completed')
      const hasEducationDetails = !!(user.university || user.highSchool || user.major || user.subjects)
      
      // Simulate the hasRequiredFields logic from profile API
      const hasRequiredFields = user.name && (user.university || user.major || user.subjects || user.skills || user.educationStatus) && user.terms
      
      return {
        email: user.email,
        createdAt: user.createdAt,
        profileCompleted: user.profileCompleted,
        profileCompletedAt: user.profileCompletedAt,
        phase1CompletedAt: user.phase1CompletedAt,
        phase2CompletedAt: user.phase2CompletedAt,
        onboardingSteps: user.onboardingStepsCompleted,
        analysis: {
          hasPhase1Marker,
          hasPhase2Marker,
          hasEducationDetails,
          hasRequiredFields,
          shouldHavePhase1: hasRequiredFields && user.profileCompleted,
          shouldHavePhase2: hasEducationDetails
        },
        rawData: {
          name: !!user.name,
          university: !!user.university,
          highSchool: !!user.highSchool,
          major: !!user.major,
          subjects: !!user.subjects,
          educationStatus: !!user.educationStatus,
          terms: !!user.terms,
          skills: !!user.skills
        }
      }
    })

    return NextResponse.json({
      message: 'Recent user phase tracking analysis',
      totalUsers: recentUsers.length,
      analysis,
      summary: {
        usersWithProfileCompleted: analysis.filter(u => u.profileCompleted).length,
        usersWithPhase1Tracking: analysis.filter(u => u.hasPhase1Marker || u.phase1CompletedAt).length,
        usersWithPhase2Tracking: analysis.filter(u => u.hasPhase2Marker || u.phase2CompletedAt).length,
        usersMissingPhase1: analysis.filter(u => u.analysis.shouldHavePhase1 && !u.analysis.hasPhase1Marker && !u.phase1CompletedAt).length,
        usersMissingPhase2: analysis.filter(u => u.analysis.shouldHavePhase2 && !u.analysis.hasPhase2Marker && !u.phase2CompletedAt).length
      }
    })

  } catch (error) {
    console.error('Failed to analyze phase tracking:', error)
    return NextResponse.json({ error: 'Failed to analyze tracking' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'backfill') {
      // Backfill missing phase tracking for existing users
      const usersToBackfill = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          profileCompleted: true,
          phase1CompletedAt: null
        },
        select: {
          id: true,
          email: true,
          profileCompletedAt: true,
          university: true,
          highSchool: true,
          major: true,
          subjects: true,
          onboardingStepsCompleted: true
        }
      })

      let backfilledPhase1 = 0
      let backfilledPhase2 = 0

      for (const user of usersToBackfill) {
        const updates: any = {}
        const stepsToAdd: string[] = []

        // Add Phase 1 tracking if missing
        if (!user.onboardingStepsCompleted?.includes('phase_1_completed')) {
          updates.phase1CompletedAt = user.profileCompletedAt || new Date()
          stepsToAdd.push('phase_1_completed')
          backfilledPhase1++
        }

        // Add Phase 2 tracking if they have education details
        const hasEducationDetails = !!(user.university || user.highSchool || user.major || user.subjects)
        if (hasEducationDetails && !user.onboardingStepsCompleted?.includes('phase_2_completed')) {
          updates.phase2CompletedAt = user.profileCompletedAt || new Date()
          stepsToAdd.push('phase_2_completed')
          backfilledPhase2++
        }

        if (stepsToAdd.length > 0) {
          updates.onboardingStepsCompleted = {
            push: stepsToAdd
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updates
          })
        }
      }

      return NextResponse.json({
        message: 'Backfill completed',
        backfilledPhase1,
        backfilledPhase2,
        totalProcessed: usersToBackfill.length
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Failed to backfill phase tracking:', error)
    return NextResponse.json({ error: 'Failed to backfill' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
