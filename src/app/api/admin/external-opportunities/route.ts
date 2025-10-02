import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - List all external opportunities with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let where: any = {}

    if (category && category !== 'all') {
      where.category = category
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [opportunities, totalCount] = await Promise.all([
      prisma.externalOpportunity.findMany({
        where,
        include: {
          admin: {
            select: {
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { addedAt: 'desc' },
        take: limit,
        skip: offset
      }).catch(() => []), // Graceful fallback if model doesn't exist yet
      prisma.externalOpportunity.count({ where }).catch(() => 0)
    ])

    return NextResponse.json({
      opportunities,
      totalCount,
      hasMore: offset + limit < totalCount
    })

  } catch (error) {
    console.error('Error fetching external opportunities:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch opportunities',
      opportunities: [],
      totalCount: 0
    }, { status: 500 })
  }
}

// POST - Create a new external opportunity
export async function POST(request: NextRequest) {
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
      adminNotes
    } = body

    // Validation
    if (!title || !company || !applicationUrl) {
      return NextResponse.json({ 
        error: 'Title, company, and application URL are required' 
      }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(applicationUrl)
    } catch (e) {
      return NextResponse.json({ 
        error: 'Invalid application URL format' 
      }, { status: 400 })
    }

    const opportunity = await prisma.externalOpportunity.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        applicationUrl: applicationUrl.trim(),
        source: source?.trim() || null,
        category: category?.trim() || null,
        experienceLevel: experienceLevel?.trim() || null,
        remote: remote || false,
        salary: salary?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        isPremium: isPremium || false,
        adminNotes: adminNotes?.trim() || null,
        addedBy: session.user.id,
        isActive: true
      },
      include: {
        admin: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }).catch((error) => {
      console.error('Database error creating opportunity:', error)
      throw new Error('Database operation failed - schema may need migration')
    })

    return NextResponse.json({
      success: true,
      opportunity
    })

  } catch (error) {
    console.error('Error creating external opportunity:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create opportunity' 
    }, { status: 500 })
  }
}

// DELETE - Delete multiple opportunities
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const result = await prisma.externalOpportunity.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    }).catch(() => ({ count: 0 }))

    return NextResponse.json({
      success: true,
      deleted: result.count
    })

  } catch (error) {
    console.error('Error deleting opportunities:', error)
    return NextResponse.json({ 
      error: 'Failed to delete opportunities' 
    }, { status: 500 })
  }
}

