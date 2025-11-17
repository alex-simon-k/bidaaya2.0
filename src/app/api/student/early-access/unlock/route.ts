import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import { CREDIT_COSTS, canAccessEarlyForFree } from '@/lib/credits'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { opportunityId, opportunityType } = body

    if (!opportunityId || !opportunityType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (opportunityType !== 'project' && opportunityType !== 'external') {
      return NextResponse.json(
        { error: 'Invalid opportunity type' },
        { status: 400 }
      )
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        credits: true,
        subscriptionPlan: true,
        lifetimeCreditsUsed: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already unlocked
    const existingUnlock = await prisma.earlyAccessUnlock.findUnique({
      where: {
        userId_opportunityId: {
          userId: session.user.id,
          opportunityId: opportunityId
        }
      }
    })

    if (existingUnlock) {
      return NextResponse.json({ 
        success: true, 
        alreadyUnlocked: true,
        message: 'Opportunity already unlocked'
      })
    }

    // Check if user has Pro plan (free early access)
    const hasProAccess = canAccessEarlyForFree(user.subscriptionPlan)
    const creditCost = CREDIT_COSTS.EARLY_ACCESS
    const userId = session.user.id // Store for type safety in transaction

    if (!hasProAccess) {
      // Check if user has enough credits
      if (user.credits < creditCost) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            required: creditCost,
            current: user.credits
          },
          { status: 402 }
        )
      }
    }

    // Create unlock record and update credits if needed
    await prisma.$transaction(async (tx) => {
      // Create unlock record
      await tx.earlyAccessUnlock.create({
        data: {
          userId: userId,
          opportunityId: opportunityId,
          opportunityType: opportunityType,
          projectId: opportunityType === 'project' ? opportunityId : null,
          externalOpportunityId: opportunityType === 'external' ? opportunityId : null,
          usedCredit: !hasProAccess
        }
      })

      if (!hasProAccess) {
        // Deduct credits and create transaction record
        const newBalance = user.credits - creditCost
        
        await tx.user.update({
          where: { id: userId },
          data: {
            credits: newBalance,
            lifetimeCreditsUsed: user.lifetimeCreditsUsed + creditCost
          }
        })

        await tx.creditTransaction.create({
          data: {
            userId: userId,
            type: 'spent',
            action: 'EARLY_ACCESS',
            amount: -creditCost,
            balanceBefore: user.credits,
            balanceAfter: newBalance,
            relatedId: opportunityId,
            description: `Unlocked early access to ${opportunityType} opportunity`
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      creditsSpent: hasProAccess ? 0 : creditCost,
      remainingCredits: hasProAccess ? user.credits : user.credits - creditCost,
      message: hasProAccess 
        ? 'Opportunity unlocked with Pro membership' 
        : `Opportunity unlocked for ${creditCost} credits`
    })

  } catch (error) {
    console.error('Error unlocking early access:', error)
    return NextResponse.json(
      { error: 'Failed to unlock opportunity' },
      { status: 500 }
    )
  }
}

