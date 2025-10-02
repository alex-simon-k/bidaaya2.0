import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Bulk create external opportunities
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const { opportunities } = await request.json()

    if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) {
      return NextResponse.json({ error: 'No opportunities provided' }, { status: 400 })
    }

    const results = {
      success: [] as any[],
      failed: [] as any[]
    }

    // Process each opportunity
    for (const opp of opportunities) {
      try {
        // Validation
        if (!opp.title || !opp.company || !opp.applicationUrl) {
          results.failed.push({
            data: opp,
            error: 'Missing required fields: title, company, or applicationUrl'
          })
          continue
        }

        // Validate URL
        try {
          new URL(opp.applicationUrl)
        } catch (e) {
          results.failed.push({
            data: opp,
            error: 'Invalid application URL format'
          })
          continue
        }

        // Create opportunity
        const created = await prisma.externalOpportunity.create({
          data: {
            title: opp.title.trim(),
            company: opp.company.trim(),
            description: opp.description?.trim() || null,
            location: opp.location?.trim() || null,
            applicationUrl: opp.applicationUrl.trim(),
            source: opp.source?.trim() || null,
            category: opp.category?.trim() || null,
            experienceLevel: opp.experienceLevel?.trim() || null,
            remote: opp.remote || false,
            salary: opp.salary?.trim() || null,
            deadline: opp.deadline ? new Date(opp.deadline) : null,
            isPremium: opp.isPremium || false,
            adminNotes: opp.adminNotes?.trim() || null,
            addedBy: session.user.id,
            isActive: true
          }
        })

        results.success.push(created)

      } catch (error) {
        results.failed.push({
          data: opp,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      created: results.success.length,
      failed: results.failed.length,
      results
    })

  } catch (error) {
    console.error('Error bulk creating opportunities:', error)
    return NextResponse.json({ 
      error: 'Failed to bulk create opportunities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH - Bulk update opportunities (activate/deactivate)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const { ids, action, value } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'No action provided' }, { status: 400 })
    }

    const updateData: any = {}

    switch (action) {
      case 'activate':
        updateData.isActive = true
        break
      case 'deactivate':
        updateData.isActive = false
        break
      case 'setPremium':
        updateData.isPremium = value !== undefined ? value : true
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const result = await prisma.externalOpportunity.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: updateData
    }).catch(() => ({ count: 0 }))

    return NextResponse.json({
      success: true,
      updated: result.count
    })

  } catch (error) {
    console.error('Error bulk updating opportunities:', error)
    return NextResponse.json({ 
      error: 'Failed to bulk update opportunities' 
    }, { status: 500 })
  }
}

