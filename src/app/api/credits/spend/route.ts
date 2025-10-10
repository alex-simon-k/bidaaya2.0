import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, relatedId, description } = await request.json()
    if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })

    // Fetch pricing and user
    const [pricing, user] = await Promise.all([
      prisma.creditPricing.findFirst(),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true, lifetimeCreditsUsed: true } })
    ])

    if (!pricing || !user) return NextResponse.json({ error: 'Missing config or user' }, { status: 400 })

    const costMap: Record<string, number> = {
      internalApplication: pricing.internalApplication,
      companyProposal: pricing.companyProposal,
      customCV: pricing.customCV,
    }

    const cost = costMap[action]
    if (typeof cost !== 'number') return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    if (user.credits < cost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    const balanceBefore = user.credits
    const balanceAfter = user.credits - cost

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user!.id },
        data: { credits: balanceAfter, lifetimeCreditsUsed: (user.lifetimeCreditsUsed || 0) + cost },
      })

      await tx.creditTransaction.create({
        data: {
          userId: session.user!.id,
          type: 'spent',
          action,
          amount: -cost,
          balanceBefore,
          balanceAfter,
          relatedId: relatedId || null,
          description: description || null,
        },
      })

      return { balance: balanceAfter, spent: cost }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/credits/spend error:', error)
    return NextResponse.json({ error: 'Failed to spend credits' }, { status: 500 })
  }
}


