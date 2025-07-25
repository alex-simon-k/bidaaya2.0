import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { hasFeatureAccess } from '@/lib/pricing'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to external tracking feature
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!hasFeatureAccess(user.subscriptionPlan, 'external_tracking')) {
      return NextResponse.json({ 
        error: 'External application tracking requires Career Builder or Career Accelerator plan',
        upgradeRequired: true 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let where: any = { userId: session.user.id }
    
    if (status) {
      where.status = status
    }
    if (source) {
      where.source = source
    }

    const [externalApplications, totalCount] = await Promise.all([
      prisma.externalApplication.findMany({
        where,
        orderBy: { appliedDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.externalApplication.count({ where })
    ])

    return NextResponse.json({
      applications: externalApplications,
      totalCount,
      hasMore: offset + limit < totalCount
    })

  } catch (error) {
    console.error('Error fetching external applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to external tracking feature
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!hasFeatureAccess(user.subscriptionPlan, 'external_tracking')) {
      return NextResponse.json({ 
        error: 'External application tracking requires Career Builder or Career Accelerator plan',
        upgradeRequired: true 
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      company,
      jobTitle,
      jobUrl,
      location,
      salary,
      appliedDate,
      source,
      notes,
      contactPerson,
      contactEmail
    } = body

    if (!company || !jobTitle || !appliedDate) {
      return NextResponse.json({ 
        error: 'Company, job title, and applied date are required' 
      }, { status: 400 })
    }

    const externalApplication = await prisma.externalApplication.create({
      data: {
        userId: session.user.id,
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        jobUrl: jobUrl?.trim() || null,
        location: location?.trim() || null,
        salary: salary?.trim() || null,
        appliedDate: new Date(appliedDate),
        source: source?.trim() || null,
        notes: notes?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        status: 'APPLIED'
      }
    })

    // Update daily analytics
    await updateApplicationAnalytics(session.user.id, 'external')

    return NextResponse.json(externalApplication)

  } catch (error) {
    console.error('Error creating external application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateApplicationAnalytics(userId: string, type: 'bidaaya' | 'external') {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existingAnalytics = await prisma.applicationAnalytics.findUnique({
    where: {
      userId_date: {
        userId,
        date: today
      }
    }
  })

  if (existingAnalytics) {
    await prisma.applicationAnalytics.update({
      where: { id: existingAnalytics.id },
      data: {
        [type === 'bidaaya' ? 'bidaayaApplications' : 'externalApplications']: {
          increment: 1
        },
        updatedAt: new Date()
      }
    })
  } else {
    await prisma.applicationAnalytics.create({
      data: {
        userId,
        date: today,
        bidaayaApplications: type === 'bidaaya' ? 1 : 0,
        externalApplications: type === 'external' ? 1 : 0
      }
    })
  }
} 