import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { VectorEmbeddingService } from '@/lib/vector-embedding-service'
import { VectorMatchingService } from '@/lib/vector-matching-service'


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can trigger batch generation, students can generate their own
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Student access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, userId, batchSize = 10 } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (single, batch, or update)' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'single':
        // Generate embeddings for a single student
        const targetUserId = userId || session.user.id
        
        // Students can only generate for themselves
        if (session.user.role === 'STUDENT' && targetUserId !== session.user.id) {
          return NextResponse.json(
            { error: 'Students can only generate embeddings for themselves' },
            { status: 403 }
          )
        }

        const singleVector = await VectorEmbeddingService.generateStudentEmbeddings(targetUserId)
        
        if (singleVector) {
          result = {
            success: true,
            action: 'single',
            userId: targetUserId,
            vectorGenerated: true,
            vectorDimensions: singleVector.profileVector.length,
            vectorVersion: singleVector.vectorVersion
          }
        } else {
          result = {
            success: false,
            action: 'single',
            userId: targetUserId,
            error: 'Failed to generate embeddings'
          }
        }
        break

      case 'batch':
        // Generate embeddings for all students (admin only)
        if (session.user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Batch generation requires admin access' },
            { status: 403 }
          )
        }

        console.log('🚀 Starting batch embedding generation...')
        const batchResult = await VectorEmbeddingService.generateAllStudentEmbeddings(batchSize)
        
        result = {
          success: true,
          action: 'batch',
          ...batchResult,
          batchSize
        }
        break

      case 'update':
        // Update embeddings for a specific student
        const updateUserId = userId || session.user.id
        
        // Students can only update their own
        if (session.user.role === 'STUDENT' && updateUserId !== session.user.id) {
          return NextResponse.json(
            { error: 'Students can only update their own embeddings' },
            { status: 403 }
          )
        }

        const updateSuccess = await VectorMatchingService.updateStudentVectors(updateUserId)
        
        result = {
          success: updateSuccess,
          action: 'update',
          userId: updateUserId,
          updated: updateSuccess
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be "single", "batch", or "update"' },
          { status: 400 }
        )
    }

    console.log(`✅ Vector embedding ${action} completed:`, result)

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      requestedBy: session.user.id,
      requestedByRole: session.user.role
    })

  } catch (error) {
    console.error('❌ Vector embedding generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Vector embedding generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
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

    // Get vector generation status and capabilities
    const capabilities = {
      canGenerateSingle: true,
      canGenerateBatch: session.user.role === 'ADMIN',
      canUpdate: true,
      embeddingModel: 'text-embedding-3-small',
      vectorDimensions: 1536, // text-embedding-3-small dimensions
      supportedActions: ['single', 'update'],
      maxBatchSize: 50
    }

    if (session.user.role === 'ADMIN') {
      capabilities.supportedActions.push('batch')
    }

    // TODO: Add actual vector statistics when storage is implemented
    const statistics = {
      totalStudentsWithVectors: 0,
      lastBatchGeneration: null,
      vectorVersion: 'v1.0',
      storageType: 'pending' // Will be 'postgresql', 'pinecone', etc.
    }

    return NextResponse.json({
      capabilities,
      statistics,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Vector embedding info error:', error)
    return NextResponse.json(
      { error: 'Failed to get vector embedding info' },
      { status: 500 }
    )
  }
}
