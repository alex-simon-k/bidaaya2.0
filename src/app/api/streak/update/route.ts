import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import { updateUserStreak } from '@/lib/streak'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const result = await updateUserStreak(prisma, userId)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 })
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Streak update error:', error)
    return NextResponse.json({
      error: 'Failed to update streak',
      details: error.message,
    }, { status: 500 })
  }
}

