import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const projectId = params.id

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Find the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Update project status to LIVE
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'LIVE'
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true
          }
        }
      }
    })

    console.log('✅ Project approved and made live:', updatedProject.id)

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: 'Project approved and is now live'
    })

  } catch (error) {
    console.error('❌ Error approving project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
