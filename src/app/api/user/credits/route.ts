import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

// Student credit allowances based on subscription plan
const STUDENT_CREDIT_ALLOWANCES = {
  'FREE': 5,
  'STUDENT_PRO': 20,
  'STUDENT_PREMIUM': 50
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptionPlan: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only students can access credits
    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can access credits' }, { status: 403 })
    }

    const currentDate = new Date()
    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Get user's plan - default to FREE for students
    const userPlan = user.subscriptionPlan || 'FREE'
    const totalCredits = STUDENT_CREDIT_ALLOWANCES[userPlan as keyof typeof STUDENT_CREDIT_ALLOWANCES] || 5

    // Count actual proposals submitted this month
    const usedCredits = await prisma.chatQuery.count({
      where: {
        userId: session.user.id,
        query: {
          startsWith: 'PROPOSAL_TO_'
        },
        timestamp: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })
    
    const remainingCredits = Math.max(0, totalCredits - usedCredits)

    return NextResponse.json({
      remaining: remainingCredits,
      total: totalCredits,
      plan: userPlan,
      monthKey,
      usedThisMonth: usedCredits
    })

  } catch (error) {
    console.error('❌ Error fetching student credits:', error)
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, amount, type } = body

    if (action === 'spend') {
      // Spend credits (e.g., for sending a proposal)
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          subscriptionPlan: true,
          role: true
        }
      })

      if (!user || user.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Invalid user' }, { status: 403 })
      }

      const userPlan = user.subscriptionPlan || 'FREE'
      const totalCredits = STUDENT_CREDIT_ALLOWANCES[userPlan as keyof typeof STUDENT_CREDIT_ALLOWANCES] || 5

      // Count current proposals this month
      const currentDate = new Date()
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const usedCredits = await prisma.chatQuery.count({
        where: {
          userId: session.user.id,
          query: {
            startsWith: 'PROPOSAL_TO_'
          },
          timestamp: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })
      
      if (usedCredits + amount > totalCredits) {
        return NextResponse.json({ 
          error: 'Insufficient credits',
          remaining: totalCredits - usedCredits,
          required: amount
        }, { status: 402 })
      }

      const newRemaining = totalCredits - (usedCredits + amount)

      return NextResponse.json({
        success: true,
        remaining: newRemaining,
        total: totalCredits,
        spent: amount,
        type
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ Error processing credit transaction:', error)
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 })
  }
} 
