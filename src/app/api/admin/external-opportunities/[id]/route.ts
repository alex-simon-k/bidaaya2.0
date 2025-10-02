import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get single opportunity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const opportunity = await prisma.externalOpportunity.findUnique({
      where: { id: params.id },
      include: {
        admin: {
          select: {
            name: true,
            email: true
          }
        },
        applications: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                university: true,
                major: true
              }
            }
          },
          orderBy: { appliedAt: 'desc' }
        }
      }
    }).catch(() => null)

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    return NextResponse.json({ opportunity })

  } catch (error) {
    console.error('Error fetching opportunity:', error)
    return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 })
  }
}

// PATCH - Update opportunity
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      company,
      description,
      location,
      applicationUrl,
      source,
      category,
      experienceLevel,
      remote,
      salary,
      deadline,
      isPremium,
      isActive,
      adminNotes
    } = body

    // Validate URL if provided
    if (applicationUrl) {
      try {
        new URL(applicationUrl)
      } catch (e) {
        return NextResponse.json({ 
          error: 'Invalid application URL format' 
        }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (company !== undefined) updateData.company = company.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (location !== undefined) updateData.location = location?.trim() || null
    if (applicationUrl !== undefined) updateData.applicationUrl = applicationUrl.trim()
    if (source !== undefined) updateData.source = source?.trim() || null
    if (category !== undefined) updateData.category = category?.trim() || null
    if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel?.trim() || null
    if (remote !== undefined) updateData.remote = remote
    if (salary !== undefined) updateData.salary = salary?.trim() || null
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null
    if (isPremium !== undefined) updateData.isPremium = isPremium
    if (isActive !== undefined) updateData.isActive = isActive
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes?.trim() || null

    const opportunity = await prisma.externalOpportunity.update({
      where: { id: params.id },
      data: updateData,
      include: {
        admin: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }).catch((error) => {
      console.error('Database error updating opportunity:', error)
      throw new Error('Failed to update opportunity')
    })

    return NextResponse.json({
      success: true,
      opportunity
    })

  } catch (error) {
    console.error('Error updating opportunity:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update opportunity' 
    }, { status: 500 })
  }
}

// DELETE - Delete single opportunity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    await prisma.externalOpportunity.delete({
      where: { id: params.id }
    }).catch((error) => {
      console.error('Database error deleting opportunity:', error)
      throw new Error('Failed to delete opportunity')
    })

    return NextResponse.json({
      success: true,
      message: 'Opportunity deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting opportunity:', error)
    return NextResponse.json({ 
      error: 'Failed to delete opportunity' 
    }, { status: 500 })
  }
}

