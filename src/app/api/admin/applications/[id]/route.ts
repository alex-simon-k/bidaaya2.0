import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const applicationId = params.id
    const body = await request.json()
    const { status, adminNotes, feedback } = body

    // Validate status
    const validStatuses = ['PENDING', 'SHORTLISTED', 'INTERVIEWED', 'ACCEPTED', 'REJECTED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update application
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: {
        ...(status && { status }),
        ...(adminNotes && { adminNotes }),
        ...(feedback && { feedback }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            company: {
              select: {
                name: true,
                companyName: true,
              }
            }
          }
        }
      }
    })

    console.log(`✅ Application ${applicationId} updated to ${status} by admin ${session.user?.id}`)

    // TODO: Send notification email to student about status change
    // TODO: Send notification to company if relevant

    return NextResponse.json({
      success: true,
      application
    })

  } catch (error) {
    console.error('❌ Error updating application:', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const applicationId = params.id

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
            major: true,
            whatsapp: true,
            linkedin: true,
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            company: {
              select: {
                name: true,
                companyName: true,
              }
            }
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      application
    })

  } catch (error) {
    console.error('❌ Error fetching application:', error)
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
  }
} 
