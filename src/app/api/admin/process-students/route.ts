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

    // Only allow ADMIN users to run bulk processing
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, studentId } = body

    console.log(`🔧 Admin processing request by ${session.user.id}: ${action}`)

    if (action === 'bulk_process') {
      // Process all existing students
      console.log('🚀 Starting bulk processing of all students...')
      
      // Run in background (don't wait for completion)
      StudentProcessingEngine.bulkProcessAllStudents().catch(error => {
        console.error('❌ Bulk processing failed:', error)
      })

      return NextResponse.json({
        success: true,
        message: 'Bulk processing started in background',
        action: 'bulk_process',
        timestamp: new Date().toISOString()
      })

    } else if (action === 'process_single' && studentId) {
      // Process single student
      await StudentProcessingEngine.processStudent(studentId)
      
      return NextResponse.json({
        success: true,
        message: `Student ${studentId} processed successfully`,
        action: 'process_single',
        studentId,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'status') {
      // Get processing status
      const stats = await getProcessingStats()
      
      return NextResponse.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      })

    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use: bulk_process, process_single, or status' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Student Processing Error:', error)
    return NextResponse.json({ 
      error: 'Failed to process students',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function getProcessingStats() {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  try {
    const [totalStudents, processedStudents, totalTags, recentActivity] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.studentTag.groupBy({
        by: ['userId'],
        _count: { userId: true }
      }),
      prisma.smartTag.count(),
      prisma.studentTag.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ])

    return {
      totalStudents,
      studentsWithTags: processedStudents.length,
      studentsWithoutTags: totalStudents - processedStudents.length,
      totalSmartTags: totalTags,
      recentProcessingActivity: recentActivity,
      processingPercentage: totalStudents > 0 ? Math.round((processedStudents.length / totalStudents) * 100) : 0
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const stats = await getProcessingStats()

    return NextResponse.json({
      success: true,
      processingStats: stats,
      capabilities: {
        bulkProcessing: 'Process all existing students automatically',
        singleProcessing: 'Process individual students on demand',
        automaticProcessing: 'New students are processed automatically on registration',
        realTimeUpdates: 'Student profiles are re-processed when updated'
      },
      backgroundJobs: {
        userRegistration: 'Auto-process when student registers',
        profileUpdate: 'Auto-process when student updates profile',
        periodicRefresh: 'Planned: Weekly refresh of all student data'
      }
    })

  } catch (error) {
    console.error('❌ Processing Stats Error:', error)
    return NextResponse.json({ 
      error: 'Failed to retrieve processing stats'
    }, { status: 500 })
  }
} 