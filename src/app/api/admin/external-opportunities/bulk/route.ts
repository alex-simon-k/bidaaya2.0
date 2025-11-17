import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH - Bulk update opportunities (activate/deactivate)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { ids, action } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Bulk update
    await prisma.externalOpportunity.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        isActive: action === 'activate'
      }
    })

    return NextResponse.json({
      success: true,
      message: `${ids.length} opportunities ${action}d`,
      updatedCount: ids.length
    })

  } catch (error) {
    console.error('Error in bulk update:', error)
    return NextResponse.json(
      { error: 'Failed to update opportunities' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Bulk delete opportunities
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.externalOpportunityApplication.deleteMany({
      where: { externalOpportunityId: { in: ids } }
    })

    await prisma.earlyAccessUnlock.deleteMany({
      where: { externalOpportunityId: { in: ids } }
    })

    await prisma.opportunityFeedback.deleteMany({
      where: { externalOpportunityId: { in: ids } }
    })

    // Now delete the opportunities
    const result = await prisma.externalOpportunity.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} opportunities deleted`,
      deletedCount: result.count
    })

  } catch (error) {
    console.error('Error in bulk delete:', error)
    return NextResponse.json(
      { error: 'Failed to delete opportunities' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
