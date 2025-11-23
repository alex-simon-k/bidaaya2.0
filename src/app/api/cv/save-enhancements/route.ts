import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

interface SaveRequest {
  opportunityId: string
  answers: Array<{
    questionId: string
    question: string
    answer: string
    category: string
    relevantFor: string[]
  }>
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body: SaveRequest = await request.json()
    const { opportunityId, answers } = body

    console.log('💾 Saving CV enhancements for user:', userId)

    // Save each answer as a CVEnhancement
    const savedEnhancements = await Promise.all(
      answers
        .filter(a => a.answer.trim().length > 0) // Only save non-empty answers
        .map(answer =>
          prisma.cVEnhancement.create({
            data: {
              userId,
              opportunityId,
              category: answer.category,
              question: answer.question,
              answer: answer.answer,
              relevantFor: answer.relevantFor,
            },
          })
        )
    )

    console.log(`✅ Saved ${savedEnhancements.length} enhancements`)

    return NextResponse.json({
      success: true,
      count: savedEnhancements.length,
      enhancements: savedEnhancements,
    })

  } catch (error: any) {
    console.error('❌ Save enhancements error:', error)
    return NextResponse.json({
      error: 'Failed to save enhancements',
      details: error.message,
    }, { status: 500 })
  }
}

