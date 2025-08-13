import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count total applications for this user
    const count = await prisma.application.count({
      where: {
        userId: session.user?.id
      }
    })

    return NextResponse.json({ count })

  } catch (error) {
    console.error('Error counting applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
