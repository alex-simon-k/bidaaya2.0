import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { generatedCvId } = await request.json()

    if (!generatedCvId) {
      return NextResponse.json({ error: 'Missing generatedCvId' }, { status: 400 })
    }

    // 1. Fetch the CV record
    const cv = await prisma.generatedCV.findUnique({
      where: { id: generatedCvId },
    })

    if (!cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }

    if (cv.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 2. Check credits
    const EXTEND_COST = 2
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    })

    if (!user || user.credits < EXTEND_COST) {
      return NextResponse.json({
        error: 'Insufficient credits',
        required: EXTEND_COST,
        current: user?.credits || 0,
      }, { status: 402 })
    }

    // 3. Deduct credits
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: EXTEND_COST },
          lifetimeCreditsUsed: { increment: EXTEND_COST },
        },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount: -EXTEND_COST,
          type: 'spent',
          action: 'extend_cv',
          description: `Extended CV: ${cv.title}`,
          balanceBefore: user.credits,
          balanceAfter: user.credits - EXTEND_COST,
          relatedId: generatedCvId,
        },
      }),
      // 4. Update expiry
      prisma.generatedCV.update({
        where: { id: generatedCvId },
        data: {
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Set to 10 days from NOW
        },
      }),
    ])

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error extending CV:', error)
    return NextResponse.json({
      error: 'Failed to extend CV',
      details: error.message,
    }, { status: 500 })
  }
}

