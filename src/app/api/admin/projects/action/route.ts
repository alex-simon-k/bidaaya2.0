import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"'
import { canCompanyGetProjectApproved } from '@/lib/subscription'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role?.toUpperCase() !== 'ADMIN') {
      return new NextResponse('Unauthorized - Admin access required', { status: 401 })
    }

    const body = await request.json()
    const { projectId, action, feedback } = body

    if (!projectId || !action) {
      return NextResponse.json(
        { error: 'Project ID and action are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
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

    // Check if we're trying to approve and if company has paid subscription
    if (action === 'approve') {
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

    // Update project status
    const newStatus = action === 'approve' ? 'LIVE' : 'REJECTED'
    
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: newStatus,
        adminFeedback: feedback || null,
        approvedAt: action === 'approve' ? new Date() : null,
        approvedBy: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    console.log(`✅ Project ${action}d by admin:`, {
      projectId,
      title: project.title,
      company: project.company.name,
      action,
      adminId: session.user.id
    })

    // TODO: Send notification email to company about approval/rejection
    // This would be implemented later with an email service

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: `Project ${action}d successfully`
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