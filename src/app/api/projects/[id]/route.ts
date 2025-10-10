import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const projectId = params.id

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: {
            name: true,
            companyName: true,
            industry: true,
            companySize: true,
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

    // Everyone can view projects, but with different data access
    let applications: any[] = []
    
    if (session.user?.role === 'ADMIN') {
      // Admin sees everything - get applications and user data separately
      const apps = await prisma.application.findMany({
        where: { projectId: projectId },
        orderBy: { createdAt: 'desc' },
      })
      
      // Get user details for each application
      for (const app of apps) {
        const user = await prisma.user.findUnique({
          where: { id: app.userId }, // ✅ Fixed: userId instead of studentId
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
            major: true,
          },
        })
        applications.push({ ...app, user })
      }
      
    } else if (session.user?.role === 'COMPANY' && project.companyId === session.user?.id) {
      // Company sees their own project's applications
      const apps = await prisma.application.findMany({
        where: { projectId: projectId },
        orderBy: { createdAt: 'desc' },
      })
      
      // Get user details for each application
      for (const app of apps) {
        const user = await prisma.user.findUnique({
          where: { id: app.userId }, // ✅ Fixed: userId instead of studentId
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
            major: true,
          },
        })
        applications.push({ ...app, user })
      }
      
    } else if (session.user?.role === 'STUDENT') {
      // Students can see their own application only
      const userApplication = await prisma.application.findFirst({
        where: { 
          projectId: projectId,
          userId: session.user?.id, // ✅ Fixed: userId instead of studentId
        },
      })
      
      if (userApplication) {
        const user = await prisma.user.findUnique({
          where: { id: userApplication.userId }, // ✅ Fixed: userId instead of studentId
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
        applications = [{ ...userApplication, user }]
      }
    }

    return NextResponse.json({ 
      ...project, 
      applications,
      canApply: session.user?.role === 'STUDENT' && project.status === 'LIVE',
      userRole: session.user?.role
    })

  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user?.role !== 'COMPANY') {
      return new NextResponse('Unauthorized - Companies only', { status: 401 })
    }

    const projectId = params.id
    const body = await request.json()

    // Check if project belongs to this company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: session.user?.id,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    // Only allow editing of DRAFT or REJECTED projects
    if (project.status !== 'DRAFT' && project.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Only draft or rejected projects can be edited' },
        { status: 400 }
      )
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...body,
        status: 'DRAFT', // Reset to draft when edited
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: {
            name: true,
            companyName: true,
          },
        },
      },
    })

    return NextResponse.json(updatedProject)

  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user?.role !== 'COMPANY') {
      return new NextResponse('Unauthorized - Companies only', { status: 401 })
    }

    const projectId = params.id

    // Check if project belongs to this company and is in DRAFT status
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: session.user?.id,
        status: 'DRAFT', // Only allow deleting draft projects
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found, not yours, or cannot be deleted (only draft projects can be deleted)' },
        { status: 404 }
      )
    }

    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ message: 'Project deleted successfully' })

  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
} 
