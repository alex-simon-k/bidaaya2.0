import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user?.role !== 'ADMIN') {
      return new NextResponse('Unauthorized - Admin access required', { status: 401 })
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

    // Admin can modify any applications, but let's verify they exist
    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            companyId: true,
            company: {
              select: {
                companyName: true
              }
            }
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
        { error: 'Some applications not found' },
        { status: 404 }
      )
    }

    // Perform bulk update with admin override
    const updatedApplications = await prisma.application.updateMany({
      where: {
        id: { in: applicationIds }
      },
      data: {
        status: action,
        feedback: feedback || null,
        updatedAt: new Date(),
        // Add admin note indicating this was done by admin
        adminNotes: feedback 
          ? `Admin action: ${action}. ${feedback}` 
          : `Admin action: ${action} by ${session.user.name || session.user.email}`
      },
    })

    console.log(`✅ Admin bulk action performed: ${action} on ${updatedApplications.count} applications by ${session.user.email}`)

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
                companyName: true
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
      message: `Admin successfully ${action.toLowerCase()} ${updatedApplications.count} application(s)`,
      adminAction: true,
      performedBy: session.user.email
    })

  } catch (error) {
    console.error('❌ Error performing admin bulk action:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform admin bulk action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
