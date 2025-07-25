import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"'

const prisma = new PrismaClient()

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    // Only admins can reset monthly counts
    if (!session || !session.user || session.user.role?.toUpperCase() !== 'ADMIN') {
      return new NextResponse('Unauthorized - Admin access required', { status: 401 })
    }

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Reset monthly application counts for all users
    const result = await prisma.user.updateMany({
      where: {
        lastMonthlyReset: {
          lt: firstOfMonth
        }
      },
      data: {
        applicationsThisMonth: 0,
        lastMonthlyReset: now
      }
    })

    console.log(`✅ Reset monthly applications for ${result.count} users`)

    return NextResponse.json({
      success: true,
      usersUpdated: result.count,
      resetDate: now.toISOString()
    })
  } catch (error) {
    console.error('❌ Error resetting monthly counts:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// Get stats on users who need reset
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Only admins can view reset stats
    if (!session || !session.user || session.user.role?.toUpperCase() !== 'ADMIN') {
      return new NextResponse('Unauthorized - Admin access required', { status: 401 })
    }

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const usersNeedingReset = await prisma.user.count({
      where: {
        lastMonthlyReset: {
          lt: firstOfMonth
        }
      }
    })

    const totalUsers = await prisma.user.count()

    return NextResponse.json({
      totalUsers,
      usersNeedingReset,
      currentMonth: now.toISOString().slice(0, 7), // YYYY-MM format
      lastResetCutoff: firstOfMonth.toISOString()
    })
  } catch (error) {
    console.error('❌ Error getting reset stats:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 