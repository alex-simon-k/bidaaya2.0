import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { companyId, subscriptionPlan } = body

    if (!companyId || !subscriptionPlan) {
      return NextResponse.json({ 
        error: 'Company ID and subscription plan are required' 
      }, { status: 400 })
    }

    // Valid paid tiers
    const validTiers = ['COMPANY_BASIC', 'COMPANY_PRO', 'COMPANY_PREMIUM']
    if (!validTiers.includes(subscriptionPlan)) {
      return NextResponse.json({ 
        error: `Invalid subscription plan. Must be one of: ${validTiers.join(', ')}` 
      }, { status: 400 })
    }

    // Update company subscription
    const updatedCompany = await prisma.user.update({
      where: { 
        id: companyId,
        role: 'COMPANY' // Ensure we're only updating companies
      },
      data: {
        subscriptionPlan: subscriptionPlan,
        subscriptionStatus: 'ACTIVE',
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      }
    })

    return NextResponse.json({
      message: `Successfully upgraded ${updatedCompany.companyName || updatedCompany.name} to ${subscriptionPlan}`,
      company: updatedCompany
    })

  } catch (error) {
    console.error('❌ Error upgrading company:', error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ 
        error: 'Company not found or is not a company account' 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to upgrade company subscription'
    }, { status: 500 })
  }
}

// GET endpoint to list all companies and their current subscription status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const companies = await prisma.user.findMany({
      where: { role: 'COMPANY' },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ companies })

  } catch (error) {
    console.error('❌ Error fetching companies:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch companies' 
    }, { status: 500 })
  }
} 