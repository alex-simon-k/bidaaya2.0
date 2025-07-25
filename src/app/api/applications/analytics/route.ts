import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'
import { hasFeatureAccess } from '@/lib/pricing'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period)

    // Get basic analytics for all users
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Basic application analytics (free for all users)
    const [bidaayaApplications, bidaayaInterviews, bidaayaOffers, bidaayaShortlisted] = await Promise.all([
      prisma.application.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: startDate }
        }
      }),
      prisma.application.count({
        where: {
          userId: session.user.id,
          status: 'INTERVIEWED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.application.count({
        where: {
          userId: session.user.id,
          status: 'ACCEPTED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.application.count({
        where: {
          userId: session.user.id,
          status: 'SHORTLISTED',
          createdAt: { gte: startDate }
        }
      })
    ])

    // Calculate response rate (shortlisted + interviewed + accepted)
    const responseCount = bidaayaShortlisted + bidaayaInterviews + bidaayaOffers
    const responseRate = bidaayaApplications > 0 ? ((responseCount / bidaayaApplications) * 100) : 0

    // Basic analytics for all users
    const analytics = {
      period: periodDays,
      bidaaya: {
        applications: bidaayaApplications,
        shortlisted: bidaayaShortlisted,
        interviews: bidaayaInterviews,
        offers: bidaayaOffers,
        responseRate: Math.round(responseRate * 100) / 100
      },
      total: {
        applications: bidaayaApplications,
        interviews: bidaayaInterviews,
        offers: bidaayaOffers,
        responseRate: Math.round(responseRate * 100) / 100
      },
      summary: {
        totalApplicationsThisMonth: bidaayaApplications,
        averageApplicationsPerWeek: Math.round((bidaayaApplications / periodDays) * 7),
        successRate: bidaayaApplications > 0 ? Math.round((bidaayaOffers / bidaayaApplications) * 100) : 0
      }
    }

    // Check if user has access to advanced analytics
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Note: External tracking analytics will be added once the new tables are available
    // For now, return basic analytics with upgrade prompt for advanced features
    if (!hasFeatureAccess(user.subscriptionPlan, 'external_tracking')) {
      return NextResponse.json({
        ...analytics,
        upgradeAvailable: {
          message: 'Upgrade to Career Builder or Career Accelerator for external job tracking and advanced analytics',
          features: [
            'External job application tracking',
            'Advanced analytics and trends',
            'Source performance analysis',
            'Response rate optimization tips'
          ]
        }
      })
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error fetching application analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 