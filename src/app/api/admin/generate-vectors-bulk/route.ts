import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import { VectorEmbeddingService } from '@/lib/vector-embedding-service'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admin users
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🔮 Starting bulk vector generation for completed profiles...')

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        message: 'OPENAI_API_KEY environment variable is required'
      }, { status: 500 })
    }

    const { batchSize = 50 } = await request.json().catch(() => ({}))

    // Get students with completed profiles who don't have vectors
    const studentsToProcess = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        profileCompleted: true,
        studentVector: null
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      take: batchSize // Process in batches to avoid timeouts
    })

    if (studentsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All students with completed profiles already have vectors!',
        processed: 0,
        remaining: 0
      })
    }

    console.log(`📊 Processing ${studentsToProcess.length} students with completed profiles...`)

    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    // Process students
    for (const student of studentsToProcess) {
      try {
        console.log(`🎓 Processing: ${student.name}`)

        const vector = await VectorEmbeddingService.generateStudentEmbeddings(student.id)

        if (vector) {
          await prisma.studentVector.create({
            data: {
              userId: vector.userId,
              profileVector: vector.profileVector,
              skillsVector: vector.skillsVector,
              academicVector: vector.academicVector,
              vectorVersion: vector.vectorVersion,
              lastUpdated: vector.lastUpdated
            }
          })

          successCount++
          console.log(`✅ Vector generated for ${student.name}`)
        } else {
          failureCount++
          errors.push(`Failed to generate vector for ${student.name}`)
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        failureCount++
        const errorMessage = `Error processing ${student.name}: ${(error as Error).message}`
        console.error(errorMessage)
        errors.push(errorMessage)
      }
    }

    // Get remaining count
    const remainingStudents = await prisma.user.count({
      where: {
        role: 'STUDENT',
        profileCompleted: true,
        studentVector: null
      }
    })

    // Get totals for summary
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } })
    const studentsWithVectors = await prisma.studentVector.count()
    const completedProfiles = await prisma.user.count({ 
      where: { role: 'STUDENT', profileCompleted: true } 
    })

    return NextResponse.json({
      success: true,
      message: 'Bulk vector generation batch completed',
      processed: successCount + failureCount,
      successful: successCount,
      failed: failureCount,
      errors: errors.length > 10 ? errors.slice(0, 10) : errors,
      remaining: remainingStudents,
      summary: {
        totalStudents,
        completedProfiles,
        studentsWithVectors,
        vectorCoverage: Math.round((studentsWithVectors / totalStudents) * 100),
        completedProfileCoverage: Math.round((studentsWithVectors / completedProfiles) * 100)
      }
    })

  } catch (error) {
    console.error('❌ Bulk vector generation error:', error)
    return NextResponse.json({
      error: 'Bulk vector generation failed',
      details: (error as Error).message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get bulk generation status
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } })
    const completedProfiles = await prisma.user.count({ 
      where: { role: 'STUDENT', profileCompleted: true } 
    })
    const studentsWithVectors = await prisma.studentVector.count()
    const remainingCompleted = await prisma.user.count({
      where: {
        role: 'STUDENT',
        profileCompleted: true,
        studentVector: null
      }
    })

    return NextResponse.json({
      status: {
        totalStudents,
        completedProfiles,
        studentsWithVectors,
        remainingCompleted,
        vectorCoverage: Math.round((studentsWithVectors / totalStudents) * 100),
        completedProfileCoverage: Math.round((studentsWithVectors / completedProfiles) * 100)
      },
      configured: {
        openaiApiKey: !!process.env.OPENAI_API_KEY
      }
    })

  } catch (error) {
    console.error('❌ Error getting bulk vector status:', error)
    return NextResponse.json({
      error: 'Failed to get bulk vector status',
      details: (error as Error).message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
