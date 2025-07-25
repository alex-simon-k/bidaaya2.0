import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return new NextResponse('Missing status', { status: 400 })
    }

    // Verify that the application belongs to a project owned by the company
    const application = await prisma.application.findUnique({
      where: {
        id: params.id,
      },
      include: {
        project: true,
      },
    })

    if (!application) {
      return new NextResponse('Application not found', { status: 404 })
    }

    if (application.project.companyId !== session.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const updatedApplication = await prisma.application.update({
      where: {
        id: params.id,
      },
      data: {
        status,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            university: true,
            major: true,
          },
        },
      },
    })

    return NextResponse.json(updatedApplication)
  } catch (error) {
    console.error('Error updating application:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 