import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

// GET - Browse external opportunities (student-facing)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const remote = searchParams.get('remote')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's subscription plan for premium access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true, role: true }
    })

    const isPro = user?.subscriptionPlan === 'STUDENT_PRO'
    const isStudent = user?.role === 'STUDENT'

    let where: any = {
      isActive: true
    }

    // Premium access logic: STUDENT_PRO users see all, others see non-premium or old premium opportunities
    if (!isPro && isStudent) {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      where.OR = [
        { isPremium: false },
        { 
          isPremium: true,
          addedAt: { lte: twoDaysAgo } // Show premium opportunities after 2 days
        }
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (remote === 'true') {
      where.remote = true
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const [opportunities, totalCount] = await Promise.all([
      prisma.externalOpportunity.findMany({
        where,
        select: {
          id: true,
          title: true,
          company: true,
          description: true,
          location: true,
          applicationUrl: true,
          category: true,
          experienceLevel: true,
          remote: true,
          salary: true,
          deadline: true,
          isPremium: true,
          addedAt: true,
          viewCount: true,
          clickCount: true,
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: [
          { isPremium: 'desc' },
          { addedAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }).catch(() => []),
      prisma.externalOpportunity.count({ where }).catch(() => 0)
    ])

    // Check which opportunities the user has already applied to
    let appliedOpportunityIds: string[] = []
    if (isStudent) {
      const applications = await prisma.externalOpportunityApplication.findMany({
        where: {
          userId: session.user.id,
          externalOpportunityId: {
            in: opportunities.map(o => o.id)
          }
        },
        select: { externalOpportunityId: true }
      }).catch(() => [])

      appliedOpportunityIds = applications.map(a => a.externalOpportunityId)
    }

    // Add hasApplied flag to each opportunity
    const opportunitiesWithStatus = opportunities.map(opp => ({
      ...opp,
      hasApplied: appliedOpportunityIds.includes(opp.id),
      applicationCount: opp._count?.applications || 0
    }))

    return NextResponse.json({
      opportunities: opportunitiesWithStatus,
      totalCount,
      hasMore: offset + limit < totalCount,
      isPro
    })

  } catch (error) {
    console.error('Error fetching external opportunities:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch opportunities',
      opportunities: [],
      totalCount: 0
    }, { status: 500 })
  }
}

