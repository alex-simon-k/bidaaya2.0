/**
 * CV Word Export API
 * 
 * Generates and downloads CV as an editable Word document
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { CREDIT_COSTS } from '@/lib/credits'
import { CVGenerator, GeneratedCV } from '@/lib/cv-generator'
import { CVWordExportV3 } from '@/lib/cv-word-export-v3-template'
import { CVWordExportV4 } from '@/lib/cv-word-export-v4'
import { Packer } from 'docx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

interface ExportRequest {
  opportunityId?: string
  opportunityType?: 'internal' | 'external'
  projectId?: string
  generatedCvId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body: ExportRequest = await request.json()
    const { opportunityId, opportunityType, projectId, generatedCvId } = body

    console.log('📄 Word Export Request:', { opportunityId, opportunityType, projectId, generatedCvId })

    // Generate CV (generic, custom, or from history)
    let cv: GeneratedCV | null = null

    // 1. Try fetching from history if ID provided
    if (generatedCvId) {
      try {
        // @ts-ignore - Prisma client might not be updated yet
        const record = await prisma.generatedCV.findUnique({
          where: { id: generatedCvId },
        })

        if (record && record.userId === userId) {
          cv = record.cvData as unknown as GeneratedCV
          console.log('✅ Using saved GeneratedCV data:', generatedCvId)
        }
      } catch (e) {
        console.warn('⚠️ Failed to fetch GeneratedCV:', e)
      }
    }

    // 2. If not found, generate fresh
    if (!cv) {
      if (!opportunityId && !projectId) {
        // Generic CV
        cv = await CVGenerator.generateGenericCV(userId)
      } else if (projectId) {
        // Internal Bidaaya project
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

        if (project) {
          const opportunityRequirements = {
            title: project.title,
            description: project.description,
            required_skills: project.skillsRequired,
            nice_to_have_skills: [],
            role_type: project.category || 'general',
            experience_level: project.experienceLevel || 'entry',
          }
          cv = await CVGenerator.generateCustomCV(userId, opportunityRequirements)
        } else {
          cv = await CVGenerator.generateGenericCV(userId)
        }
      } else if (opportunityId && opportunityType === 'external') {
        // External opportunity - Generate CUSTOM CV
        const opportunity = await prisma.externalOpportunity.findUnique({
          where: { id: opportunityId },
          select: {
            title: true,
            description: true,
            category: true,
            experienceLevel: true,
          },
        })

        if (opportunity) {
          // Extract skills from description
          const description = opportunity.description || ''
          const commonSkills = [
            'python', 'javascript', 'react', 'node', 'java', 'sql', 'data analysis',
            'marketing', 'communication', 'leadership', 'project management'
          ]
          const foundSkills = commonSkills.filter(skill =>
            description.toLowerCase().includes(skill)
          )

          const opportunityRequirements = {
            title: opportunity.title,
            description: opportunity.description || '',
            required_skills: foundSkills,
            nice_to_have_skills: [],
            role_type: opportunity.category || 'general',
            experience_level: opportunity.experienceLevel || 'entry',
          }

          cv = await CVGenerator.generateCustomCV(userId, opportunityRequirements)
          console.log(`✅ Generated CUSTOM CV for: ${opportunity.title}`)
        } else {
          cv = await CVGenerator.generateGenericCV(userId)
        }
      } else {
        cv = await CVGenerator.generateGenericCV(userId)
      }
    }

    if (!cv) {
      return NextResponse.json({
        error: 'Unable to generate CV. Please complete your profile first.',
      }, { status: 400 })
    }

    console.log('📝 Generating Word document...')

    // Generate Word document using V4 (Standard Guidelines)
    const doc = await CVWordExportV4.generateWordDocument(cv)

    // Convert to buffer
    const buffer = await Packer.toBuffer(doc)

    // Generate filename
    const sanitizedName = cv.profile.name.replace(/[^a-z0-9]/gi, '_')
    const filename = `CV_${sanitizedName}_Custom.docx`
    console.log('✅ Word document generated:', filename)

    // Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error: any) {
    console.error('❌ Word export error:', error)
    return NextResponse.json({
      error: 'Failed to export CV',
      details: error.message,
    }, { status: 500 })
  }
}

// GET: Download generic CV as Word
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check credits first
    const cost = CREDIT_COSTS.CUSTOM_CV

    // @ts-ignore
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })

    if (!user || (user.credits || 0) < cost) {
      return NextResponse.json({
        error: 'Insufficient credits',
        required: cost,
        current: user?.credits || 0
      }, { status: 402 })
    }

    // Generate generic CV
    const cv = await CVGenerator.generateGenericCV(userId)

    if (!cv) {
      return NextResponse.json({
        error: 'No CV data available. Please complete your profile through the chat.',
      }, { status: 400 })
    }

    // Deduct credits
    // @ts-ignore
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost } }
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount: -cost,
          type: 'spent',
          action: 'customCV', // Ensure this matches allowed types or is essentially a string
          description: 'Custom CV Download',
          balanceBefore: user.credits,
          balanceAfter: user.credits - cost,
        }
      })
    ])

    // Generate Word document using V4
    const doc = await CVWordExportV4.generateWordDocument(cv)
    const buffer = await Packer.toBuffer(doc)
    const sanitizedName = cv.profile.name.replace(/[^a-z0-9]/gi, '_')
    const filename = `CV_${sanitizedName}.docx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error: any) {
    console.error('❌ Word export error:', error)
    return NextResponse.json({
      error: 'Failed to export CV',
      details: error.message,
    }, { status: 500 })
  }
}
