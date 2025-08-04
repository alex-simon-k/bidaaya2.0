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
    const userPlan = (session.user as any).subscriptionPlan || 'company_free'
    
    // Get user's credit allowance and current usage
    const maxCredits = getCreditAllowance(userPlan)
    
    // For now, we'll use a simple approach with session storage
    // In production, you'd want to track this in the database
    // Get the user's current credit usage (this would be stored in DB)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        // Add a credits field to track usage if it doesn't exist
        // For now, we'll simulate this
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For this implementation, we'll use a simple counter approach
    // In a real app, you'd track monthly credit usage in the database
    const currentDate = new Date()
    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`
    
    // Get current month's usage using a simple user-based approach
    // This would normally be stored in the database
    // For now, we'll check if they've used any credits this month
    
    // Simple credit tracking: each user gets their monthly allowance
    // We'll track usage by creating simple records (this is a temporary solution)
    let usedCredits = 0
    
    // In a real implementation, you'd query a credits_usage table:
    // const usage = await prisma.creditUsage.aggregate({
    //   where: { 
    //     userId,
    //     month: monthKey
    //   },
    //   _sum: { amount: true }
    // })
    // usedCredits = usage._sum.amount || 0

    const remainingCredits = maxCredits - usedCredits

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

    // In a real app, you'd increment the credit usage here
    // await prisma.creditUsage.create({
    //   data: {
    //     userId,
    //     amount: creditsToSpend || 1,
    //     type: 'CONTACT_REVEAL',
    //     candidateId,
    //     month: monthKey
    //   }
    // })

    // For now, we'll simulate the credit deduction
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