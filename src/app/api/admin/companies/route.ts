import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// GET - Fetch all companies for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const companies = await prisma.user.findMany({
      where: {
        role: 'COMPANY'
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
        contactEmail: true,
        contactPersonName: true,
        companyWebsite: true,
        lastActiveAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

// POST - Create new company account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      email,
      companyName,
      companyRole,
      industry,
      companySize,
      companyOneLiner,
      contactEmail,
      contactPersonName,
      companyWebsite
    } = body

    // Validate required fields
    if (!name || !email || !companyName) {
      return NextResponse.json({ 
        error: 'Required fields missing: name, email, companyName' 
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'A user with this email already exists' 
      }, { status: 409 })
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create the company user
    const newCompany = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role: 'COMPANY',
        // Note: In a real app, you'd want to integrate with your auth provider
        // For now, we'll create a basic record
        companyName,
        companyRole,
        industry,
        companySize,
        companyOneLiner,
        contactEmail: contactEmail || email,
        contactPersonName: contactPersonName || name,
        companyWebsite,
        profileCompleted: true,
        emailVerified: new Date(),
        // Set up basic timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // In a real implementation, you'd send a welcome email with login instructions
    console.log(`Company created: ${email} with temp password: ${tempPassword}`)

    return NextResponse.json({
      success: true,
      company: {
        id: newCompany.id,
        name: newCompany.name,
        email: newCompany.email,
        companyName: newCompany.companyName
      },
      tempPassword // In production, this would be sent via email instead
    })

  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}