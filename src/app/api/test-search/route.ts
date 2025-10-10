import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'


export const dynamic = 'force-dynamic';

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
    const { query, limit = 9 } = body

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
              { interests: { has: term } },
              { subjects: { contains: term, mode: 'insensitive' } },
              { education: { contains: term, mode: 'insensitive' } },
              { goal: { has: term } },
              { bio: { contains: term, mode: 'insensitive' } }
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
          updatedAt: true,
          // Key database fields for better matching
          education: true,
          subjects: true,
          dateOfBirth: true,
          mena: true,
          lastActiveAt: true,
          applicationsThisMonth: true
        },
        take: limit
      })

      console.log(`📊 Found ${students.length} students`)

      // Calculate realistic scores for each student
      const scoredStudents = students.map(student => {
        const scoring = calculateStudentScore(student, query, searchTerms)
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
            goal: student.goal || [],
            bio: student.bio || `${student.major || 'Student'} at ${student.university || 'University'}`,
            activityScore: scoring.activityScore,
            // Key database fields
            education: student.education,
            subjects: student.subjects,
            dateOfBirth: student.dateOfBirth,
            mena: student.mena,
            lastActiveAt: student.lastActiveAt
          },
          matching: {
            score: scoring.totalScore,
            reasons: scoring.reasons,
            keywordMatches: scoring.keywordMatches,
            overallRating: scoring.overallRating,
            breakdown: scoring.breakdown
          }
        }
      })

      // Sort by score (highest first) and apply relative scoring
      const sortedStudents = scoredStudents.sort((a, b) => b.matching.score - a.matching.score)
      const results = applyRelativeScoring(sortedStudents)

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

// Dynamic scoring algorithm
function calculateStudentScore(student: any, query: string, searchTerms: string[]) {
  let totalScore = 0
  let reasons: string[] = []
  let keywordMatches: string[] = []
  
  // Base score starts at 20-30 (lower baseline to make matching more selective)
  const baseScore = Math.floor(Math.random() * 10) + 20
  totalScore += baseScore

  // MAJOR/SUBJECTS MATCHING (40-50 points) - HIGHEST PRIORITY
  let majorSubjectMatch = false
  
  // Check major field first
  if (student.major && searchTerms.some(term =>
    student.major.toLowerCase().includes(term))) {
    const majorBonus = Math.floor(Math.random() * 10) + 40
    totalScore += majorBonus
    reasons.push(`Major: ${student.major}`)
    keywordMatches.push('major')
    majorSubjectMatch = true
  }
  
  // Check subjects field (more specific than major) - Higher priority than major
  if (student.subjects && searchTerms.some(term =>
    student.subjects.toLowerCase().includes(term))) {
    const subjectBonus = Math.floor(Math.random() * 10) + 45  // Higher than major
    totalScore += subjectBonus
    reasons.push(`Studies: ${student.subjects}`)
    keywordMatches.push('subjects')
    majorSubjectMatch = true
  }

  // Skills matching (15-25 points based on number of matches)
  const skillMatches = (student.skills || []).filter((skill: string) =>
    searchTerms.some(term => skill.toLowerCase().includes(term))
  )
  if (skillMatches.length > 0) {
    const skillBonus = Math.min(25, skillMatches.length * 6 + Math.floor(Math.random() * 5))
    totalScore += skillBonus
    reasons.push(`Skills: ${skillMatches.join(', ')}`)
    keywordMatches.push('skills')
  }

  // Interests matching (10-20 points) - Higher for subject relevance
  const interestMatches = (student.interests || []).filter((interest: string) =>
    searchTerms.some(term => interest.toLowerCase().includes(term))
  )
  if (interestMatches.length > 0) {
    const interestBonus = Math.min(20, interestMatches.length * 8 + Math.floor(Math.random() * 5))
    totalScore += interestBonus
    reasons.push(`Interests: ${interestMatches.join(', ')}`)
    keywordMatches.push('interests')
  }

  // University/Education matching (10-15 points) - REDUCED PRIORITY
  if (student.university && searchTerms.some(term => 
    student.university.toLowerCase().includes(term))) {
    const universityBonus = Math.floor(Math.random() * 5) + 10  // Reduced from 15-25 to 10-15
    totalScore += universityBonus
    reasons.push(`Studies at ${student.university}`)
    keywordMatches.push('university')
  }

  // Goals matching (8-15 points) - Slightly reduced
  const goalMatches = (student.goal || []).filter((goal: string) =>
    searchTerms.some(term => goal.toLowerCase().includes(term))
  )
  if (goalMatches.length > 0) {
    const goalBonus = Math.min(15, goalMatches.length * 5 + Math.floor(Math.random() * 5))
    totalScore += goalBonus
    reasons.push(`Goals: ${goalMatches.join(', ')}`)
    keywordMatches.push('goals')
  }

  // Activity scoring (based on applications and last activity)
  let activityScore = 50 // Base activity
  const applicationsThisMonth = student.applicationsThisMonth || 0
  
  if (applicationsThisMonth > 5) {
    activityScore = Math.floor(Math.random() * 20) + 80 // Very active
  } else if (applicationsThisMonth > 2) {
    activityScore = Math.floor(Math.random() * 20) + 60 // Active
  } else if (applicationsThisMonth > 0) {
    activityScore = Math.floor(Math.random() * 20) + 40 // Somewhat active
  } else {
    activityScore = Math.floor(Math.random() * 30) + 25 // Low activity
  }

  // Activity bonus to total score (0-10 points) - Reduced impact
  const activityBonus = Math.floor(activityScore / 10)  // Reduced from /6 to /10
  totalScore += activityBonus

  // Education level bonus (3-8 points) - Reduced
  if (student.education === 'University') {
    totalScore += Math.floor(Math.random() * 5) + 3
  } else if (student.education === 'High School') {
    totalScore += Math.floor(Math.random() * 2) + 1
  }

  // Subject relevance bonus: If major/subjects match, give significant boost
  if (majorSubjectMatch) {
    totalScore += 15  // Additional bonus for exact subject match
    reasons.push('Perfect subject alignment')
  }

  // Ensure score is within reasonable bounds (20-95)
  totalScore = Math.max(20, Math.min(95, totalScore))

  // Add fallback reason if no specific matches
  if (reasons.length === 0) {
    reasons.push(`Profile matches general criteria`)
  }

  // Overall rating based on score
  let overallRating = 'poor'
  if (totalScore >= 75) overallRating = 'excellent'
  else if (totalScore >= 60) overallRating = 'good'
  else if (totalScore >= 45) overallRating = 'fair'

  return {
    totalScore,
    activityScore,
    overallRating,
    reasons,
    keywordMatches,
    breakdown: {
      major: student.major,
      subjects: student.subjects,
      skills: student.skills,
      interests: student.interests,
      university: student.university,
      education: student.education,
      applicationsThisMonth
    }
  }
}

// Apply relative scoring to ensure variety
function applyRelativeScoring(students: any[]) {
  if (students.length === 0) return students

  // Get the current score distribution
  const scores = students.map(s => s.matching.score)
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  
  // If all scores are too similar, spread them out
  if (maxScore - minScore < 20) {
    const spread = 45 // Target spread from highest to lowest
    
    return students.map((student, index) => {
      // Top performers get 75-95
      // Middle performers get 50-74  
      // Lower performers get 25-49
      let adjustedScore
      
      if (index < 3) {
        // Top 3: 75-95
        adjustedScore = 95 - (index * 7) + Math.floor(Math.random() * 5)
      } else if (index < 6) {
        // Middle 3: 50-74
        adjustedScore = 74 - ((index - 3) * 8) + Math.floor(Math.random() * 5)
      } else {
        // Bottom 3: 25-49
        adjustedScore = 49 - ((index - 6) * 8) + Math.floor(Math.random() * 5)
      }
      
      return {
        ...student,
        matching: {
          ...student.matching,
          score: Math.max(25, Math.min(95, adjustedScore))
        }
      }
    })
  }
  
  return students
}
