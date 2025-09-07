import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import { VectorEmbeddingService } from '@/lib/vector-embedding-service'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admin users to generate vectors
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🔮 Starting vector generation process...')

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        message: 'OPENAI_API_KEY environment variable is required'
      }, { status: 500 })
    }

    const { batchSize = 10, forceRegenerate = false, offset = 0 } = await request.json().catch(() => ({}))

    // Get students without vectors OR force regenerate all
    // When force regenerating, only target students without current vector version
    const whereCondition = forceRegenerate ? 
      { 
        role: 'STUDENT' as const,
        OR: [
          { studentVector: null },                    // No vector at all
          { 
            studentVector: { 
              vectorVersion: { not: 'v1.1-subjects' }  // Old vector version
            }
          }
        ]
      } : 
      { role: 'STUDENT' as const, studentVector: null }

    const studentsToProcess = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true
      },
      take: batchSize
    })

    if (studentsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: forceRegenerate ? 'All students processed!' : 'All students already have vectors!',
        processed: 0,
        total: 0
      })
    }

    console.log(`📊 Processing ${studentsToProcess.length} students...`)

    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    // Process students one by one
    for (const student of studentsToProcess) {
      try {
        console.log(`🎓 Processing: ${student.name}`)

        const vector = await VectorEmbeddingService.generateStudentEmbeddings(student.id)

        if (vector) {
          // Delete existing vector if regenerating
          if (forceRegenerate) {
            await prisma.studentVector.deleteMany({
              where: { userId: vector.userId }
            })
          }

          // Store the new vector in database
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

      } catch (error) {
        failureCount++
        const errorMessage = `Error processing ${student.name}: ${(error as Error).message}`
        console.error(errorMessage)
        errors.push(errorMessage)
      }
    }

    // Get total counts for summary
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' as const } })
    const studentsWithVectors = await prisma.studentVector.count()

    return NextResponse.json({
      success: true,
      message: forceRegenerate ? 'Vector regeneration batch completed' : 'Vector generation batch completed',
      processed: successCount + failureCount,
      successCount: successCount,
      failureCount: failureCount,
      errors: errors,
      summary: {
        totalStudents,
        studentsWithVectors,
        studentsRemaining: totalStudents - studentsWithVectors,
        completionPercentage: Math.round((studentsWithVectors / totalStudents) * 100)
      }
    })

  } catch (error) {
    console.error('❌ Vector generation error:', error)
    return NextResponse.json({
      error: 'Vector generation failed',
      details: (error as Error).message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admin users
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get vector generation status
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' as const } })
    const studentsWithVectors = await prisma.studentVector.count()

    return NextResponse.json({
      totalStudents,
      studentsWithVectors,
      studentsRemaining: totalStudents - studentsWithVectors,
      completionPercentage: Math.round((studentsWithVectors / totalStudents) * 100),
      configured: {
        openaiApiKey: !!process.env.OPENAI_API_KEY
      }
    })

  } catch (error) {
    console.error('❌ Error getting vector status:', error)
    return NextResponse.json({
      error: 'Failed to get vector status',
      details: (error as Error).message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
