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

    let matchResults = []
    let searchType = 'intelligent_matching'

    try {
      // Try the advanced processing engine first
      const matchingCriteria = {
        query: query.trim(),
        ...filters
      }
      
      matchResults = await StudentProcessingEngine.matchStudents(matchingCriteria, limit)
      
    } catch (processingError) {
      console.log('⚠️ Advanced processing failed, using fallback search:', processingError)
      
      // Fallback to simple search if processing engine fails
      matchResults = await performFallbackSearch(query.trim(), limit)
      searchType = 'fallback_search'
    }

    console.log(`✅ Search completed: ${matchResults.length} students matched (${searchType})`)

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
        activityScore: result.student.activityScore || 50,
        lastActiveDate: result.student.lastActiveDate || result.student.updatedAt,
        applicationCount: result.student.applicationCount || 0,
        profileCompleteness: result.student.profileCompleteness || 50
      },
      matching: {
        score: result.matchScore,
        reasons: result.matchReasons,
        activityBonus: result.activityBonus || 0,
        keywordMatches: result.keywordMatches || [],
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
        searchType,
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

async function performFallbackSearch(query: string, limit: number): Promise<any[]> {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  try {
    const queryLower = query.toLowerCase()
    const searchTerms = queryLower.split(' ').filter(term => term.length > 2)

    console.log(`🔄 Fallback search for terms: ${searchTerms.join(', ')}`)

    // Simple text search across multiple fields
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: searchTerms.map(term => ({
          OR: [
            { university: { contains: term, mode: 'insensitive' } },
            { major: { contains: term, mode: 'insensitive' } },
            { location: { contains: term, mode: 'insensitive' } },
            { bio: { contains: term, mode: 'insensitive' } },
            { skills: { has: term } },
            { interests: { has: term } },
            { goal: { has: term } }
          ]
        }))
      },
      include: {
        applications: {
          select: { createdAt: true }
        }
      },
      take: limit
    })

    // Score results based on keyword matches
    return students.map(student => {
      let score = 0
      let reasons: string[] = []
      let keywordMatches: string[] = []

      // University matching
      if (student.university && searchTerms.some(term => 
        student.university!.toLowerCase().includes(term))) {
        score += 30
        reasons.push(`Studies at ${student.university}`)
        keywordMatches.push('university')
      }

      // Major matching  
      if (student.major && searchTerms.some(term =>
        student.major!.toLowerCase().includes(term))) {
        score += 25
        reasons.push(`Major: ${student.major}`)
        keywordMatches.push('major')
      }

      // Location matching
      if (student.location && searchTerms.some(term =>
        student.location!.toLowerCase().includes(term))) {
        score += 20
        reasons.push(`Located in ${student.location}`)
        keywordMatches.push('location')
      }

      // Skills matching
      const skillMatches = (student.skills || []).filter(skill =>
        searchTerms.some(term => skill.toLowerCase().includes(term))
      )
      if (skillMatches.length > 0) {
        score += 15 * skillMatches.length
        reasons.push(`Skills: ${skillMatches.join(', ')}`)
        keywordMatches.push(...skillMatches)
      }

      // Interests matching
      const interestMatches = (student.interests || []).filter(interest =>
        searchTerms.some(term => interest.toLowerCase().includes(term))
      )
      if (interestMatches.length > 0) {
        score += 10 * interestMatches.length
        reasons.push(`Interests: ${interestMatches.join(', ')}`)
      }

      // Bio matching
      if (student.bio && searchTerms.some(term =>
        student.bio!.toLowerCase().includes(term))) {
        score += 5
        reasons.push('Relevant bio content')
      }

      // Activity scoring
      const applicationCount = student.applications?.length || 0
      const daysSinceUpdate = Math.floor((Date.now() - new Date(student.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      
      let activityScore = 50
      if (daysSinceUpdate <= 7) activityScore += 20
      else if (daysSinceUpdate <= 30) activityScore += 10
      
      if (applicationCount > 0) activityScore += 10
      if (applicationCount >= 3) activityScore += 10

      return {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          university: student.university,
          major: student.major,
          skills: student.skills || [],
          location: student.location,
          graduationYear: student.graduationYear,
          interests: student.interests || [],
          goals: student.goal || [],
          activityScore,
          lastActiveDate: student.updatedAt,
          applicationCount,
          profileCompleteness: calculateProfileCompleteness(student)
        },
        matchScore: Math.min(100, score),
        matchReasons: reasons,
        activityBonus: activityScore - 50,
        keywordMatches
      }
    }).sort((a, b) => b.matchScore - a.matchScore)

  } finally {
    await prisma.$disconnect()
  }
}

function calculateProfileCompleteness(student: any): number {
  let completeness = 0
  if (student.university) completeness += 20
  if (student.major) completeness += 20
  if (student.skills?.length > 0) completeness += 20
  if (student.bio) completeness += 20
  if (student.location) completeness += 20
  return completeness
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