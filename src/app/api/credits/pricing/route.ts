import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const pricing = await prisma.creditPricing.findFirst()
    return NextResponse.json(pricing)
  } catch (error) {
    console.error('GET /api/credits/pricing error:', error)
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Ensure a pricing row exists
    let pricing = await prisma.creditPricing.findFirst()
    if (!pricing) {
      pricing = await prisma.creditPricing.create({ data: {} })
    }

    const updated = await prisma.creditPricing.update({
      where: { id: pricing.id },
      data: { ...data, updatedBy: session.user.id },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/credits/pricing error:', error)
    return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 })
  }
}


