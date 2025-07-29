import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is premium (has file upload permissions)
    const userTier = (session.user as any)?.subscriptionPlan || 'FREE'
    const isPremium = userTier !== 'FREE'

    if (!isPremium) {
      return NextResponse.json({ 
        error: 'File uploads are only available for Premium users',
        code: 'PREMIUM_REQUIRED'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided' 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PDF, Word document, or image files only.' 
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }

    // Generate unique file identifier
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${session.user.id}_${timestamp}_${randomId}.${fileExtension}`
    
    // In production, you would upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll simulate file storage and return a simulated URL
    const fileUrl = `/uploads/applications/${fileName}`
    
    console.log('📁 File upload processed:', {
      userId: session.user.id,
      originalName: file.name,
      storedName: fileName,
      size: file.size,
      type: file.type,
      uploadType: type
    })

    // TODO: In production, implement actual file storage here
    // const uploadResult = await uploadToCloudStorage(file, fileName)

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('❌ Error uploading file:', error)
    return NextResponse.json({ 
      error: 'Failed to upload file. Please try again.' 
    }, { status: 500 })
  }
} 