import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized - Companies only', { status: 401 })
    }

    const projectId = params.id

    // Check if project exists and belongs to this company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission to modify it' },
        { status: 404 }
      )
    }

    // Only allow resubmission of REJECTED or DRAFT projects
    if (project.status !== 'REJECTED' && project.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only rejected or draft projects can be resubmitted' },
        { status: 400 }
      )
    }

    // Update project status to PENDING_APPROVAL
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'PENDING_APPROVAL',
        updatedAt: new Date(),
        // Clear previous admin feedback when resubmitting
        adminFeedback: null,
        approvedAt: null,
        approvedBy: null,
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

    console.log('✅ Project resubmitted:', {
      projectId,
      title: project.title,
      company: session.user.name,
      companyId: session.user.id
    })

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: 'Project resubmitted for review successfully'
    })
  } catch (error) {
    console.error('❌ Error resubmitting project:', error)
    return NextResponse.json(
      { 
        error: 'Failed to resubmit project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 