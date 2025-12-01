import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import { updateUserStreak } from '@/lib/streak'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

// POST - Track application to external opportunity (NO CREDITS CONSUMED)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized - Students only' }, { status: 401 })
    }

    // Check if user has completed Phase II (CV Builder minimum requirements)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: {
            cvEducation: true,
            cvExperience: true,
            cvSkills: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Enforce Phase II completion: Must have (Education OR Experience) AND Skills
    const hasEducation = user._count.cvEducation > 0
    const hasExperience = user._count.cvExperience > 0
    const hasSkills = user._count.cvSkills > 0
    const isPhase2Complete = (hasEducation || hasExperience) && hasSkills

    if (!isPhase2Complete) {
      return NextResponse.json({ 
        error: 'Please complete your CV profile before applying to opportunities',
        code: 'PHASE_2_INCOMPLETE',
        redirectTo: '/dashboard?cv_edit=true'
      }, { status: 403 })
    }

    // Notes are optional - some clients may not send a JSON body
    let notes: string | undefined = undefined
    try {
      const body = await request.json().catch(() => null)
      if (body && typeof body.notes === 'string') {
        notes = body.notes
      }
    } catch {
      notes = undefined
    }

    // Check if opportunity exists
    const opportunity = await prisma.externalOpportunity.findUnique({
      where: { id: params.id }
    }).catch(() => null)

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    if (!opportunity.isActive) {
      return NextResponse.json({ error: 'This opportunity is no longer active' }, { status: 400 })
    }

    // Check if already applied
    const existingApplication = await prisma.externalOpportunityApplication.findUnique({
      where: {
        userId_externalOpportunityId: {
          userId: session.user.id,
          externalOpportunityId: params.id
        }
      }
    }).catch(() => null)

    if (existingApplication) {
      return NextResponse.json({ 
        error: 'You have already applied to this opportunity',
        alreadyApplied: true
      }, { status: 400 })
    }

    // Create application record (NO CREDITS CONSUMED - this is just tracking)
    const application = await prisma.externalOpportunityApplication.create({
      data: {
        userId: session.user.id,
        externalOpportunityId: params.id,
        notes: notes?.trim() || null
      }
    }).catch((error) => {
      console.error('Database error creating application:', error)
      throw new Error('Failed to track application')
    })

    // Increment click count for analytics
    await prisma.externalOpportunity.update({
      where: { id: params.id },
      data: {
        clickCount: {
          increment: 1
        }
      }
    }).catch(() => {
      // Silent fail - analytics are not critical
    })

    // Attempt to update streak server-side so any application counts
    const streakResult = await updateUserStreak(prisma, session.user.id).catch((err) => {
      console.error('Failed to auto-update streak after application:', err)
      return null
    })

    return NextResponse.json({
      success: true,
      application,
      applicationUrl: opportunity.applicationUrl,
      message: 'Application tracked successfully. You will be redirected to the company website.',
      streak: streakResult?.success ? streakResult.streak : undefined,
      longestStreak: streakResult?.success ? streakResult.longestStreak : undefined,
    })

  } catch (error) {
    console.error('Error tracking external opportunity application:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to track application' 
    }, { status: 500 })
  }
}

