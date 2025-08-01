import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"
import { canUserApply } from '@/lib/subscription'
import { AnalyticsTracker } from '@/lib/analytics-tracker'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')

    let where: any = {}

    if (session.user?.role === 'STUDENT') {
      // Students can only see their own applications
      where.userId = session.user?.id
    } else if (session.user?.role === 'COMPANY') {
      // Companies can see applications to their projects
      where.project = { companyId: session.user?.id }
    }

    // Additional filters
    if (projectId) {
      where.projectId = projectId
    }
    if (userId && session.user?.role === 'COMPANY') {
      where.userId = userId
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            category: true,
            company: {
              select: {
                name: true,
                subscriptionPlan: true, // Add subscription plan for filtering
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            university: true,
            major: true,
            linkedin: true,
          },
        },
      },
      orderBy: [
        { status: 'desc' }, // Shortlisted first
        { compatibilityScore: 'desc' }, // Then by compatibility score
        { createdAt: 'desc' }
      ],
    })

    // Apply plan-based filtering for companies
    let filteredApplications = applications
    if (session.user?.role === 'COMPANY') {
      const { getApplicantVisibilityLevel } = await import('@/lib/subscription')
      
      // Get company's subscription details
      const company = await prisma.user.findUnique({
        where: { id: session.user?.id },
        select: { subscriptionPlan: true, subscriptionStatus: true }
      })

      if (company) {
        const visibilityLevel = getApplicantVisibilityLevel(company)
        
        // Apply filtering based on subscription tier
        if (visibilityLevel === 'shortlisted_only') {
          // Basic tier: Only show shortlisted candidates (max 10)
          filteredApplications = applications
            .filter(app => app.status === 'SHORTLISTED')
            .slice(0, 10)
            .map(app => ({
              ...app,
              user: {
                ...app.user,
                email: '***@***.com', // Blur email for Basic tier
                linkedin: null, // Hide LinkedIn for Basic tier
              }
            }))
        } else if (visibilityLevel === 'full_pool') {
          // HR Booster: Show all applications + shortlisted with full details
          filteredApplications = applications
        } else if (visibilityLevel === 'complete_transparency') {
          // Premium: Complete transparency + AI insights
          filteredApplications = applications
        }

        // Add tier info to response
        return NextResponse.json({
          applications: filteredApplications,
          meta: {
            visibilityLevel,
            totalApplications: applications.length,
            visibleApplications: filteredApplications.length,
            subscriptionPlan: company.subscriptionPlan,
            upgradePrompt: visibilityLevel === 'shortlisted_only' ? {
              message: 'Upgrade to HR Booster to see all applicants and their full profiles',
              currentLimit: 'Only shortlisted candidates (max 10)',
              nextTier: 'HR Booster (£75/month)'
            } : null
          }
        })
      }
    }

    return NextResponse.json(filteredApplications)
  } catch (error) {
    console.error('Error fetching applications:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user?.role !== 'STUDENT') {
      return new NextResponse('Unauthorized - Students only', { status: 401 })
    }

    const body = await request.json()
    const { projectId, coverLetter, motivation } = body

    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 })
    }

    // Check if project exists and is live
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        applications: {
          where: { userId: session.user?.id },
        },
      },
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    if (project.status !== 'LIVE') {
      return new NextResponse('Project is not accepting applications', { status: 400 })
    }

    // Check if student has already applied
    if (project.applications.length > 0) {
      return new NextResponse('You have already applied to this project', { status: 400 })
    }

    // Check if project is at capacity
    if ((project.currentApplications || 0) >= (project.maxApplications || 100)) {
      return new NextResponse('Project has reached maximum applications', { status: 400 })
    }

    // Check student's application limits based on their tier
    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Check if user can apply based on their subscription plan
    const applicationCheck = canUserApply(user, user.applicationsThisMonth || 0)
    if (!applicationCheck.canApply) {
      return new NextResponse(applicationCheck.reason || 'Application limit reached', { status: 403 })
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        userId: session.user?.id,
        projectId,
        coverLetter: coverLetter || '',
        motivation: motivation || '',
        status: 'PENDING',
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            category: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // Track analytics for first application (if applicable)
    try {
      await AnalyticsTracker.trackFirstApplication(session.user?.id)
      console.log('📊 Analytics tracked: First application timestamp (if first time)')
    } catch (analyticsError) {
      console.error('Failed to track first application analytics (non-blocking):', analyticsError)
      // Don't block the user's flow if analytics fails
    }

    // Update project application count and user application count
    await Promise.all([
      prisma.project.update({
        where: { id: projectId },
        data: {
          currentApplications: {
            increment: 1,
          },
        },
      }),
      prisma.user.update({
        where: { id: session.user?.id },
        data: {
          applicationsThisMonth: {
            increment: 1,
          },
        },
      }),
    ])

    console.log('✅ Application created successfully:', application.id)
    return NextResponse.json(application)
  } catch (error) {
    console.error('❌ Error creating application:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user?.role !== 'COMPANY') {
      return new NextResponse('Unauthorized - Companies only', { status: 401 })
    }

    const body = await request.json()
    const { applicationId, status, feedback } = body

    if (!applicationId || !status) {
      return new NextResponse('Application ID and status are required', { status: 400 })
    }

    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']
    if (!validStatuses.includes(status)) {
      return new NextResponse('Invalid status', { status: 400 })
    }

    // Verify the application belongs to a project owned by this company
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        project: {
          companyId: session.user?.id,
        },
      },
      include: {
        project: true,
        user: true,
      },
    })

    if (!application) {
      return new NextResponse('Application not found or unauthorized', { status: 404 })
    }

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        feedback: feedback || null,
        updatedAt: new Date(),
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            category: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    console.log('✅ Application status updated:', applicationId, status)
    return NextResponse.json(updatedApplication)
  } catch (error) {
    console.error('❌ Error updating application:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 