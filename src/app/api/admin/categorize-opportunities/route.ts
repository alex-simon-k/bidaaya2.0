import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import { batchCategorizeOpportunities } from '@/lib/ai-opportunity-matcher'

const prisma = new PrismaClient()

export const maxDuration = 300 // 5 minutes for long-running categorization

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { mode, limit } = await request.json()

    // Fetch opportunities to categorize
    const opportunities = await prisma.externalOpportunity.findMany({
      where: mode === 'uncategorized' ? {
        aiLastCategorized: null,
        isActive: true
      } : {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        location: true
      },
      take: limit || 100,
      orderBy: { addedAt: 'desc' }
    })

    console.log(`📊 Starting AI categorization of ${opportunities.length} opportunities...`)

    // Map opportunities to correct format (convert null to undefined for TypeScript)
    const opportunitiesToCategorize = opportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      company: opp.company,
      description: opp.description || undefined,
      location: opp.location || undefined
    }))

    // Batch categorize using AI
    const results = await batchCategorizeOpportunities(
      opportunitiesToCategorize,
      (current, total, title) => {
        console.log(`Progress: ${current}/${total} - ${title}`)
      }
    )

    // Update database with categorizations
    const updatePromises = results.map(result => {
      if (result.success) {
        return prisma.externalOpportunity.update({
          where: { id: result.id },
          data: {
            aiCategory: result.categorization.category,
            aiMatchKeywords: result.categorization.matchKeywords,
            aiIndustryTags: result.categorization.industryTags,
            aiSkillsRequired: result.categorization.skillsRequired,
            aiEducationMatch: result.categorization.educationMatch,
            aiConfidenceScore: result.categorization.confidenceScore,
            aiLastCategorized: new Date(),
            aiModel: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4'
          }
        })
      }
      return Promise.resolve(null)
    })

    await Promise.all(updatePromises)

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`✅ Categorization complete: ${successCount} success, ${failureCount} failures`)

    return NextResponse.json({
      success: true,
      total: opportunities.length,
      successful: successCount,
      failed: failureCount,
      results: results.slice(0, 10) // Return first 10 for preview
    })

  } catch (error) {
    console.error('Error in categorization:', error)
    return NextResponse.json(
      { error: 'Failed to categorize opportunities', details: (error as Error).message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET endpoint to check categorization status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [total, categorized, uncategorized] = await Promise.all([
      prisma.externalOpportunity.count({ where: { isActive: true } }),
      prisma.externalOpportunity.count({ 
        where: { 
          isActive: true,
          aiLastCategorized: { not: null }
        } 
      }),
      prisma.externalOpportunity.count({ 
        where: { 
          isActive: true,
          aiLastCategorized: null
        } 
      })
    ])

    return NextResponse.json({
      total,
      categorized,
      uncategorized,
      percentage: total > 0 ? Math.round((categorized / total) * 100) : 0
    })

  } catch (error) {
    console.error('Error fetching categorization status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

