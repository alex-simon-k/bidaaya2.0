import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const projectsWithApplicationCounts = projects.map(project => ({
      ...project,
      currentApplications: project._count.applications
    }))

    return NextResponse.json({
      projects: projectsWithApplicationCounts,
      total: projects.length
    })

  } catch (error) {
    console.error('❌ Error fetching admin projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      companyId,
      compensation,
      duration,
      experienceLevel,
      category,
      deliverables,
      applicationDeadline
    } = body

    if (!title || !description || !companyId) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, description, companyId' 
      }, { status: 400 })
    }

    // Verify company exists
    const company = await prisma.user.findUnique({
      where: { id: companyId, role: 'COMPANY' }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        title,
        description,
        companyId,
        compensation: compensation || null,
        duration: duration || null,
        experienceLevel: experienceLevel || 'University',
        category: category || 'Other',
        deliverables: deliverables || [],
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        status: 'PENDING_APPROVAL', // Admin-created projects need approval
        createdBy: session.user.id, // Track admin who created it
        createdAt: new Date(),
        updatedAt: new Date()
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

    console.log('✅ Project created by admin:', project.id)

    return NextResponse.json({
      success: true,
      project,
      message: 'Project created successfully'
    })

  } catch (error) {
    console.error('❌ Error creating admin project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}