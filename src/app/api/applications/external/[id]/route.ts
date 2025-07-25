import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'
import { hasFeatureAccess } from '@/lib/pricing'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to external tracking feature
    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: { subscriptionPlan: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!hasFeatureAccess(user.subscriptionPlan, 'external_tracking')) {
      return NextResponse.json({ 
        error: 'External application tracking requires Career Builder or Career Accelerator plan',
        upgradeRequired: true 
      }, { status: 403 })
    }

    // Verify the application belongs to the user
    const existingApplication = await prisma.externalApplication.findFirst({
      where: {
        id: params.id,
        userId: session.user?.id
      }
    })

    if (!existingApplication) {
      return NextResponse.json({ 
        error: 'External application not found' 
      }, { status: 404 })
    }

    const body = await request.json()
    const {
      company,
      jobTitle,
      jobUrl,
      location,
      salary,
      status,
      appliedDate,
      followUpDate,
      interviewDate,
      responseDate,
      source,
      notes,
      contactPerson,
      contactEmail
    } = body

    const updateData: any = {}
    
    if (company !== undefined) updateData.company = company.trim()
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle.trim()
    if (jobUrl !== undefined) updateData.jobUrl = jobUrl?.trim() || null
    if (location !== undefined) updateData.location = location?.trim() || null
    if (salary !== undefined) updateData.salary = salary?.trim() || null
    if (status !== undefined) updateData.status = status
    if (appliedDate !== undefined) updateData.appliedDate = new Date(appliedDate)
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate) : null
    if (interviewDate !== undefined) updateData.interviewDate = interviewDate ? new Date(interviewDate) : null
    if (responseDate !== undefined) updateData.responseDate = responseDate ? new Date(responseDate) : null
    if (source !== undefined) updateData.source = source?.trim() || null
    if (notes !== undefined) updateData.notes = notes?.trim() || null
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson?.trim() || null
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail?.trim() || null

    const updatedApplication = await prisma.externalApplication.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedApplication)

  } catch (error) {
    console.error('Error updating external application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to external tracking feature
    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: { subscriptionPlan: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!hasFeatureAccess(user.subscriptionPlan, 'external_tracking')) {
      return NextResponse.json({ 
        error: 'External application tracking requires Career Builder or Career Accelerator plan',
        upgradeRequired: true 
      }, { status: 403 })
    }

    // Verify the application belongs to the user
    const existingApplication = await prisma.externalApplication.findFirst({
      where: {
        id: params.id,
        userId: session.user?.id
      }
    })

    if (!existingApplication) {
      return NextResponse.json({ 
        error: 'External application not found' 
      }, { status: 404 })
    }

    await prisma.externalApplication.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting external application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 