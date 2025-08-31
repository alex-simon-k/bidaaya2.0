import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user?.role !== 'COMPANY') {
      return new NextResponse('Unauthorized - Companies only', { status: 401 })
    }

    const body = await request.json()
    const { applicationIds, action, feedback } = body

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { error: 'Application IDs array is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const validActions = ['SHORTLISTED', 'PENDING', 'INTERVIEWED', 'ACCEPTED', 'REJECTED']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: ' + validActions.join(', ') },
        { status: 400 }
      )
    }

    // Verify all applications belong to projects owned by this company
    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        project: {
          companyId: session.user?.id,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            companyId: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    })

    if (applications.length !== applicationIds.length) {
      return NextResponse.json(
        { error: 'Some applications not found or unauthorized' },
        { status: 404 }
      )
    }

    // Perform bulk update
    const updatedApplications = await prisma.application.updateMany({
      where: {
        id: { in: applicationIds },
        project: {
          companyId: session.user?.id,
        },
      },
      data: {
        status: action,
        feedback: feedback || null,
        updatedAt: new Date(),
      },
    })

    console.log(`✅ Bulk action performed: ${action} on ${updatedApplications.count} applications`)

    // Return success response with updated applications
    const refreshedApplications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
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
            university: true,
            major: true,
            linkedin: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      action,
      updatedCount: updatedApplications.count,
      applications: refreshedApplications,
      message: `Successfully ${action.toLowerCase()} ${updatedApplications.count} application(s)`
    })

  } catch (error) {
    console.error('❌ Error performing bulk action:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform bulk action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
