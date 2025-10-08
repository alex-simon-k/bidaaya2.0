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

    // Get statistics
    const [
      totalUsers,
      totalCompanies,
      totalStudents,
      newUsersThisWeek,
      activeUsersThisWeek
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
      
      // New users this week
      prisma.user.count({
        where: {
          createdAt: {
            gte: weekAgo
          }
        }
      }),
      
      // Active users this week (those with lastActiveAt in the past week)
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: weekAgo
          }
        }
      })
    ])

    return NextResponse.json({
      totalUsers,
      totalCompanies,
      totalStudents,
      newUsersThisWeek,
      activeUsersThisWeek
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
