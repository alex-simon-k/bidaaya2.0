import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

// POST - Create a new external company account
export async function POST(request: NextRequest) {
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
      adminNotes
    } = body

    // Validation
    if (!companyName) {
      return NextResponse.json({ 
        error: 'Company name is required' 
      }, { status: 400 })
    }

    // Check if email already exists
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json({ 
          error: `Email ${email} is already in use by another account` 
        }, { status: 400 })
      }
    }

    // Generate placeholder email if not provided
    const finalEmail = email || `external+${companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}@bidaaya.ae`

    // Check if placeholder email exists
    const existingPlaceholder = await prisma.user.findUnique({
      where: { email: finalEmail }
    })

    if (existingPlaceholder) {
      return NextResponse.json({ 
        error: `A company with similar name already exists. Please provide a unique email.` 
      }, { status: 400 })
    }

    // Create company account
    const company = await prisma.user.create({
      data: {
        email: finalEmail,
        name: companyName,
        companyName: companyName,
        role: 'COMPANY',
        industry: industry || null,
        companySize: companySize || null,
        companyWebsite: companyWebsite || null,
        location: location || null,
        companyOneLiner: companyOneLiner || null,
        companyRole: companyRole || null,
        companyGoals: companyGoals || [],
        contactPersonName: contactPersonName || null,
        contactPersonType: contactPersonType || null,
        contactEmail: contactEmail || null,
        contactWhatsapp: contactWhatsapp || null,
        calendlyLink: calendlyLink || null,
        referralSource: referralSource || null,
        referralDetails: referralDetails || null,
        bio: bio || null,
        image: image || null,
        isExternalCompany: true,
        companySource: 'admin_created',
        profileCompleted: false,
        emailVerified: null, // Not verified since admin-created
        createdAt: new Date(),
        updatedAt: new Date()
      },
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
        image: true,
        isExternalCompany: true,
        companySource: true,
        createdAt: true
      }
    })

    console.log(`✅ External company created: ${companyName} (${company.id})`)

    return NextResponse.json({
      success: true,
      company,
      message: `Company "${companyName}" created successfully`
    })

  } catch (error) {
    console.error('Error creating external company:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create company' 
    }, { status: 500 })
  }
}

