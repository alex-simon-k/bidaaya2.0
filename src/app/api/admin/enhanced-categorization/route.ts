import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { EnhancedAICategorization } from '@/lib/enhanced-ai-categorization'


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only allow ADMIN users to run enhanced categorization
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, studentData, bulkProcess = false } = body

    console.log(`🧠 Enhanced categorization request by ${session.user.id}: ${action}`)

    if (action === 'test_single' && studentData) {
      // Test categorization on single student data
      const result = await EnhancedAICategorization.categorizeStudentIntelligently(studentData)
      
      return NextResponse.json({
        success: true,
        action: 'test_single',
        input: studentData,
        categorization: result,
        confidence: {
          university: result.university.confidence,
          major: result.major.confidence,
          averageSkillConfidence: result.skills.reduce((sum, s) => sum + s.confidence, 0) / result.skills.length,
          location: result.location.confidence
        }
      })

    } else if (action === 'enhanced_bulk_process') {
      // Run enhanced bulk processing
      console.log('🚀 Starting enhanced bulk processing...')
      
      const results = await EnhancedAICategorization.enhancedBulkProcessing()
      
      return NextResponse.json({
        success: true,
        action: 'enhanced_bulk_process',
        results: {
          studentsProcessed: results.processed,
          studentsImproved: results.improved,
          studentsNeedingReview: results.flaggedForReview.length,
          newSemanticTags: results.newTags,
          improvementRate: Math.round((results.improved / results.processed) * 100),
          flaggedStudents: results.flaggedForReview.slice(0, 10) // Show first 10
        },
        timestamp: new Date().toISOString()
      })

    } else if (action === 'analyze_data_quality') {
      // Analyze current data quality issues
      const qualityAnalysis = await analyzeDataQuality()
      
      return NextResponse.json({
        success: true,
        action: 'analyze_data_quality',
        analysis: qualityAnalysis
      })

    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use: test_single, enhanced_bulk_process, or analyze_data_quality' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Enhanced Categorization Error:', error)
    return NextResponse.json({ 
      error: 'Failed to process enhanced categorization',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function analyzeDataQuality() {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  try {
    // Get sample of student data for analysis
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        university: true,
        major: true,
        skills: true,
        location: true,
        bio: true
      },
      take: 100 // Sample for analysis
    })

    // Analyze universities
    const universityVariations = new Map<string, number>()
    const majorVariations = new Map<string, number>()
    const locationVariations = new Map<string, number>()
    
    let incompleteProfiles = 0
    let shortBios = 0
    let fewSkills = 0

    students.forEach(student => {
      // Track university variations
      if (student.university) {
        const uni = student.university.toLowerCase().trim()
        universityVariations.set(uni, (universityVariations.get(uni) || 0) + 1)
      }

      // Track major variations
      if (student.major) {
        const maj = student.major.toLowerCase().trim()
        majorVariations.set(maj, (majorVariations.get(maj) || 0) + 1)
      }

      // Track location variations
      if (student.location) {
        const loc = student.location.toLowerCase().trim()
        locationVariations.set(loc, (locationVariations.get(loc) || 0) + 1)
      }

      // Profile completeness analysis
      const fields = [student.university, student.major, student.location, student.bio]
      if (fields.filter(f => f && f.trim()).length < 3) {
        incompleteProfiles++
      }

      if (!student.bio || student.bio.length < 50) {
        shortBios++
      }

      if (!student.skills || student.skills.length < 2) {
        fewSkills++
      }
    })

    // Find variations that could be standardized
    const potentialUniversityMerges = findSimilarEntries(Array.from(universityVariations.keys()))
    const potentialMajorMerges = findSimilarEntries(Array.from(majorVariations.keys()))
    const potentialLocationMerges = findSimilarEntries(Array.from(locationVariations.keys()))

    return {
      sampleSize: students.length,
      dataQualityIssues: {
        incompleteProfiles: incompleteProfiles,
        shortBios: shortBios,
        fewSkills: fewSkills,
        incompletePercentage: Math.round((incompleteProfiles / students.length) * 100)
      },
      variationAnalysis: {
        universities: {
          uniqueCount: universityVariations.size,
          topVariations: Array.from(universityVariations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10),
          potentialMerges: potentialUniversityMerges
        },
        majors: {
          uniqueCount: majorVariations.size,
          topVariations: Array.from(majorVariations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10),
          potentialMerges: potentialMajorMerges
        },
        locations: {
          uniqueCount: locationVariations.size,
          topVariations: Array.from(locationVariations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10),
          potentialMerges: potentialLocationMerges
        }
      },
      recommendations: [
        `${incompleteProfiles} students have incomplete profiles - encourage completion`,
        `${shortBios} students have short bios - recommend minimum 50 characters`,
        `${fewSkills} students have few skills listed - suggest minimum 3 skills`,
        `${potentialUniversityMerges.length} university name variations could be standardized`,
        `${potentialMajorMerges.length} major variations could be grouped`,
        `Enhanced AI categorization would improve ${Math.round((incompleteProfiles / students.length) * 100)}% of profiles`
      ]
    }
  } finally {
    await prisma.$disconnect()
  }
}

function findSimilarEntries(entries: string[]): Array<{group: string[], suggestion: string}> {
  const groups: Array<{group: string[], suggestion: string}> = []
  const processed = new Set<string>()

  entries.forEach(entry => {
    if (processed.has(entry)) return
    
    const similar = entries.filter(other => {
      if (other === entry || processed.has(other)) return false
      return calculateSimilarity(entry, other) > 0.7
    })

    if (similar.length > 0) {
      const group = [entry, ...similar]
      group.forEach(item => processed.add(item))
      
      // Suggest the most common/complete version
      const suggestion = group.reduce((best, current) => 
        current.length > best.length ? current : best
      )
      
      groups.push({ group, suggestion })
    }
  })

  return groups
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      capabilities: {
        intelligentCategorization: 'AI-powered understanding of abbreviations and variations',
        semanticMatching: 'Handles "GMU" → "Gulf Medical University" automatically',
        confidenceScoring: 'Provides confidence levels for each categorization',
        aiEnhancement: 'Uses DeepSeek for industry alignment and career predictions',
        dataQualityAnalysis: 'Identifies variations and suggests standardizations',
        hybridApproach: 'Combines knowledge base + AI + manual verification'
      },
      knowledgeBase: {
        universities: 7, // Number of known university mappings
        majors: 10,      // Number of known major mappings
        skills: 5,       // Number of skill categories
        locations: 7     // Number of location mappings
      },
      exampleMappings: {
        universities: ['GMU → Gulf Medical University', 'AUD → American University of Dubai'],
        majors: ['CS → Computer Science', 'BBA → Business Administration'],
        skills: ['JS → Programming (Technical)', 'Photoshop → Design (Creative)'],
        locations: ['DXB → Dubai', 'SHJ → Sharjah']
      }
    })

  } catch (error) {
    console.error('❌ Enhanced Categorization Info Error:', error)
    return NextResponse.json({ 
      error: 'Failed to retrieve categorization info'
    }, { status: 500 })
  }
} 
