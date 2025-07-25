import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { 
  checkAndTriggerShortlisting, 
  getShortlistingEligibility,
  manualShortlist 
} from '@/lib/ai-recruitment'

const prisma = new PrismaClient()

// GET - Get shortlisted candidates or eligibility status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Companies only' }, { status: 401 })
    }

    const projectId = params.id

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { companyId: true, title: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.companyId !== session.user.id) {
      return NextResponse.json({ error: 'You can only view shortlists for your own projects' }, { status: 403 })
    }

    // Get shortlisting eligibility
    const eligibility = await getShortlistingEligibility(projectId)

    if (!eligibility.eligible) {
      return NextResponse.json({
        eligible: false,
        eligibility,
        message: `Need ${eligibility.remainingNeeded} more applications to enable AI shortlisting`,
        shortlist: null
      })
    }

    // Check and get shortlist
    const shortlistResult = await checkAndTriggerShortlisting(projectId)

    return NextResponse.json({
      eligible: true,
      eligibility,
      shortlist: shortlistResult,
      message: shortlistResult ? 'AI shortlist ready' : 'Generating shortlist...'
    })

  } catch (error) {
    console.error('❌ Error fetching shortlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shortlist' },
      { status: 500 }
    )
  }
}

// POST - Trigger manual shortlisting or re-run AI shortlisting
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Companies only' }, { status: 401 })
    }

    const projectId = params.id
    const body = await request.json()
    const { action, candidateIds } = body

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: { subscriptionPlan: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.companyId !== session.user.id) {
      return NextResponse.json({ error: 'You can only manage shortlists for your own projects' }, { status: 403 })
    }

    let result;

    switch (action) {
      case 'generate':
        // Trigger AI shortlisting
        const eligibility = await getShortlistingEligibility(projectId)
        
        if (!eligibility.eligible) {
          return NextResponse.json({
            error: `Cannot generate shortlist yet. Need ${eligibility.remainingNeeded} more applications.`,
            eligibility
          }, { status: 400 })
        }

        result = await checkAndTriggerShortlisting(projectId)
        
        if (!result) {
          return NextResponse.json({
            error: 'Failed to generate shortlist. Please try again.',
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: `🎯 AI shortlist generated! Selected top ${result.shortlistedCount} candidates from ${result.totalApplications} applications.`,
          shortlist: result
        })

      case 'manual_override':
        // Manual shortlisting (for premium users)
        if (!candidateIds || !Array.isArray(candidateIds)) {
          return NextResponse.json({
            error: 'candidateIds array is required for manual shortlisting'
          }, { status: 400 })
        }

        // Check if user has permission for manual override
        const isPremium = project.company.subscriptionPlan === 'COMPANY_PREMIUM'
        if (!isPremium) {
          return NextResponse.json({
            error: 'Manual shortlisting requires Premium subscription',
            upgradeRequired: 'COMPANY_PREMIUM'
          }, { status: 403 })
        }

        result = await manualShortlist(projectId, candidateIds, session.user.id)

    return NextResponse.json({
          success: true,
          message: `✅ Manual shortlist updated! Selected ${candidateIds.length} candidates.`,
          shortlist: result
        })

      default:
        return NextResponse.json({
          error: 'Invalid action. Use "generate" or "manual_override"'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error managing shortlist:', error)
    return NextResponse.json(
      { 
        error: 'Failed to manage shortlist',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 