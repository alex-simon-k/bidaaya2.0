import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"
import { canCompanyActivateProject, getProjectCounts } from '@/lib/subscription'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Companies only' }, { status: 401 })
    }

    const projectId = params.id

    // Get the project to verify ownership and current status
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: {
            id: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            companyName: true,
            name: true,
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.companyId !== session.user?.id) {
      return NextResponse.json({ error: 'You can only activate your own projects' }, { status: 403 })
    }

    if (project.status !== 'DRAFT') {
      return NextResponse.json({ 
        error: `Project cannot be activated. Current status: ${project.status}. Only DRAFT projects can be activated.` 
      }, { status: 400 })
    }

    // Get user's current active projects for limit checking
    const userProjects = await prisma.project.findMany({
      where: { companyId: session.user?.id },
      select: { status: true }
    })

    const projectCounts = getProjectCounts(userProjects)

    // Get current user data (not the stored project company data) for subscription check
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: {
        id: true,
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        companyName: true,
        name: true
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if company can activate projects using CURRENT subscription status
    console.log(`🔍 Activation check for user ${currentUser.id}:`, {
      subscriptionPlan: currentUser.subscriptionPlan,
      subscriptionStatus: currentUser.subscriptionStatus,
      activeProjects: projectCounts.active,
      role: currentUser.role
    })
    
    const activationCheck = canCompanyActivateProject(currentUser, projectCounts.active)
    
    if (!activationCheck.canActivate) {
      return NextResponse.json({
        error: activationCheck.reason,
        upgradeRequired: activationCheck.upgradeRequired,
        currentPlan: currentUser.subscriptionPlan || 'FREE',
        code: 'ACTIVATION_BLOCKED',
        projectCounts
      }, { status: 402 }) // 402 Payment Required
    }

    // Activate the project (DRAFT -> PENDING_APPROVAL)
    const activatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'PENDING_APPROVAL',
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: {
            companyName: true,
            name: true,
          }
        }
      }
    })

    console.log(`✅ Project activated: ${project.title} by company ${project.company.companyName || project.company.name}`)

    // TODO: Send notification to admin about new project for approval
    // TODO: Send confirmation email to company

    return NextResponse.json({
      success: true,
      message: 'Project activated successfully! It will be reviewed by our team within 24 hours.',
      project: {
        id: activatedProject.id,
        title: activatedProject.title,
        status: activatedProject.status,
        companyName: activatedProject.company.companyName || activatedProject.company.name,
        activatedAt: activatedProject.updatedAt,
      },
      nextSteps: [
        'Your project is now in review queue',
        'Our team will review within 24 hours',
        'You\'ll be notified once approved',
        'Students can apply once it\'s live'
      ]
    })

  } catch (error) {
    console.error('❌ Error activating project:', error)
    return NextResponse.json(
      { 
        error: 'Failed to activate project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 