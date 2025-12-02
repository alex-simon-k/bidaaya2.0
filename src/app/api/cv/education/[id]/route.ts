import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if education exists and belongs to user
    const existingEducation = await prisma.cVEducation.findUnique({
      where: { id: params.id }
    })

    if (!existingEducation) {
      return NextResponse.json({ error: 'Education not found' }, { status: 404 })
    }

    if (existingEducation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      level,
      program,
      institution,
      country,
      startDate,
      endDate,
      isCurrent,
      modules,
    } = body

    // Validate required fields
    if (!level || !program || !institution || !country || !startDate) {
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          required: ["level", "program", "institution", "country", "startDate"],
        },
        { status: 400 }
      )
    }

    // Validate modules (minimum 3 required)
    if (!modules || !Array.isArray(modules) || modules.length < 3) {
      return NextResponse.json(
        {
          error: "Modules validation failed",
          message: "Please add at least 3 relevant courses/modules",
          received: modules?.length || 0,
          required: 3
        },
        { status: 400 }
      )
    }

    // Parse dates
    const startDateObj = new Date(startDate + "-01")
    const endDateObj = endDate ? new Date(endDate + "-01") : null

    // Update education
    const education = await prisma.cVEducation.update({
      where: { id: params.id },
      data: {
        degreeType: level,
        degreeTitle: program,
        institution,
        institutionLocation: country,
        startDate: startDateObj,
        endDate: endDateObj,
        isCurrent: isCurrent || false,
        modules: modules || [],
      },
    })

    return NextResponse.json({
      success: true,
      education,
    })
  } catch (error: any) {
    console.error('Error updating education:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update education' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete the education entry if it belongs to the user
    const education = await prisma.cVEducation.findUnique({
      where: { id: params.id }
    })

    if (!education) {
      return NextResponse.json({ error: 'Education not found' }, { status: 404 })
    }

    if (education.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.cVEducation.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Education deleted' })
  } catch (error) {
    console.error('Error deleting education:', error)
    return NextResponse.json(
      { error: 'Failed to delete education' },
      { status: 500 }
    )
  }
}

