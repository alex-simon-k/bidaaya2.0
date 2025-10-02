import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Track view of external opportunity (for analytics)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Increment view count
    await prisma.externalOpportunity.update({
      where: { id: params.id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    }).catch(() => {
      // Silent fail - analytics are not critical
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    // Silent fail for tracking
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

