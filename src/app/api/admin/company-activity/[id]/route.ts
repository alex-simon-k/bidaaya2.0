import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get comprehensive company activity data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = params
    
    // Calculate date ranges
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Verify the company exists
    const company = await prisma.user.findUnique({
      where: { id, role: 'COMPANY' },
      select: { id: true, companyName: true, subscriptionPlan: true }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get all activity data in parallel
    const [
      projects,
      aiQueries,
      aiQueriesThisMonth,
      creditsUsedThisMonth,
      studentsContacted,
      proposalsReceived,
      recentChatQueries,
      applications
    ] = await Promise.all([
      // Projects data
      prisma.project.findMany({
        where: { userId: id },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          _count: {
            select: { applications: true }
          }
        }
      }),

      // Total AI queries
      prisma.chatQuery.count({
        where: { userId: id }
      }),

      // AI queries this month
      prisma.chatQuery.count({
        where: {
          userId: id,
          timestamp: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }),

      // Credits used this month (proposal submissions)
      prisma.chatQuery.count({
        where: {
          userId: id,
          query: {
            startsWith: 'PROPOSAL_TO_'
          },
          timestamp: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }),

      // Students contacted (unique count)
      prisma.chatQuery.count({
        where: {
          userId: id,
          query: {
            startsWith: 'CONTACT_STUDENT_'
          }
        }
      }),

      // Proposals received
      prisma.chatQuery.count({
        where: {
          query: {
            startsWith: `PROPOSAL_TO_${id}`
          }
        }
      }),

      // Recent chat queries for activity feed
      prisma.chatQuery.findMany({
        where: { userId: id },
        select: {
          id: true,
          query: true,
          timestamp: true,
          responseLength: true
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      }),

      // Applications to company projects
      prisma.application.findMany({
        where: {
          project: {
            userId: id
          }
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          project: {
            select: {
              title: true
            }
          },
          user: {
            select: {
              name: true,
              university: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ])

    // Calculate credit limits based on subscription plan
    const CREDIT_LIMITS = {
      'FREE': 5,
      'STUDENT_PRO': 20,
      'STUDENT_PREMIUM': 50
    }

    const creditLimit = CREDIT_LIMITS[company.subscriptionPlan as keyof typeof CREDIT_LIMITS] || 5
    const creditsRemaining = creditLimit - creditsUsedThisMonth

    // Process projects by status
    const projectStats = {
      draft: projects.filter(p => p.status === 'DRAFT').length,
      live: projects.filter(p => p.status === 'LIVE' || p.status === 'ACTIVE').length,
      totalApplications: projects.reduce((total, p) => total + p._count.applications, 0)
    }

    // Process recent activity
    const recentActivity = recentChatQueries.map(query => {
      let description = 'AI query'
      
      if (query.query.startsWith('PROPOSAL_TO_')) {
        description = 'Sent a proposal to student'
      } else if (query.query.startsWith('CONTACT_STUDENT_')) {
        description = 'Contacted a student'
      } else if (query.query.includes('project')) {
        description = 'AI assistance with project'
      } else if (query.query.includes('search')) {
        description = 'Searched for students'
      } else {
        description = 'Used AI assistant'
      }

      return {
        id: query.id,
        description,
        timestamp: query.timestamp,
        details: query.responseLength ? `Response: ${query.responseLength} chars` : ''
      }
    })

    // Get detailed project information
    const detailedProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      status: project.status,
      createdAt: project.createdAt,
      applicationCount: project._count.applications
    }))

    // Recent applications to their projects
    const recentApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      createdAt: app.createdAt,
      projectTitle: app.project.title,
      studentName: app.user.name,
      studentUniversity: app.user.university
    }))

    const activityData = {
      // Credit Information
      creditsUsed: creditsUsedThisMonth,
      creditsRemaining,
      creditLimit,
      
      // Project Information
      projects: projectStats,
      detailedProjects,
      
      // AI Usage
      aiQueries,
      aiQueriesThisMonth,
      
      // Student Interactions
      studentsContacted,
      proposalsReceived,
      
      // Recent Activity
      recentActivity,
      recentApplications,
      
      // Additional Stats
      totalProjects: projects.length,
      activeProjects: projectStats.live,
      avgApplicationsPerProject: projectStats.totalApplications / Math.max(projects.length, 1),
      
      // Company Info
      companyName: company.companyName,
      subscriptionPlan: company.subscriptionPlan
    }

    return NextResponse.json(activityData)

  } catch (error) {
    console.error('Error fetching company activity:', error)
    return NextResponse.json({ error: 'Failed to fetch company activity' }, { status: 500 })
  }
}
