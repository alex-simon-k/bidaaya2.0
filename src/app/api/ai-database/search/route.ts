import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { AIDatabaseAnalyzer } from '@/lib/ai-database-analyzer'


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only allow COMPANY users to search students
    if (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only companies can search students' }, { status: 403 })
    }

    const body = await request.json()
    const { query, limit = 20 } = body

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Please provide a valid search query' 
      }, { status: 400 })
    }

    console.log(`🔍 Intelligent search by ${session.user.id}: "${query}"`)

    // Execute intelligent search
    const searchResults = await AIDatabaseAnalyzer.intelligentSearch(query.trim(), limit)

    console.log(`✅ Search completed: ${searchResults.students.length} students found`)

    return NextResponse.json({
      success: true,
      query: query.trim(),
      results: searchResults.students,
      matchCriteria: searchResults.matchCriteria,
      insights: searchResults.searchInsights,
      meta: {
        totalResults: searchResults.students.length,
        maxResults: limit,
        queryParsedAs: searchResults.matchCriteria.join(', '),
        searchTimestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Intelligent Search Error:', error)
    return NextResponse.json({ 
      error: 'Failed to search students',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only companies can access search' }, { status: 403 })
    }

    // Return search capabilities and suggestions
    return NextResponse.json({
      searchCapabilities: [
        'Natural language queries (e.g., "students in Dubai studying business")',
        'University-specific searches (e.g., "AUD computer science students")',
        'Skill-based matching (e.g., "programming and design skills")',
        'Location filtering (e.g., "UAE-based talent")',
        'Goal-oriented search (e.g., "looking for internships")',
        'Education level filtering (e.g., "undergraduate students")'
      ],
      exampleQueries: [
        "Business students at AUD interested in marketing internships",
        "Computer science graduates in Dubai with programming skills",
        "High school students in Sharjah looking for part-time work",
        "Design students with creative skills and portfolio experience",
        "Engineering students interested in startups and innovation"
      ],
      searchFields: [
        'university', 'major', 'skills', 'location', 
        'education', 'goal', 'interests', 'bio'
      ]
    })

  } catch (error) {
    console.error('❌ Search Info Error:', error)
    return NextResponse.json({ 
      error: 'Failed to retrieve search information'
    }, { status: 500 })
  }
} 
