import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { AITalentMatcher } from '@/lib/ai-talent-matching'
import { getHigherTiers } from '@/lib/subscription'


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow companies to search
    if (!session?.user || (session.user as any)?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Only companies can search for talent' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, maxResults } = body

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Please provide a detailed search prompt (minimum 10 characters)' 
      }, { status: 400 })
    }

    console.log(`🔍 Company ${session.user.id} starting AI talent search`)
    console.log(`📝 Search prompt: "${prompt}"`)

    // Get user's subscription tier
    const user = session.user as any
    let tier = 'FREE'
    
    console.log(`🔍 User subscription data:`, user.subscriptionPlan)
    
    if (user.subscriptionPlan) {
      const subscription = user.subscriptionPlan
      if (subscription.includes('PROFESSIONAL') || subscription.includes('PRO')) {
        tier = 'PROFESSIONAL'
      } else if (subscription.includes('ENTERPRISE') || subscription.includes('AGENT')) {
        tier = 'ENTERPRISE'
      }
    }

    console.log(`💼 Company tier: ${tier}`)

    // Perform AI search
    const searchResults = await AITalentMatcher.searchTalent({
      prompt: prompt.trim(),
      companyId: session.user.id,
      tier: tier as any,
      maxResults
    })

    // Get full match data with student details
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const detailedMatches = await prisma.aIMatch.findMany({
      where: { searchId: searchResults.searchId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
            major: true,
            graduationYear: true,
            skills: true,
            bio: true,
            location: true,
            goal: true,
            interests: true,
            image: true
          }
        }
      },
      orderBy: { overallScore: 'desc' }
    })

    // Track tier-based analytics
    console.log(`✅ Search completed: ${detailedMatches.length} matches found`)
    console.log(`⏱️ Processing time: ${searchResults.processingTime}ms`)

    // Include tier information and upgrade prompts
    const tierLimits = {
      FREE: 3,
      PROFESSIONAL: 10,
      ENTERPRISE: 50
    }

    const upgradeAvailable = tier !== 'ENTERPRISE' ? {
      currentTier: tier,
      currentLimit: tierLimits[tier as keyof typeof tierLimits],
      availableTiers: getHigherTiers(
        tier === 'FREE' ? 'FREE' : tier === 'PROFESSIONAL' ? 'COMPANY_PRO' : 'COMPANY_PREMIUM', 
        'COMPANY'
      )
    } : null

    return NextResponse.json({
      success: true,
      data: {
        searchId: searchResults.searchId,
        matches: detailedMatches,
        metadata: {
          totalCandidatesEvaluated: searchResults.totalCandidatesEvaluated,
          processingTime: searchResults.processingTime,
          parsedIntent: searchResults.parsedIntent,
          tier,
          matchesFound: detailedMatches.length,
          maxAllowed: tierLimits[tier as keyof typeof tierLimits]
        },
        upgradeInfo: upgradeAvailable
      }
    })

  } catch (error) {
    console.error('❌ Error in AI talent search:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform talent search',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any)?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const searchId = searchParams.get('searchId')

    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    if (searchId) {
      // Get specific search results
      const matches = await prisma.aIMatch.findMany({
        where: { 
          searchId,
          search: { companyId: session.user.id }
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              university: true,
              major: true,
              graduationYear: true,
              skills: true,
              bio: true,
              location: true,
              goal: true,
              interests: true,
              image: true
            }
          },
          search: {
            select: {
              searchPrompt: true,
              searchTimestamp: true,
              parsedIntent: true
            }
          }
        },
        orderBy: { overallScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })

      return NextResponse.json({
        success: true,
        data: matches,
        pagination: {
          page,
          limit,
          hasMore: matches.length === limit
        }
      })
    } else {
      // Get search history
      const searches = await prisma.companySearch.findMany({
        where: { companyId: session.user.id },
        orderBy: { searchTimestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { matches: true }
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: searches,
        pagination: {
          page,
          limit,
          hasMore: searches.length === limit
        }
      })
    }

  } catch (error) {
    console.error('❌ Error fetching search data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search data' },
      { status: 500 }
    )
  }
} 
