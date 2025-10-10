import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/lib/auth-config"
import AnalyticsTracker from '@/lib/analytics-tracker'


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only admins can access analytics
    if (!session?.user || session.user?.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const userId = searchParams.get('userId')

    // If userId provided, get individual user analytics
    if (userId) {
      const userAnalytics = await AnalyticsTracker.getOnboardingAnalytics(userId)
      if (!userAnalytics) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json(userAnalytics)
    }

    // Otherwise, get platform-wide metrics
    const metrics = await AnalyticsTracker.getOnboardingMetrics(days)
    if (!metrics) {
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }

    return NextResponse.json({
      timeframe: `${days} days`,
      generatedAt: new Date().toISOString(),
      ...metrics
    })

  } catch (error) {
    console.error('❌ Error fetching onboarding analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only admins can trigger analytics updates
    if (!session?.user || session.user?.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, userId, data } = body

    switch (action) {
      case 'track_email_verified':
        await AnalyticsTracker.trackEmailVerified(userId)
        break
      
      case 'track_profile_completed':
        await AnalyticsTracker.trackProfileCompleted(userId)
        break
      
      case 'track_first_application':
        await AnalyticsTracker.trackFirstApplication(userId)
        break
      
      case 'track_first_project':
        await AnalyticsTracker.trackFirstProjectCreated(userId)
        break
      
      case 'backfill_analytics':
        // Admin function to backfill missing analytics data
        await backfillUserAnalytics(userId)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Error updating analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to backfill analytics for existing users
async function backfillUserAnalytics(userId?: string) {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  try {
    // Get users to backfill
    const whereClause = userId ? { id: userId } : {}
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        applications: {
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 1
        },
        projects: {
          select: { createdAt: true, status: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    for (const user of users) {
      const updateData: any = {}

      // Backfill email verification timestamp
      if (user.emailVerified && !user.emailVerifiedAt) {
        updateData.emailVerifiedAt = user.emailVerified
      }

      // Backfill profile completion timestamp
      if (user.profileCompleted && !user.profileCompletedAt) {
        // Estimate based on updatedAt if we don't have exact timestamp
        updateData.profileCompletedAt = user.updatedAt
      }

      // Backfill first application timestamp
      if (user.applications.length > 0 && !user.firstApplicationAt) {
        updateData.firstApplicationAt = user.applications[0].createdAt
      }

      // Backfill first project created timestamp
      const firstProject = user.projects[0]
      if (firstProject && !user.firstProjectCreatedAt) {
        updateData.firstProjectCreatedAt = firstProject.createdAt
      }

      // Backfill first project activated timestamp
      const firstActiveProject = user.projects.find(p => p.status === 'LIVE')
      if (firstActiveProject && !user.firstProjectActivatedAt) {
        updateData.firstProjectActivatedAt = firstActiveProject.createdAt
      }

      // Add basic onboarding steps if missing
      if (!user.onboardingStepsCompleted?.length) {
        const steps = ['account_created']
        if (user.emailVerified) steps.push('email_verified')
        if (user.profileCompleted) steps.push('profile_completed')
        if (user.applications.length > 0) steps.push('first_application')
        if (user.projects.length > 0) steps.push('first_project')
        
        updateData.onboardingStepsCompleted = steps
      }

      // Apply updates if any
      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData
        })
        console.log(`✅ Backfilled analytics for user ${user.id}`)
      }
    }

    console.log(`✅ Completed backfill for ${users.length} users`)

  } catch (error) {
    console.error('Failed to backfill analytics:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
} 
