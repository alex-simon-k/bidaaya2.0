import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    console.log(`🧪 TEST: Updating user ${session.user.id} to plan ${planId}`)

    // Test subscription update
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionPlan: planId as any,
        subscriptionStatus: 'ACTIVE' as any,
      }
    })

    console.log(`✅ TEST SUCCESS: User updated`, {
      id: updatedUser.id,
      email: updatedUser.email,
      subscriptionPlan: updatedUser.subscriptionPlan,
      subscriptionStatus: updatedUser.subscriptionStatus
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionStatus: updatedUser.subscriptionStatus
      }
    })

  } catch (error) {
    console.error('❌ TEST ERROR:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
} 