import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"
import { deepSeekAI } from '@/lib/deepseek-ai'
import { hasFeatureAccess } from '@/lib/pricing'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

// POST - Generate AI-powered shortlist using DeepSeek
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Companies only' }, { status: 401 })
    }

    const projectId = params.id
    const body = await request.json()
    const { maxCandidates = 10, forceRegenerate = false } = body

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: { 
            id: true, 
            subscriptionPlan: true,
            subscriptionStatus: true
          }
        },
        applications: {
          select: { id: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.companyId !== session.user?.id) {
      return NextResponse.json({ 
        error: 'You can only generate shortlists for your own projects' 
      }, { status: 403 })
    }

    // Check if user has access to advanced AI features
    const hasAdvancedAI = hasFeatureAccess(project.company.subscriptionPlan || 'FREE', 'advanced_ai_shortlisting')
    
    if (!hasAdvancedAI) {
      return NextResponse.json({
        error: 'Advanced AI shortlisting requires HR Booster or HR Agent subscription',
        upgradeRequired: 'COMPANY_PREMIUM',
        currentPlan: project.company.subscriptionPlan || 'FREE',
        feature: 'DeepSeek AI-powered candidate evaluation'
      }, { status: 403 })
    }

    // Check minimum application threshold
    const applicationCount = project.applications.length
    if (applicationCount < 5) {
      return NextResponse.json({
        error: `Need at least 5 applications to generate AI shortlist. Currently have ${applicationCount}.`,
        requiresMoreApplications: true,
        currentCount: applicationCount,
        minimumRequired: 5
      }, { status: 400 })
    }

    // Check if advanced shortlist already exists (unless forcing regeneration)
    if (!forceRegenerate) {
      const existingAdvancedShortlist = await prisma.application.findFirst({
        where: { 
          projectId,
          adminNotes: {
            contains: 'deepseek_ai'
          }
        }
      })

      if (existingAdvancedShortlist) {
        return NextResponse.json({
          error: 'Advanced AI shortlist already exists. Use forceRegenerate=true to recreate.',
          hasExisting: true
        }, { status: 409 })
      }
    }

    console.log(`🧠 Generating DeepSeek AI shortlist for project ${projectId}`)

    // Generate advanced shortlist using DeepSeek AI
    const shortlistResult = await deepSeekAI.generateShortlist(projectId, maxCandidates)

    // Reset previous shortlist statuses if regenerating
    if (forceRegenerate) {
      await prisma.application.updateMany({
        where: { 
          projectId,
          status: 'SHORTLISTED'
        },
        data: { 
          status: 'PENDING',
          adminNotes: null,
          compatibilityScore: null
        }
      })
    }

    // Update database with AI evaluation results
    await Promise.all(
      shortlistResult.evaluations.map(async (evaluation, index) => {
        const applicationId = await prisma.application.findFirst({
          where: {
            projectId,
            userId: evaluation.candidateId
          },
          select: { id: true }
        })

        if (applicationId) {
          await prisma.application.update({
            where: { id: applicationId.id },
            data: {
              status: 'SHORTLISTED',
              compatibilityScore: evaluation.overallScore,
              adminNotes: JSON.stringify({
                ranking: index + 1,
                shortlistedAt: new Date(),
                shortlistedBy: 'deepseek_ai',
                aiModel: shortlistResult.aiModel,
                confidence: evaluation.confidence,
                recommendation: evaluation.recommendation,
                reasoning: evaluation.reasoning,
                strengths: evaluation.strengths,
                concerns: evaluation.concerns,
                keyInsights: evaluation.keyInsights,
                suggestedQuestions: evaluation.suggestedQuestions,
                processingTime: shortlistResult.processingTime
              })
            }
          })
        }
      })
    )

    // Log analytics
    console.log(`✅ DeepSeek AI shortlist generated for project ${projectId}:`)
    console.log(`   📊 Evaluated: ${shortlistResult.evaluatedCandidates}/${shortlistResult.totalCandidates} candidates`)
    console.log(`   🎯 Shortlisted: ${shortlistResult.shortlistedCandidates.length} candidates`)
    console.log(`   ⏱️ Processing time: ${shortlistResult.processingTime}ms`)
    console.log(`   🤖 AI Model: ${shortlistResult.aiModel}`)

    return NextResponse.json({
      success: true,
      message: `🧠 Advanced AI shortlist generated! Selected top ${shortlistResult.shortlistedCandidates.length} candidates from ${shortlistResult.totalCandidates} applications using ${shortlistResult.aiModel}.`,
      shortlist: {
        projectId,
        totalCandidates: shortlistResult.totalCandidates,
        evaluatedCandidates: shortlistResult.evaluatedCandidates,
        shortlistedCount: shortlistResult.shortlistedCandidates.length,
        candidates: shortlistResult.shortlistedCandidates,
        evaluations: shortlistResult.evaluations,
        aiModel: shortlistResult.aiModel,
        processingTime: shortlistResult.processingTime,
        generatedAt: shortlistResult.generatedAt
      },
      upgrade: {
        isAdvanced: true,
        aiProvider: 'DeepSeek',
        features: [
          'Advanced candidate-project matching',
          'Multi-criteria evaluation',
          'Detailed AI reasoning',
          'Interview question suggestions',
          'Growth potential assessment'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error generating DeepSeek AI shortlist:', error)
    
    // Return different error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({
          error: 'AI service temporarily unavailable. Please try again later.',
          fallbackAvailable: true,
          technicalError: 'AI_SERVICE_UNAVAILABLE'
        }, { status: 503 })
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          error: 'AI service is busy. Please wait a moment and try again.',
          retryAfter: 60,
          technicalError: 'RATE_LIMITED'
        }, { status: 429 })
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate AI shortlist',
        fallbackAvailable: true,
        technicalError: 'GENERATION_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET - Get existing DeepSeek AI shortlist results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Companies only' }, { status: 401 })
    }

    const projectId = params.id

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { companyId: true, title: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.companyId !== session.user?.id) {
      return NextResponse.json({ 
        error: 'You can only view shortlists for your own projects' 
      }, { status: 403 })
    }

    // Get DeepSeek AI shortlisted candidates
    const shortlistedApplications = await prisma.application.findMany({
      where: {
        projectId,
        status: 'SHORTLISTED',
        adminNotes: {
          contains: 'deepseek_ai'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
            major: true,
            skills: true,
            bio: true,
            graduationYear: true,
            linkedin: true
          }
        }
      },
      orderBy: {
        compatibilityScore: 'desc'
      }
    })

    if (shortlistedApplications.length === 0) {
      return NextResponse.json({
        hasShortlist: false,
        message: 'No DeepSeek AI shortlist found for this project',
        suggestion: 'Generate an advanced AI shortlist to get detailed candidate evaluations'
      })
    }

    // Parse AI evaluation data from adminNotes
    const candidatesWithEvaluations = shortlistedApplications.map(app => {
      let aiEvaluation = null
      try {
        aiEvaluation = JSON.parse(app.adminNotes || '{}')
      } catch (e) {
        console.warn('Failed to parse AI evaluation data for application:', app.id)
      }

      return {
        applicationId: app.id,
        user: app.user,
        compatibilityScore: app.compatibilityScore,
        ranking: aiEvaluation?.ranking || 0,
        recommendation: aiEvaluation?.recommendation || 'MODERATE_FIT',
        reasoning: aiEvaluation?.reasoning || '',
        strengths: aiEvaluation?.strengths || [],
        concerns: aiEvaluation?.concerns || [],
        keyInsights: aiEvaluation?.keyInsights || {},
        suggestedQuestions: aiEvaluation?.suggestedQuestions || [],
        confidence: aiEvaluation?.confidence || 70,
        aiModel: aiEvaluation?.aiModel || 'deepseek-reasoning',
        shortlistedAt: aiEvaluation?.shortlistedAt || app.updatedAt
      }
    })

    return NextResponse.json({
      hasShortlist: true,
      projectId,
      projectTitle: project.title,
      shortlistedCount: candidatesWithEvaluations.length,
      candidates: candidatesWithEvaluations,
      aiProvider: 'DeepSeek',
      isAdvanced: true,
      generatedAt: candidatesWithEvaluations[0]?.shortlistedAt || null
    })

  } catch (error) {
    console.error('❌ Error fetching DeepSeek AI shortlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI shortlist' },
      { status: 500 }
    )
  }
} 
