import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    console.log('🔐 Profile GET API - Email:', email);
    
    if (!email) {
      console.log('❌ Profile GET API - No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        university: true,
        major: true,
        graduationYear: true,
        skills: true,
        bio: true,
        linkedin: true,
        whatsapp: true,
        subjects: true,
        goal: true,
        interests: true,
        highSchool: true,
        mena: true,
        companyName: true,
        companySize: true,
        industry: true,
        companyRole: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('--- PROFILE UPDATE REQUEST RECEIVED ---')

  try {
    const body = await request.json()
    const { email } = body
    
    console.log('🔐 Profile POST API - Email:', email);
    console.log('🔐 Profile POST API - Request body keys:', Object.keys(body));
    
    if (!email) {
      console.log('❌ Profile POST API - No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, email: true, role: true }
    })

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`✅ Authentication successful for: ${email}, role: ${user.role}`)
    console.log('📝 Received profile data:', body)

    const updateData: any = {
      profileCompleted: true,
    }

    if (body.name) updateData.name = body.name
    if (body.bio) updateData.bio = body.bio
    if (body.linkedin) updateData.linkedin = body.linkedin
    if (body.whatsapp) updateData.whatsapp = body.whatsapp

    if (user.role === 'STUDENT') {
      if (body.university) updateData.university = body.university
      if (body.highSchool) updateData.highSchool = body.highSchool
      if (body.subjects) updateData.subjects = body.subjects
      if (body.dateOfBirth) updateData.dateOfBirth = new Date(body.dateOfBirth)
      if (body.goal) updateData.goal = Array.isArray(body.goal) ? body.goal : [body.goal]
      if (body.interests) updateData.interests = Array.isArray(body.interests) ? body.interests : [body.interests]
      if (typeof body.mena === 'boolean') updateData.mena = body.mena
      if (typeof body.terms === 'boolean') updateData.terms = body.terms
    }

    if (user.role === 'COMPANY') {
      if (body.companyName) updateData.companyName = body.companyName
      if (body.companySize) updateData.companySize = body.companySize
      if (body.industry) updateData.industry = body.industry
      if (body.companyRole) updateData.companyRole = body.companyRole
      if (body.companyOneLiner) updateData.companyOneLiner = body.companyOneLiner
      if (body.companyGoals) updateData.companyGoals = Array.isArray(body.companyGoals) ? body.companyGoals : [body.companyGoals]
      if (body.contactPersonType) updateData.contactPersonType = body.contactPersonType
      if (body.contactPersonName) updateData.contactPersonName = body.contactPersonName
      if (body.contactEmail) updateData.contactEmail = body.contactEmail
      if (body.contactWhatsapp) updateData.contactWhatsapp = body.contactWhatsapp
      if (body.companyWebsite) updateData.companyWebsite = body.companyWebsite
    }

    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: updateData,
    })

    console.log('✅ User profile updated successfully in database.')
    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully' 
    })
  } catch (error) {
    console.error('❌ Error updating profile:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to update profile'
    }, { status: 500 })
  }
}