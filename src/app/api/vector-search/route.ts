import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { VectorMatchingService } from '@/lib/vector-matching-service'
import { UnifiedMatchingService } from '@/lib/unified-matching-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user?.role !== 'COMPANY') {
      return NextResponse.json(
        { error: 'Unauthorized - Companies only' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { searchQuery, searchType = 'hybrid', limit = 20, threshold = 0.6 } = body

    if (!searchQuery || typeof searchQuery !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    let result

    if (searchType === 'unified' || searchType === 'hybrid') {
      // Use the new unified matching system (recommended)
      result = await UnifiedMatchingService.searchTalent({
        companyId: session.user.id,
        searchPrompt: searchQuery,
        limit,
        threshold
      })
    } else if (searchType === 'vector') {
      // Legacy pure vector search
      const searchParams = {
        companyId: session.user.id,
        searchQuery,
        limit,
        threshold
      }
      result = await VectorMatchingService.searchTalentWithVectors(searchParams)
    } else {
      return NextResponse.json(
        { error: 'Invalid search type. Must be "unified", "hybrid", or "vector"' },
        { status: 400 }
      )
    }

    // Log the search for analytics
    console.log(`🔍 Vector search completed for company ${session.user.id}: "${searchQuery}"`)
    const resultCount = (result as any).vectorMatches?.length || (result as any).hybridMatches?.length || (result as any).matches?.length || 0
    console.log(`📊 Results: ${resultCount} matches`)

    return NextResponse.json({
      success: true,
      searchType,
      query: searchQuery,
      ...result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Vector search API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Vector search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallbackSuggestion: 'Try using hybrid search mode for better reliability'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return vector search capabilities and stats
    return NextResponse.json({
      vectorSearchEnabled: !!process.env.OPENAI_API_KEY,
      searchTypes: ['vector', 'hybrid'],
      defaultThreshold: 0.6,
      maxLimit: 50,
      embeddingModel: 'text-embedding-3-small',
      version: '1.0.0',
      capabilities: {
        profileMatching: true,
        skillsMatching: true,
        academicMatching: true,
        hybridSearch: true,
        confidenceLevels: true
      }
    })

  } catch (error) {
    console.error('❌ Vector search info API error:', error)
    return NextResponse.json(
      { error: 'Failed to get vector search info' },
      { status: 500 }
    )
  }
}
