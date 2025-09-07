import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Company access required' }, { status: 401 })
    }

    // Get user's subscription plan
    const userDetails = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true, role: true }
    })

    const userPlan = userDetails?.subscriptionPlan || 'FREE'
    
    // Define company credit limits (matching pricing page)
    const COMPANY_CREDIT_LIMITS = {
      'FREE': 10,              // Free Trial: 10 contacts/month
      'COMPANY_BASIC': 50,     // Company Basic: 50 contacts/month  
      'COMPANY_PREMIUM': 100,  // HR Booster: 100 contacts/month
      'COMPANY_PRO': 200       // HR Agent: 200 contacts/month
    }

    const creditLimit = COMPANY_CREDIT_LIMITS[userPlan as keyof typeof COMPANY_CREDIT_LIMITS] || 10

    // Count contacts made this month
    const currentDate = new Date()
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const contactsThisMonth = await prisma.chatQuery.count({
      where: {
        userId: session.user.id,
        query: {
          startsWith: 'CONTACT_STUDENT_'
        },
        timestamp: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    const remainingCredits = Math.max(0, creditLimit - contactsThisMonth)

    // Calculate next refresh date (first day of next month)
    const nextRefresh = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    
    return NextResponse.json({
      used: contactsThisMonth,
      remaining: remainingCredits,
      limit: creditLimit,
      plan: userPlan,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      nextRefresh: nextRefresh.toISOString(),
      refreshesIn: Math.ceil((nextRefresh.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) // Days until refresh
    })

  } catch (error) {
    console.error('❌ Error fetching company credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
