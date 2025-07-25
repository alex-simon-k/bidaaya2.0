import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient, ProjectStatus } from '@prisma/client'
import { authOptions } from '../auth/[...nextauth]/route'
import { canCompanyCreateProject } from '@/lib/subscription'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const companyId = searchParams.get('companyId')

    const where = {
      ...(status && { status: status as ProjectStatus }),
      ...(companyId && { companyId }),
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        company: {
          select: {
            name: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'COMPANY') {
      console.log('❌ Session check failed:', { session: !!session, user: !!session?.user, role: session?.user?.role })
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('✅ User authenticated:', { id: session.user.id, role: session.user.role, email: session.user.email })

    const body = await request.json()
    const { 
      title, 
      description, 
      category,
      subcategory,
      projectType,
      teamSize,
      durationMonths,
      experienceLevel,
      timeCommitment,
      requirements,
      deliverables,
      skillsRequired,
      compensation,
      location,
      remote,
      applicationDeadline
    } = body

    if (!title || !description) {
      return new NextResponse('Missing required fields: title and description are required', { status: 400 })
    }

    // Check if the user exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (!existingUser) {
      console.log('❌ User not found in database:', session.user.id)
      return NextResponse.json(
        { 
          error: 'Session expired or user not found', 
          message: 'Please sign out and sign back in to refresh your account.',
          code: 'USER_NOT_FOUND'
        },
        { status: 401 }
      )
    }

    console.log('✅ User found in database:', { id: existingUser.id, email: existingUser.email, role: existingUser.role })

    // Check company project creation limits (drafts + active)
    const allProjectsCount = await prisma.project.count({
      where: {
        companyId: session.user.id
      }
    })

    const projectCheck = canCompanyCreateProject(existingUser, allProjectsCount)
    if (!projectCheck.canCreate) {
      return NextResponse.json({
        error: projectCheck.reason || 'Project creation limit reached',
        upgradeRequired: projectCheck.upgradeRequired || null,
        currentPlan: existingUser.subscriptionPlan || 'FREE',
        code: 'CREATION_LIMIT_REACHED'
      }, { status: 403 })
    }

    // ALL projects start as DRAFT - companies must explicitly activate them
    const project = await prisma.project.create({
      data: {
        title,
        description,
        companyId: session.user.id,
        status: 'DRAFT', // Always start as draft
        compensation: compensation || null,
        location: location || null,
        remote: remote !== undefined ? remote : true,
        skillsRequired: skillsRequired || [],
        category,
        subcategory,
        teamSize: teamSize || 1,
        durationMonths: durationMonths || 3,
        experienceLevel: experienceLevel || 'High School',
        timeCommitment: timeCommitment || 'Part-time',
        requirements: requirements || [],
        deliverables: deliverables || []
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

    console.log('✅ Project created successfully:', project.id)
    return NextResponse.json(project)
  } catch (error) {
    console.error('❌ Error creating project:', error)
    // Return proper JSON error response
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
} 