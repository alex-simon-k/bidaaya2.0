import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role

    // Get project counts
    const [liveProjects, upcomingProjects, totalProjects] = await Promise.all([
      // Live projects (visible to everyone)
      prisma.project.count({
        where: { status: 'LIVE' }
      }),
      
      // Upcoming projects (PENDING_APPROVAL - visible early to Pro users)
      prisma.project.count({
        where: { status: 'PENDING_APPROVAL' }
      }),
      
      // Total projects ever created
      prisma.project.count()
    ])

    // Get user's subscription to determine early access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        subscriptionPlan: true,
        applicationsThisMonth: true,
        role: true
      }
    })

    const hasEarlyAccess = user?.subscriptionPlan === 'STUDENT_PRO'

    // Build response based on user type
    const stats = {
      liveProjects,
      upcomingProjects,
      totalProjects,
      hasEarlyAccess,
      userRole,
      applicationStats: userRole === 'STUDENT' ? {
        applicationsThisMonth: user?.applicationsThisMonth || 0,
        subscriptionPlan: user?.subscriptionPlan || 'FREE'
      } : null
    }

    // Early access message for students
    let earlyAccessMessage = null
    if (userRole === 'STUDENT' && upcomingProjects > 0) {
      if (hasEarlyAccess) {
        earlyAccessMessage = {
          type: 'success',
          title: '🔥 Early Access Active!',
          description: `You have exclusive early access to ${upcomingProjects} upcoming projects before they go live to everyone else.`,
          cta: 'View Early Access Projects',
          ctaLink: '/dashboard/projects?early=true'
        }
      } else {
        earlyAccessMessage = {
          type: 'upgrade',
          title: `🚀 ${upcomingProjects} Projects Coming Soon!`,
          description: `${upcomingProjects} exciting new projects are being released soon. Pro users get 24-36 hours early access to apply before everyone else.`,
          cta: 'Upgrade to Pro for Early Access',
          ctaLink: '/pricing?highlight=student_pro',
          benefits: [
            'Apply before Free and Premium users see the projects',
            'Higher chance of getting selected',
            'Shows companies you\'re a highly motivated student',
            'Unlimited applications per month'
          ]
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      earlyAccessMessage
    })

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
} 