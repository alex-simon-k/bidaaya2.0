import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { UnifiedMatchingService } from '@/lib/unified-matching-service'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized - Company or Admin access required' },
        { status: 401 }
      )
    }

    const projectId = params.id
    const body = await request.json()
    const { searchPrompt, autoShortlist = false, limit = 10, threshold = 70 } = body

    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: { id: true, companyName: true }
        },
        applications: {
          select: { id: true, status: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    if (session.user.role === 'COMPANY' && project.companyId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Can only shortlist for your own projects' },
        { status: 403 }
      )
    }

    console.log(`🎯 Unified shortlisting for project: ${project.title}`)
    console.log(`👥 Applications to evaluate: ${project.applications.length}`)
    
    if (project.applications.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
        message: 'No applications to shortlist yet',
        metadata: {
          projectId,
          applicationsCount: 0,
          shortlistedCount: 0
        }
      })
    }

    // Use unified matching for shortlisting
    const matchingResult = await UnifiedMatchingService.shortlistForProject({
      companyId: session.user.role === 'ADMIN' ? project.companyId : session.user.id,
      projectId,
      searchPrompt,
      limit,
      threshold
    })

    // If autoShortlist is enabled, automatically update application statuses
    if (autoShortlist && matchingResult.matches.length > 0) {
      const topMatches = matchingResult.matches
        .filter(match => match.recommendedAction === 'shortlist' || match.overallScore >= 80)
        .slice(0, 10) // Limit to top 10

      if (topMatches.length > 0) {
        // Update application statuses to SHORTLISTED
        await prisma.application.updateMany({
          where: {
            id: { in: topMatches.map(match => match.application?.id).filter(Boolean) },
            projectId
          },
          data: {
            status: 'SHORTLISTED',
            updatedAt: new Date()
          }
        })

        console.log(`✅ Auto-shortlisted ${topMatches.length} candidates for project ${projectId}`)
      }
    }

    // Get current shortlist count
    const shortlistedCount = await prisma.application.count({
      where: {
        projectId,
        status: 'SHORTLISTED'
      }
    })

    return NextResponse.json({
      success: true,
      matches: matchingResult.matches,
      metadata: {
        ...matchingResult.searchMetadata,
        projectId,
        projectTitle: project.title,
        companyName: project.company.companyName,
        applicationsCount: project.applications.length,
        shortlistedCount,
        autoShortlisted: autoShortlist,
        usesCreditSystem: false, // Shortlisting doesn't use credits
        recommendations: {
          shouldShortlist: matchingResult.matches.filter(m => m.recommendedAction === 'shortlist').length,
          shouldConsider: matchingResult.matches.filter(m => m.recommendedAction === 'consider').length,
          shouldReview: matchingResult.matches.filter(m => m.recommendedAction === 'review').length
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Unified shortlisting error:', error)
    
    return NextResponse.json(
      { 
        error: 'Shortlisting failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const projectId = params.id

    // Get project with current shortlist
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: { id: true, companyName: true }
        },
        applications: {
          where: { status: 'SHORTLISTED' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                university: true,
                major: true,
                skills: true,
                bio: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    if (session.user.role === 'COMPANY' && project.companyId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        companyName: project.company.companyName
      },
      shortlist: project.applications.map(app => ({
        applicationId: app.id,
        student: app.user,
        shortlistedAt: app.updatedAt,
        status: app.status
      })),
      count: project.applications.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error fetching shortlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shortlist' },
      { status: 500 }
    )
  }
}
