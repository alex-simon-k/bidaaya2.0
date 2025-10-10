import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { companyEmail, action } = body

    if (!companyEmail) {
      return NextResponse.json({ 
        error: 'Company email is required' 
      }, { status: 400 })
    }

    // Find the company
    const company = await prisma.user.findFirst({
      where: {
        email: companyEmail,
        role: 'COMPANY'
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        profileCompleted: true,
        emailVerified: true,
        updatedAt: true,
        createdAt: true
      }
    })

    if (!company) {
      return NextResponse.json({ 
        error: 'Company not found' 
      }, { status: 404 })
    }

    // Get their projects
    const projects = await prisma.project.findMany({
      where: { companyId: company.id },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        currentApplications: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (action === 'refresh-session') {
      // Force a session refresh by updating the updatedAt timestamp
      const updatedCompany = await prisma.user.update({
        where: { id: company.id },
        data: {
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        message: 'Session refresh triggered',
        company: {
          ...company,
          updatedAt: updatedCompany.updatedAt
        },
        projects,
        instructions: [
          'Company should sign out completely',
          'Clear browser cache/cookies', 
          'Sign back in to get fresh session data'
        ]
      })
    }

    // Default: just return debug info
    return NextResponse.json({
      company,
      projects,
      debug: {
        hasSubscription: !!company.subscriptionPlan && company.subscriptionPlan !== 'FREE',
        isActive: company.subscriptionStatus === 'ACTIVE',
        profileComplete: company.profileCompleted,
        emailVerified: !!company.emailVerified,
        projectCount: projects.length,
        liveProjects: projects.filter(p => p.status === 'LIVE').length
      }
    })

  } catch (error) {
    console.error('❌ Error in company debug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
