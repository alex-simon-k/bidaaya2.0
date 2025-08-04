import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { StudentProcessingEngine } from '@/lib/student-processing-engine'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only allow COMPANY and ADMIN users to search students
    if (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only companies can search students' }, { status: 403 })
    }

    const body = await request.json()
    const { query, limit = 20, filters = {} } = body

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Please provide a valid search query (minimum 2 characters)' 
      }, { status: 400 })
    }

    console.log(`🎯 Intelligent search by ${session.user.id}: "${query}"`)

    // Build matching criteria
    const matchingCriteria = {
      query: query.trim(),
      ...filters
    }

    // Execute intelligent matching
    const matchResults = await StudentProcessingEngine.matchStudents(matchingCriteria, limit)

    console.log(`✅ Search completed: ${matchResults.length} students matched`)

    // Format results for frontend
    const formattedResults = matchResults.map(result => ({
      student: {
        id: result.student.id,
        name: result.student.name,
        email: result.student.email,
        university: result.student.university,
        major: result.student.major,
        skills: result.student.skills,
        location: result.student.location,
        graduationYear: result.student.graduationYear,
        interests: result.student.interests,
        goals: result.student.goals,
        activityScore: result.student.activityScore,
        lastActiveDate: result.student.lastActiveDate,
        applicationCount: result.student.applicationCount,
        profileCompleteness: result.student.profileCompleteness
      },
      matching: {
        score: result.matchScore,
        reasons: result.matchReasons,
        activityBonus: result.activityBonus,
        keywordMatches: result.keywordMatches,
        overallRating: result.matchScore >= 70 ? 'excellent' : 
                      result.matchScore >= 50 ? 'good' : 
                      result.matchScore >= 30 ? 'fair' : 'poor'
      }
    }))

    return NextResponse.json({
      success: true,
      query: query.trim(),
      results: formattedResults,
      meta: {
        totalResults: matchResults.length,
        maxResults: limit,
        searchType: 'intelligent_matching',
        processingTime: 'instant',
        searchTimestamp: new Date().toISOString(),
        averageMatchScore: formattedResults.length > 0 
          ? Math.round(formattedResults.reduce((sum, r) => sum + r.matching.score, 0) / formattedResults.length)
          : 0
      },
      insights: generateSearchInsights(query, formattedResults)
    })

  } catch (error) {
    console.error('❌ Intelligent Search Error:', error)
    return NextResponse.json({ 
      error: 'Failed to search students',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateSearchInsights(query: string, results: any[]): string[] {
  const insights = []
  
  if (results.length === 0) {
    insights.push('No students found matching your criteria')
    insights.push('Try using broader search terms or different keywords')
    insights.push('Consider searching for related skills or different locations')
  } else {
    insights.push(`Found ${results.length} students matching your search`)
    
    const avgScore = results.reduce((sum, r) => sum + r.matching.score, 0) / results.length
    if (avgScore >= 70) {
      insights.push('High quality matches found - excellent alignment with your criteria')
    } else if (avgScore >= 50) {
      insights.push('Good matches found - students align well with your requirements')
    } else {
      insights.push('Consider refining your search criteria for better matches')
    }
    
    // Activity insights
    const activeStudents = results.filter(r => r.student.activityScore > 60).length
    if (activeStudents > 0) {
      insights.push(`${activeStudents} students are highly active on the platform`)
    }
    
    // Location insights
    const locationCounts = results.reduce((acc: { [key: string]: number }, r) => {
      const loc = r.student.location || 'Unknown'
      acc[loc] = (acc[loc] || 0) + 1
      return acc
    }, {})
    
    const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]
    if (topLocation) {
      insights.push(`Most students are located in ${topLocation[0]}`)
    }
  }
  
  return insights
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

    // Return search capabilities and example queries
    return NextResponse.json({
      searchCapabilities: [
        'Natural language queries (e.g., "business students in Dubai interested in marketing")',
        'University-specific searches (e.g., "AUD computer science students")',
        'Skill-based matching with intelligent scoring',
        'Location filtering and regional preferences',
        'Experience level and graduation year filtering',
        'Activity-based ranking (recent activity, application history)',
        'Profile completeness scoring'
      ],
      exampleQueries: [
        "Business students at AUD interested in marketing internships",
        "Computer science graduates in Dubai with programming skills",
        "Active students in Sharjah looking for part-time opportunities",
        "Design students with creative portfolios and high activity scores",
        "Engineering students interested in startups and innovation",
        "Recent graduates with business experience in UAE",
        "High-performing students with leadership skills"
      ],
      matchingFactors: [
        'Location alignment (30% weight)',
        'Major/field relevance (25% weight)', 
        'Skill matching (20% weight)',
        'University preference (15% weight)',
        'Activity score (10% weight)'
      ],
      activityMetrics: [
        'Last active date',
        'Number of applications submitted',
        'Profile completeness percentage',
        'Response rate to opportunities',
        'Platform engagement score'
      ]
    })

  } catch (error) {
    console.error('❌ Search Info Error:', error)
    return NextResponse.json({ 
      error: 'Failed to retrieve search information'
    }, { status: 500 })
  }
} 