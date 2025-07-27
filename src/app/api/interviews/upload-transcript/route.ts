import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const candidateId = formData.get('candidateId') as string
    const projectId = formData.get('projectId') as string
    const type = formData.get('type') as string

    if (!file || !candidateId || !projectId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'text/plain', 
      'application/pdf', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'video/mp4'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type' 
      }, { status: 400 })
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB' 
      }, { status: 400 })
    }

    // For now, we'll simulate file storage
    // In production, you would upload to S3, Google Cloud Storage, etc.
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fileName = file.name
    const fileUrl = `/uploads/transcripts/${fileId}`

    console.log('📁 File upload simulation:', {
      fileId,
      fileName,
      fileSize: file.size,
      fileType: file.type,
      candidateId,
      projectId,
      type
    })

    // Create interview record if it doesn't exist
    let interview = await prisma.interview.findFirst({
      where: {
        candidateId,
        projectId
      }
    })

    if (!interview) {
      interview = await prisma.interview.create({
        data: {
          candidateId,
          projectId,
          interviewDate: new Date(),
          interviewer: session.user.name || 'Unknown',
          status: 'completed',
          notes: '',
          score: 0
        }
      })
    }

    // Update interview with file information
    const updateData: any = {}
    if (type === 'transcript') {
      updateData.transcriptFileId = fileId
      updateData.transcriptFileName = fileName
      updateData.transcriptFileUrl = fileUrl
    } else if (type === 'audio') {
      updateData.audioFileId = fileId
      updateData.audioFileName = fileName
      updateData.audioFileUrl = fileUrl
    }

    await prisma.interview.update({
      where: { id: interview.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      id: interview.id,
      fileId,
      fileName,
      fileUrl,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('❌ Error uploading transcript:', error)
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 })
  }
} 