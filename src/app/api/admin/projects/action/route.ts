import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"
import { canCompanyGetProjectApproved } from '@/lib/subscription'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user?.role?.toUpperCase() !== 'ADMIN') {
      return new NextResponse('Unauthorized - Admin access required', { status: 401 })
    }

    const body = await request.json()
    const { projectId, action, feedback, newStatus } = body

    if (!projectId || (!action && !newStatus)) {
      return NextResponse.json(
        { error: 'Project ID and action/newStatus are required' },
        { status: 400 }
      )
    }

    // Support both legacy action format and new direct status updates
    const validActions = ['approve', 'reject', 'update']
    const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'LIVE', 'REJECTED', 'CLOSED']
    
    if (action && !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    if (newStatus && !validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            subscriptionPlan: true,
            role: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Determine the target status
    let targetStatus = newStatus
    if (action === 'approve') {
      targetStatus = 'LIVE'
    } else if (action === 'reject') {
      targetStatus = 'REJECTED'
    }

    // Check if we're trying to approve and if company has paid subscription
    if (targetStatus === 'LIVE') {
      const approvalCheck = canCompanyGetProjectApproved(project.company)
      if (!approvalCheck.canApprove) {
        return NextResponse.json({ 
          error: approvalCheck.reason,
          requiresUpgrade: true,
          upgradeRequired: approvalCheck.upgradeRequired,
          companyName: project.company.companyName || project.company.name || 'Unknown Company'
        }, { status: 402 }) // 402 Payment Required
      }
    }
    
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: targetStatus,
        adminFeedback: feedback || null,
        ...(targetStatus === 'LIVE' && {
          approvedAt: new Date(),
          approvedBy: session.user?.id
        }),
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
          },
        },
      },
    })

    console.log(`✅ Project status updated by admin:`, {
      projectId,
      title: project.title,
      company: project.company.name,
      oldStatus: project.status,
      newStatus: targetStatus,
      action: action || 'update',
      adminId: session.user?.id
    })

    // TODO: Send notification email to company about status changes
    // This would be implemented later with an email service

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: `Project status updated to ${targetStatus.toLowerCase().replace('_', ' ')} successfully`
    })
  } catch (error) {
    console.error('❌ Error updating project status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update project status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 
