import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth-config'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Company access required' }, { status: 401 })
    }

    const body = await request.json()
    const { applicationIds } = body

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json({ error: 'Application IDs array is required' }, { status: 400 })
    }

    // Get company subscription
    const company = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check subscription permissions for bulk actions
    const subscriptionPlan = company.subscriptionPlan || 'FREE'
    const hasBulkActions = ['COMPANY_PREMIUM', 'COMPANY_PRO'].includes(subscriptionPlan)

    if (!hasBulkActions) {
      return NextResponse.json({ 
        error: 'Bulk actions require HR Booster or HR Agent subscription.' 
      }, { status: 403 })
    }

    // Update all applications to shortlisted
    const updateResult = await prisma.application.updateMany({
      where: { 
        id: { in: applicationIds }
      },
      data: { 
        status: 'SHORTLISTED',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Successfully shortlisted ${updateResult.count} candidates`, 
      shortlisted: updateResult.count 
    })

  } catch (error) {
    console.error('Bulk shortlist error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to shortlist candidates' 
    }, { status: 500 })
  }
} 