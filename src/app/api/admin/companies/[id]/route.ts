import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT - Update company by ID
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

    const { id } = params
    const body = await request.json()

    // Extract fields that can be updated
    const {
      name,
      email,
      companyName,
      companyRole,
      industry,
      companySize,
      companyOneLiner,
      contactEmail,
      contactWhatsapp,
      companyWebsite,
      calendlyLink,
      referralSource,
      referralDetails
    } = body

    // Update the company
    const updatedCompany = await prisma.user.update({
      where: { 
        id,
        role: 'COMPANY' // Ensure we only update companies
      },
      data: {
        name,
        email: email?.toLowerCase(),
        companyName,
        companyRole,
        industry,
        companySize,
        companyOneLiner,
        contactEmail,
        contactWhatsapp,
        companyWebsite,
        calendlyLink,
        referralSource,
        referralDetails,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        profileCompleted: true,
        companyName: true,
        companyRole: true,
        industry: true,
        companySize: true,
        companyOneLiner: true,
        goal: true,
        contactPersonType: true,
        contactPersonName: true,
        contactEmail: true,
        contactWhatsapp: true,
        companyWebsite: true,
        calendlyLink: true,
        referralSource: true,
        referralDetails: true,
        lastActiveAt: true
      }
    })

    return NextResponse.json({ 
      success: true,
      company: updatedCompany 
    })

  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}
