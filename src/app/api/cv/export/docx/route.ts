/**
 * CV Word Export API
 * 
 * Generates and downloads CV as an editable Word document
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { CVGenerator } from '@/lib/cv-generator'
import { CVWordExport } from '@/lib/cv-word-export'
import { Packer } from 'docx'

export const dynamic = 'force-dynamic'

interface ExportRequest {
  opportunityId?: string
  opportunityType?: 'internal' | 'external'
  projectId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body: ExportRequest = await request.json()
    const { opportunityId, opportunityType, projectId } = body

    console.log('📄 Word Export Request:', { opportunityId, opportunityType, projectId })

    // Generate CV (generic or custom)
    let cv
    if (!opportunityId && !projectId) {
      cv = await CVGenerator.generateGenericCV(userId)
    } else {
      // Build opportunity requirements (same logic as cv/generate/route.ts)
      // For now, generate generic - can enhance later
      cv = await CVGenerator.generateGenericCV(userId)
    }

    if (!cv) {
      return NextResponse.json({
        error: 'Unable to generate CV. Please complete your profile first.',
      }, { status: 400 })
    }

    console.log('📝 Generating Word document...')

    // Generate Word document
    const doc = await CVWordExport.generateWordDocument(cv)

    // Convert to buffer
    const buffer = await Packer.toBuffer(doc)

    // Generate filename
    const filename = CVWordExport.generateFilename(
      cv.profile.name,
      cv.customizedFor !== 'General Purpose' ? cv.customizedFor : undefined
    )

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

    // Generate generic CV
    const cv = await CVGenerator.generateGenericCV(userId)

    if (!cv) {
      return NextResponse.json({
        error: 'No CV data available. Please complete your profile through the chat.',
      }, { status: 400 })
    }

    // Generate Word document
    const doc = await CVWordExport.generateWordDocument(cv)
    const buffer = await Packer.toBuffer(doc)
    const filename = CVWordExport.generateFilename(cv.profile.name)

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

