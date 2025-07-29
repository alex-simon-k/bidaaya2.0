import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"

const prisma = new PrismaClient()

// GET - Get user profile data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        dateOfBirth: true,
        education: true,
        highSchool: true,
        university: true,
        major: true,
        goal: true,
        interests: true,
        skills: true,
        bio: true,
        whatsapp: true,
        linkedin: true,
        calendlyLink: true,
        graduationYear: true,
        mena: true,
        terms: true,
        profileCompleted: true,
        emailVerified: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      profile: user
    })

  } catch (error) {
    console.error('❌ Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      dateOfBirth,
      educationStatus,
      highSchool,
      university,
      major,
      subjects,
      goal,
      interests,
      skills,
      bio,
      whatsapp,
      linkedin,
      calendlyLink,
      graduationYear,
      mena,
      terms,
      discoveryProfile,
      discoveryCompleted
    } = body

    // Build update data object
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth
    if (educationStatus !== undefined) updateData.education = educationStatus // Map to correct field
    if (highSchool !== undefined) updateData.highSchool = highSchool
    if (university !== undefined) updateData.university = university
    if (major !== undefined) updateData.major = major
    if (subjects !== undefined) updateData.major = subjects  // Map subjects to major field
    if (goal !== undefined) updateData.goal = Array.isArray(goal) ? goal : [goal]
    if (interests !== undefined) updateData.interests = Array.isArray(interests) ? interests : [interests]
    if (skills !== undefined) updateData.skills = skills
    if (bio !== undefined) updateData.bio = bio
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp
    if (linkedin !== undefined) updateData.linkedin = linkedin
    if (calendlyLink !== undefined) updateData.calendlyLink = calendlyLink
    if (graduationYear !== undefined) updateData.graduationYear = graduationYear
    if (mena !== undefined) updateData.mena = mena
    if (terms !== undefined) updateData.terms = terms
    
    // If this is a comprehensive profile update (has key fields), mark profile as completed
    console.log('🔍 Profile completion check:', {
      name: !!name,
      university: !!university,
      major: !!major,
      subjects: !!subjects,
      skills: !!skills,
      nameValue: name,
      universityValue: university,
      subjectsValue: subjects
    })
    
    const hasRequiredFields = name && (university || major || subjects || skills) && terms
    console.log('🔍 Has required fields for completion:', hasRequiredFields)
    
    if (hasRequiredFields) {
      updateData.profileCompleted = true
      console.log('✅ Marking profile as completed in database - profileCompleted will be set to TRUE')
    } else {
      console.log('❌ NOT marking profile as completed - missing required fields')
    }
    
    // Store discovery quiz data in bio field temporarily
    // TODO: Add discoveryProfile JSON field to User schema
    if (discoveryProfile !== undefined) {
      updateData.bio = JSON.stringify({
        originalBio: updateData.bio || bio,
        discoveryProfile,
        discoveryCompleted: discoveryCompleted || false
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user?.id },
      data: updateData,
             select: {
         id: true,
         name: true,
         email: true,
         role: true,
         university: true,
         major: true,
         skills: true,
                 bio: true,
        linkedin: true,
        calendlyLink: true,
        graduationYear: true,
        profileCompleted: true,
        emailVerified: true
       }
    })

    console.log(`✅ User profile updated for ${session.user?.email}:`, {
      fieldsUpdated: Object.keys(updateData)
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedUser
    })

  } catch (error) {
    console.error('❌ Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}