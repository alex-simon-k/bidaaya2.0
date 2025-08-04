import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only companies can search students' }, { status: 403 })
    }

    const body = await request.json()
    const { query, limit = 10 } = body

    console.log(`🧪 Test search for: "${query}"`)

    // Simple direct search without the processing engine
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const queryLower = query.toLowerCase()
      const searchTerms = queryLower.split(' ').filter((term: string) => term.length > 2)

      console.log(`🔍 Search terms: ${searchTerms.join(', ')}`)

      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          OR: searchTerms.map((term: string) => ({
            OR: [
              { university: { contains: term, mode: 'insensitive' } },
              { major: { contains: term, mode: 'insensitive' } },
              { location: { contains: term, mode: 'insensitive' } },
              { skills: { has: term } },
              { interests: { has: term } }
            ]
          }))
        },
        select: {
          id: true,
          name: true,
          email: true,
          university: true,
          major: true,
          skills: true,
          location: true,
          graduationYear: true,
          interests: true,
          goal: true,
          bio: true,
          updatedAt: true
        },
        take: limit
      })

      console.log(`📊 Found ${students.length} students`)

      // Format for frontend (match what the transformer expects)
      const results = students.map(student => ({
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
          bio: student.bio || `${student.major || 'Student'} at ${student.university || 'University'}`,
          activityScore: 75 // Fixed score for testing
        },
        matching: {
          score: 75,
          reasons: [`Matches search for "${query}"`],
          activityBonus: 10,
          keywordMatches: searchTerms,
          overallRating: 'good'
        }
      }))

      return NextResponse.json({
        success: true,
        query: query,
        results: results,
        meta: {
          totalResults: results.length,
          searchType: 'simple_test',
          searchTerms: searchTerms
        }
      })

    } finally {
      await prisma.$disconnect()
    }

  } catch (error) {
    console.error('❌ Test Search Error:', error)
    return NextResponse.json({ 
      error: 'Test search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 