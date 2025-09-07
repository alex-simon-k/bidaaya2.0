import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'
import { getCreditAllowance, getContactRevealContent } from '@/lib/pricing'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow companies to reveal contacts
    if (!session?.user || (session.user as any)?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Only companies can reveal contacts' }, { status: 401 })
    }

    const body = await request.json()
    const { candidateId, creditsToSpend } = body

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })
    }

    const userId = session.user.id
    const userPlan = (session.user as any).subscriptionPlan || 'FREE'
    
    // Get user's credit allowance and current usage
    const maxCredits = getCreditAllowance(userPlan)
    
    // Get actual credit usage from database (same method as /api/company/credits)
    const currentDate = new Date()
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    // Count contacts made this month (same logic as company/credits endpoint)
    const contactsThisMonth = await prisma.chatQuery.count({
      where: {
        userId: userId,
        query: {
          startsWith: 'CONTACT_STUDENT_'
        },
        timestamp: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    const remainingCredits = Math.max(0, maxCredits - contactsThisMonth)

    if (remainingCredits < (creditsToSpend || 1)) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        creditsRemaining: remainingCredits,
        maxCredits,
        message: `You have ${remainingCredits} credits remaining this month. Upgrade your plan for more credits.`
      }, { status: 402 })
    }

    // Get the candidate's contact information
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      select: { 
        id: true,
        name: true,
        email: true, 
        whatsapp: true,
        linkedin: true
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Get tier-appropriate contact information
    const revealedContent = getContactRevealContent(userPlan, candidate)

    // Record credit usage in database (same method as other credit tracking)
    await prisma.chatQuery.create({
      data: {
        userId: userId,
        query: `CONTACT_STUDENT_${candidateId}`,
        response: `Contact revealed for candidate: ${candidate.name}`,
        timestamp: new Date()
      }
    })

    const newRemainingCredits = remainingCredits - (creditsToSpend || 1)

    return NextResponse.json({
      success: true,
      data: {
        name: candidate.name,
        ...revealedContent
      },
      creditsRemaining: newRemainingCredits,
      maxCredits
    })

  } catch (error) {
    console.error('❌ Contact reveal error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reveal contact',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
} 