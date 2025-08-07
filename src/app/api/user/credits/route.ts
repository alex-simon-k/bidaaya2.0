import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

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
    
    // Get user's plan - default to FREE for students
    const userPlan = user.subscriptionPlan || 'FREE'
    const totalCredits = STUDENT_CREDIT_ALLOWANCES[userPlan as keyof typeof STUDENT_CREDIT_ALLOWANCES] || 5

    // For now, we'll track credits in a simple way
    // In production, you'd want a proper credits table
    let usedCredits = 0
    
    // Check if user has used any credits this month
    // This is a simplified approach - in production you'd have a credits_usage table
    
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

      // Simple credit tracking - in production you'd use a proper table
      let usedCredits = 0 // This would come from database
      
      if (usedCredits + amount > totalCredits) {
        return NextResponse.json({ 
          error: 'Insufficient credits',
          remaining: totalCredits - usedCredits,
          required: amount
        }, { status: 402 })
      }

      // In production, you'd record the credit usage here
      // await prisma.creditUsage.create({...})

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