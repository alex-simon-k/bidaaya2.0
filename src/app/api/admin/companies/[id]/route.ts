import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

// GET - Fetch a single company by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const company = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'COMPANY'
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        role: true,
        industry: true,
        companySize: true,
        companyWebsite: true,
        location: true,
        companyOneLiner: true,
        companyGoals: true,
        contactPersonName: true,
        contactPersonType: true,
        contactEmail: true,
        contactWhatsapp: true,
        calendlyLink: true,
        image: true,
        isExternalCompany: true,
        companySource: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
        subscriptionPlan: true
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({ company })

  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch company' 
    }, { status: 500 })
  }
}

// PUT - Update a company
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      companyName,
      email,
      industry,
      companySize,
      companyWebsite,
      location,
      companyOneLiner,
      companyRole,
      companyGoals,
      contactPersonName,
      contactPersonType,
      contactEmail,
      contactWhatsapp,
      calendlyLink,
      referralSource,
      referralDetails,
      bio,
      image,
      isExternalCompany,
      companySource
    } = body

    // Check if company exists
    const existingCompany = await prisma.user.findUnique({
      where: { id: params.id, role: 'COMPANY' }
    })

    if (!existingCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // If email is being changed, check for conflicts
    if (email && email !== existingCompany.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json({ 
          error: `Email ${email} is already in use` 
        }, { status: 400 })
      }
    }

    // Build update data object (only include provided fields)
    const updateData: any = {
      updatedAt: new Date()
    }

    if (companyName !== undefined) {
      updateData.companyName = companyName
      updateData.name = companyName
    }
    if (email !== undefined) updateData.email = email
    if (industry !== undefined) updateData.industry = industry
    if (companySize !== undefined) updateData.companySize = companySize
    if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite
    if (location !== undefined) updateData.location = location
    if (companyOneLiner !== undefined) updateData.companyOneLiner = companyOneLiner
    if (companyRole !== undefined) updateData.companyRole = companyRole
    if (companyGoals !== undefined) updateData.companyGoals = companyGoals
    if (contactPersonName !== undefined) updateData.contactPersonName = contactPersonName
    if (contactPersonType !== undefined) updateData.contactPersonType = contactPersonType
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail
    if (contactWhatsapp !== undefined) updateData.contactWhatsapp = contactWhatsapp
    if (calendlyLink !== undefined) updateData.calendlyLink = calendlyLink
    if (referralSource !== undefined) updateData.referralSource = referralSource
    if (referralDetails !== undefined) updateData.referralDetails = referralDetails
    if (bio !== undefined) updateData.bio = bio
    if (image !== undefined) updateData.image = image
    if (isExternalCompany !== undefined) updateData.isExternalCompany = isExternalCompany
    if (companySource !== undefined) updateData.companySource = companySource

    // Update company
    const updatedCompany = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        industry: true,
        companySize: true,
        companyWebsite: true,
        location: true,
        companyOneLiner: true,
        companyGoals: true,
        contactPersonName: true,
        contactPersonType: true,
        contactEmail: true,
        contactWhatsapp: true,
        calendlyLink: true,
        image: true,
        isExternalCompany: true,
        companySource: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log(`✅ Company updated: ${updatedCompany.companyName} (${params.id})`)

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      message: 'Company updated successfully'
    })

  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update company' 
    }, { status: 500 })
  }
}

// DELETE - Delete a company
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if company exists
    const company = await prisma.user.findUnique({
      where: { id: params.id, role: 'COMPANY' },
      include: {
        projects: true,
        externalOpportunities: true
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if company has active projects or opportunities
    const hasActiveProjects = company.projects.some(p => p.status === 'LIVE')
    const hasActiveOpportunities = company.externalOpportunities.some(o => o.isActive)

    if (hasActiveProjects || hasActiveOpportunities) {
      return NextResponse.json({ 
        error: 'Cannot delete company with active projects or opportunities. Please close them first.' 
      }, { status: 400 })
    }

    // Delete company
    await prisma.user.delete({
      where: { id: params.id }
    })

    console.log(`✅ Company deleted: ${company.companyName} (${params.id})`)

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete company' 
    }, { status: 500 })
  }
}
