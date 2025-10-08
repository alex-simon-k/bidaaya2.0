import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Fetch ALL opportunities (both internal projects and external opportunities)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch both internal projects and external opportunities in parallel
    const [projects, externalOpps] = await Promise.all([
      // Internal Bidaaya projects
      prisma.project.findMany({
        include: {
          company: {
            select: {
              id: true,
              companyName: true,
              image: true,
              industry: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // External opportunities
      prisma.externalOpportunity.findMany({
        include: {
          companyUser: {
            select: {
              id: true,
              companyName: true,
              image: true,
              industry: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { addedAt: 'desc' }
      })
    ])

    // Transform projects to unified format
    const internalOpportunities = projects.map(project => ({
      id: project.id,
      type: 'internal' as const,
      title: project.title,
      company: project.company.companyName || 'Unknown',
      companyId: project.companyId,
      companyData: project.company,
      description: project.description,
      location: project.location || null,
      url: `/dashboard/projects/${project.id}`,
      category: project.department || project.category || null,
      isActive: project.status === 'LIVE',
      addedAt: project.createdAt,
      applicationCount: project._count.applications,
      status: project.status
    }))

    // Transform external opps to unified format
    const externalOpportunities = externalOpps.map(opp => ({
      id: opp.id,
      type: 'external' as const,
      title: opp.title,
      company: opp.companyUser?.companyName || opp.company,
      companyId: opp.companyId,
      companyData: opp.companyUser,
      description: opp.description,
      location: opp.location,
      url: opp.applicationUrl,
      category: opp.category,
      isActive: opp.isActive,
      isPremium: opp.isPremium,
      addedAt: opp.addedAt,
      applicationCount: opp._count.applications
    }))

    // Combine and sort by date
    const allOpportunities = [...internalOpportunities, ...externalOpportunities]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

    // Calculate stats
    const stats = {
      total: allOpportunities.length,
      internal: internalOpportunities.length,
      external: externalOpportunities.length,
      active: allOpportunities.filter(o => o.isActive).length,
      unlinked: externalOpportunities.filter(o => !o.companyId).length,
      totalApplications: allOpportunities.reduce((sum, o) => sum + (o.applicationCount || 0), 0)
    }

    return NextResponse.json({
      opportunities: allOpportunities,
      stats
    })

  } catch (error) {
    console.error('Error fetching all opportunities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    )
  }
}

