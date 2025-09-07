import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('🧪 Testing marketing search logic...')
    
    // Test the same keyword logic used in getKeywordSpecificCandidates
    const lowerPrompt = "i want marketing interns".toLowerCase()
    let whereConditions: any = {
      role: 'STUDENT',
      profileCompleted: true
    }
    
    if (lowerPrompt.includes('marketing')) {
      whereConditions.OR = [
        { major: { contains: 'marketing', mode: 'insensitive' } },
        { major: { contains: 'business', mode: 'insensitive' } },
        { bio: { contains: 'marketing', mode: 'insensitive' } },
        { interests: { hasSome: ['Marketing & Digital Media'] } }
      ]
    }
    
    console.log('🔍 Testing WHERE conditions:', JSON.stringify(whereConditions, null, 2))
    
    const candidates = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        major: true,
        bio: true,
        interests: true,
        goal: true,
        location: true,
        graduationYear: true,
        profileCompleted: true,
        updatedAt: true
      },
      take: 10,
      orderBy: [
        { updatedAt: 'desc' }
      ]
    })
    
    console.log(`✅ Found ${candidates.length} marketing candidates`)
    
    // Also test emergency fallback
    const emergencyFallback = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        profileCompleted: true,
        OR: [
          { lastActiveAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
          { applicationsThisMonth: { gt: 0 } },
          { updatedAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } },
          { createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } }
        ]
      },
      select: {
        id: true,
        name: true,
        major: true,
        updatedAt: true
      },
      take: 5,
      orderBy: [
        { updatedAt: 'desc' }
      ]
    })
    
    return NextResponse.json({
      success: true,
      debug: {
        keywordSearch: {
          query: lowerPrompt,
          whereConditions,
          results: candidates.length,
          sampleResults: candidates.slice(0, 3).map(c => ({
            name: c.name,
            major: c.major,
            interests: c.interests?.slice(0, 2),
            bio: c.bio?.slice(0, 50) + '...'
          }))
        },
        emergencyFallback: {
          results: emergencyFallback.length,
          sampleResults: emergencyFallback.slice(0, 3).map(c => ({
            name: c.name,
            major: c.major,
            updatedAt: c.updatedAt
          }))
        },
        totalStudents: await prisma.user.count({ where: { role: 'STUDENT' } }),
        completedProfiles: await prisma.user.count({ 
          where: { role: 'STUDENT', profileCompleted: true } 
        })
      }
    })
    
  } catch (error) {
    console.error('❌ Debug test error:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
