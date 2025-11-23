/**
 * CV Generation API
 * 
 * Generate custom CVs for specific opportunities or generic CVs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { CVGenerator } from '@/lib/cv-generator'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

interface GenerateRequest {
  opportunityId?: string  // External opportunity ID
  opportunityType?: 'internal' | 'external'  // Which type of opportunity
  projectId?: string  // Internal project ID (alternative to opportunityId)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body: GenerateRequest = await request.json()
    const { opportunityId, opportunityType, projectId } = body

    console.log('📄 CV Generation Request:', { opportunityId, opportunityType, projectId })

    // If no opportunity specified, generate generic CV
    if (!opportunityId && !projectId) {
      console.log('📄 Generating generic CV...')
      
      const cv = await CVGenerator.generateGenericCV(userId)
      
      if (!cv) {
        return NextResponse.json({
          error: 'Unable to generate CV. Please complete your profile first.',
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        cv,
        type: 'generic',
      })
    }

    // Generate custom CV for specific opportunity
    let opportunityRequirements

    if (projectId) {
      // Internal Bidaaya project
      console.log('📄 Generating CV for internal project:', projectId)
      
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          title: true,
          description: true,
          skillsRequired: true,
          experienceLevel: true,
          category: true,
        },
      })

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      opportunityRequirements = {
        title: project.title,
        description: project.description,
        required_skills: project.skillsRequired,
        nice_to_have_skills: [],
        role_type: project.category || 'general',
        experience_level: project.experienceLevel || 'entry',
      }

    } else if (opportunityId && opportunityType === 'external') {
      // External opportunity
      console.log('📄 Generating CV for external opportunity:', opportunityId)
      
      const opportunity = await prisma.externalOpportunity.findUnique({
        where: { id: opportunityId },
        select: {
          title: true,
          description: true,
          category: true,
          experienceLevel: true,
        },
      })

      if (!opportunity) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
      }

      // Extract skills from description (simple approach)
      const description = opportunity.description || ''
      const commonSkills = [
        'python', 'javascript', 'react', 'node', 'java', 'sql', 'data analysis',
        'marketing', 'communication', 'leadership', 'project management'
      ]
      const foundSkills = commonSkills.filter(skill =>
        description.toLowerCase().includes(skill)
      )

      opportunityRequirements = {
        title: opportunity.title,
        description: opportunity.description || '',
        required_skills: foundSkills,
        nice_to_have_skills: [],
        role_type: opportunity.category || 'general',
        experience_level: opportunity.experienceLevel || 'entry',
      }

    } else {
      return NextResponse.json({
        error: 'Invalid opportunity specification',
      }, { status: 400 })
    }

    // Generate custom CV
    const cv = await CVGenerator.generateCustomCV(userId, opportunityRequirements)

    if (!cv) {
      return NextResponse.json({
        error: 'Unable to generate CV. Please complete your profile first.',
      }, { status: 400 })
    }

    // Deduct 5 credits for custom CV generation
    const CUSTOM_CV_COST = 5
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      })

      if (!user || user.credits < CUSTOM_CV_COST) {
        return NextResponse.json({
          error: 'Insufficient credits',
          required: CUSTOM_CV_COST,
          current: user?.credits || 0,
        }, { status: 402 })
      }

      // Deduct credits and create transaction
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: CUSTOM_CV_COST },
          lifetimeCreditsUsed: { increment: CUSTOM_CV_COST },
        },
      })

      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: -CUSTOM_CV_COST,
          type: 'SPEND',
          reason: `Custom CV: ${opportunityRequirements.title}`,
          balanceAfter: user.credits - CUSTOM_CV_COST,
        },
      })

      console.log(`💳 Deducted ${CUSTOM_CV_COST} credits for custom CV`)
    } catch (error) {
      console.error('⚠️ Credit deduction error:', error)
      // Continue anyway - don't block CV generation
    }

    // Save CV generation event (for analytics)
    try {
      await prisma.chatMessage.create({
        data: {
          conversationId: '', // Placeholder
          userId,
          role: 'system',
          content: `Generated CV for ${opportunityRequirements.title}`,
          cvGenerated: true,
          cvData: cv as any,
        },
      }).catch(() => {
        // Ignore if conversation doesn't exist
        console.log('⚠️ Could not save CV generation event')
      })
    } catch (e) {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      cv,
      type: 'custom',
      relevanceScore: cv.relevanceScore,
      creditsDeducted: CUSTOM_CV_COST,
    })

  } catch (error: any) {
    console.error('❌ CV Generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate CV',
      details: error.message,
    }, { status: 500 })
  }
}

// GET: Get CV completeness and preview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Generate a quick generic CV preview
    const cv = await CVGenerator.generateGenericCV(userId)

    if (!cv) {
      return NextResponse.json({
        error: 'No CV data available yet',
        completeness: {
          overallScore: 0,
          isMinimumViable: false,
        }
      }, { status: 200 })  // 200 because this is expected state for new users
    }

    // Return CV preview with stats
    return NextResponse.json({
      success: true,
      preview: {
        name: cv.profile.name,
        headline: cv.profile.headline,
        educationCount: cv.education.length,
        experienceCount: cv.experience.length,
        projectsCount: cv.projects.length,
        skillsCount: cv.skills.length,
      },
      completeness: {
        overallScore: cv.relevanceScore,
        isMinimumViable: true,
      },
      generatedAt: cv.generatedAt,
    })

  } catch (error: any) {
    console.error('❌ CV Preview error:', error)
    return NextResponse.json({
      error: 'Failed to get CV preview',
      details: error.message,
    }, { status: 500 })
  }
}

