import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { createFakeProjects, cleanupFakeProjects } from '@/lib/fake-projects-generator'


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'create') {
      console.log('🎭 Creating fake projects for platform engagement...')
      await createFakeProjects(session.user.id)
      
      return NextResponse.json({
        success: true,
        message: 'Fake projects created successfully',
        projectsCreated: 15,
        description: 'Created 15 diverse projects across different categories with realistic data'
      })
      
    } else if (action === 'cleanup') {
      console.log('🧹 Cleaning up fake projects...')
      await cleanupFakeProjects(session.user.id)
      
      return NextResponse.json({
        success: true,
        message: 'Fake projects cleaned up successfully',
        description: 'Removed all fake companies, projects, and related applications'
      })
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "create" or "cleanup"' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error managing fake projects:', error)
    return NextResponse.json({ 
      error: 'Failed to manage fake projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      info: {
        description: 'Fake Projects Management API',
        actions: {
          create: 'POST with {"action": "create"} - Creates 15 fake projects with diverse categories',
          cleanup: 'POST with {"action": "cleanup"} - Removes all fake projects and companies'
        },
        projectCategories: [
          'TECHNOLOGY (AI/ML, Web Dev, Mobile, Blockchain, VR)',
          'DESIGN (UI/UX, Brand, Graphics)',
          'MARKETING (Digital, Content, Social Media)',
          'DATA_SCIENCE (Analytics, Visualization)',
          'RESEARCH (Social Impact, Academic)',
          'FINANCE (Investment Analysis)',
          'MEDIA (Video Production)',
          'SUSTAINABILITY (Environmental Solutions)'
        ],
        benefits: [
          'Realistic project data for testing',
          'Diverse skill requirements',
          'Varied compensation and duration',
          'Mock applications and statuses',
          'Company profiles with subscriptions',
          'Geographic distribution across UK'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error getting fake projects info:', error)
    return NextResponse.json({ 
      error: 'Failed to get fake projects information' 
    }, { status: 500 })
  }
} 
