import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"
import { canCompanyGetProjectApproved } from '@/lib/subscription'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role?.toUpperCase() !== 'ADMIN') {
      console.log('Admin API access denied - User role:', session?.user?.role || 'No user')
      return new NextResponse('Unauthorized - Admin access required', { status: 401 })
    }

    // Get status filter from query params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    // Build where clause with status filter if provided
    const whereClause: any = {}
    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter
    }

    console.log('🔍 Admin projects API - Filter:', statusFilter, 'Where clause:', whereClause)

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            name: true,
            email: true,
            companyName: true,
          },
        },
        applications: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [
        {
          status: 'asc', // PENDING_APPROVAL first
        },
        {
          createdAt: 'desc',
        },
      ],
    })

    console.log(`📊 Admin projects API - Found ${projects.length} projects with filter: ${statusFilter}`)
    if (projects.length > 0) {
      console.log('📋 Project statuses:', projects.map(p => `${p.title}: ${p.status}`).join(', '))
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('❌ Error fetching admin projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST - Approve or reject a project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, action, feedback } = body

    if (!projectId || !action) {
      return NextResponse.json({ 
        error: 'Project ID and action are required' 
      }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action must be either "approve" or "reject"' 
      }, { status: 400 })
    }

    // Verify project exists and is pending approval
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            contactEmail: true,
            subscriptionPlan: true,
            role: true,
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ 
        error: 'Project is not pending approval' 
      }, { status: 400 })
    }

    // Check if we're trying to approve and if company has paid subscription
    if (action === 'approve') {
      const approvalCheck = canCompanyGetProjectApproved(project.company)
      if (!approvalCheck.canApprove) {
        return NextResponse.json({ 
          error: approvalCheck.reason,
          requiresUpgrade: true,
          upgradeRequired: approvalCheck.upgradeRequired,
          companyName: project.company.companyName || 'Unknown Company'
        }, { status: 402 }) // 402 Payment Required
      }
    }

    // Update project status
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: action === 'approve' ? 'LIVE' : 'REJECTED',
        adminFeedback: feedback || null,
        approvedAt: action === 'approve' ? new Date() : null,
        approvedBy: action === 'approve' ? session.user.id : null,
      }
    })

    // Send notification email to company (async)
    try {
      await sendProjectDecisionEmail(project, action, feedback)
    } catch (emailError) {
      console.error('Failed to send decision email:', emailError)
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Project ${action}d successfully`,
      project: {
        id: updatedProject.id,
        title: updatedProject.title,
        status: updatedProject.status,
        adminFeedback: updatedProject.adminFeedback,
        approvedAt: updatedProject.approvedAt,
      }
    })

  } catch (error) {
    console.error('Error processing project decision:', error)
    return NextResponse.json(
      { error: 'Failed to process project decision' },
      { status: 500 }
    )
  }
}

async function sendProjectDecisionEmail(
  project: any, 
  action: 'approve' | 'reject', 
  feedback?: string
) {
  console.log(`📧 Would send ${action} email for project "${project.title}" to ${project.company.contactEmail}`)
  
  // TODO: Implement email service
  /*
  const template = action === 'approve' ? 'project-approved' : 'project-rejected'
  
  await emailService.send({
    to: project.company.contactEmail,
    template: template,
    data: {
      companyName: project.company.companyName,
      projectTitle: project.title,
      feedback: feedback,
      projectUrl: `${process.env.NEXTAUTH_URL}/dashboard/projects/${project.id}`,
    }
  })
  */
} 