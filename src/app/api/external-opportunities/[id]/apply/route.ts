import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

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

    const { notes } = await request.json()

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

    return NextResponse.json({
      success: true,
      application,
      applicationUrl: opportunity.applicationUrl,
      message: 'Application tracked successfully. You will be redirected to the company website.'
    })

  } catch (error) {
    console.error('Error tracking external opportunity application:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to track application' 
    }, { status: 500 })
  }
}

