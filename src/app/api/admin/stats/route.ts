import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic'

// GET - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Calculate date ranges
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get statistics
    const [
      totalUsers,
      totalCompanies,
      totalStudents,
      totalAdmins,
      newUsersThisWeek,
      activeUsersThisWeek,
      totalExternalOpportunities,
      totalInternalOpportunities,
      activeExternalOpportunities,
      pendingInternalOpportunities,
      totalApplications,
      applicationsThisWeek,
      applicationsThisMonth,
      earlyAccessOpportunities
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total companies
      prisma.user.count({
        where: { role: 'COMPANY' }
      }),
      
      // Total students
      prisma.user.count({
        where: { role: 'STUDENT' }
      }),

      // Total admins
      prisma.user.count({
        where: { role: 'ADMIN' }
      }),
      
      // New users this week
      prisma.user.count({
        where: {
          createdAt: {
            gte: weekAgo
          }
        }
      }),
      
      // Active users this week
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: weekAgo
          }
        }
      }),

      // External opportunities
      prisma.externalOpportunity.count().catch(() => 0),

      // Internal opportunities (projects)
      prisma.project.count().catch(() => 0),

      // Active external opportunities
      prisma.externalOpportunity.count({
        where: { isActive: true }
      }).catch(() => 0),

      // Pending internal opportunities
      prisma.project.count({
        where: { status: 'PENDING_APPROVAL' }
      }).catch(() => 0),

      // Total applications (both external and internal)
      Promise.all([
        prisma.externalOpportunityApplication.count().catch(() => 0),
        prisma.application.count().catch(() => 0)
      ]).then(([ext, int]) => ext + int),

      // Applications this week
      Promise.all([
        prisma.externalOpportunityApplication.count({
          where: { appliedAt: { gte: weekAgo } }
        }).catch(() => 0),
        prisma.application.count({
          where: { createdAt: { gte: weekAgo } }
        }).catch(() => 0)
      ]).then(([ext, int]) => ext + int),

      // Applications this month
      Promise.all([
        prisma.externalOpportunityApplication.count({
          where: { appliedAt: { gte: monthAgo } }
        }).catch(() => 0),
        prisma.application.count({
          where: { createdAt: { gte: monthAgo } }
        }).catch(() => 0)
      ]).then(([ext, int]) => ext + int),

      // Early access opportunities (active and expiring soon)
      prisma.externalOpportunity.findMany({
        where: {
          isNewOpportunity: true,
          earlyAccessUntil: {
            gte: now
          }
        },
        select: {
          id: true,
          earlyAccessUntil: true
        }
      }).catch(() => [])
    ])

    // Calculate early access stats
    const expiringSoonThreshold = new Date(now.getTime() + 6 * 60 * 60 * 1000) // 6 hours
    const expiringSoon = earlyAccessOpportunities.filter(
      opp => opp.earlyAccessUntil && new Date(opp.earlyAccessUntil) <= expiringSoonThreshold
    ).length

    return NextResponse.json({
      users: {
        total: totalUsers,
        students: totalStudents,
        companies: totalCompanies,
        admins: totalAdmins,
        newThisWeek: newUsersThisWeek,
        activeThisWeek: activeUsersThisWeek
      },
      opportunities: {
        total: totalExternalOpportunities + totalInternalOpportunities,
        external: totalExternalOpportunities,
        internal: totalInternalOpportunities,
        active: activeExternalOpportunities,
        pending: pendingInternalOpportunities
      },
      applications: {
        total: totalApplications,
        thisWeek: applicationsThisWeek,
        thisMonth: applicationsThisMonth
      },
      earlyAccess: {
        active: earlyAccessOpportunities.length,
        expiringSoon: expiringSoon
      }
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
