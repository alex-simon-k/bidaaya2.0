import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"
import { slackAutomation } from '@/lib/slack-service'
import { AnalyticsTracker } from '@/lib/analytics-tracker'

const prisma = new PrismaClient()

// GET - Get user profile data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔍 GET profile request - session user ID:', session?.user?.id)
    console.log('🔍 GET profile request - session user email:', session?.user?.email)

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
        subjects: true,
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

    console.log('🔍 GET profile - Found user:', user?.id)
    console.log('🔍 GET profile - User calendlyLink:', user?.calendlyLink)

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
    console.log('🔍 Profile update request body:', body)
    console.log('🔍 calendlyLink value received:', body.calendlyLink)
    
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
      discoveryCompleted,
      profileCompleted
    } = body

    // Build update data object
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (dateOfBirth !== undefined) {
      // Convert date string to proper DateTime format for Prisma
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth + 'T00:00:00.000Z') : null
    }
    if (educationStatus !== undefined) updateData.education = educationStatus // Map to correct field
    if (highSchool !== undefined) updateData.highSchool = highSchool
    if (university !== undefined) updateData.university = university
    if (major !== undefined) updateData.major = major
    if (subjects !== undefined) updateData.subjects = subjects  // Keep subjects as subjects field, not major
    if (goal !== undefined) updateData.goal = Array.isArray(goal) ? goal : [goal]
    if (interests !== undefined) updateData.interests = Array.isArray(interests) ? interests : [interests]
    if (skills !== undefined) updateData.skills = skills
    if (bio !== undefined) updateData.bio = bio
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp
    if (linkedin !== undefined) updateData.linkedin = linkedin
    if (calendlyLink !== undefined) {
      // Clean up malformed URLs - remove duplicate protocols and domains
      let cleanedLink = calendlyLink
      if (calendlyLink && typeof calendlyLink === 'string') {
        // Remove duplicate https:// prefixes
        cleanedLink = calendlyLink.replace(/^https:\/\/https:\/\//, 'https://')
        // Remove duplicate domain concatenations
        cleanedLink = cleanedLink.replace(/(calendly\.com\/[^\/]+)calendly\.com\//, '$1')
        console.log('🔍 Cleaned calendlyLink from:', calendlyLink, 'to:', cleanedLink)
      }
      updateData.calendlyLink = cleanedLink
      console.log('🔍 Setting calendlyLink in updateData:', cleanedLink)
    }
    if (graduationYear !== undefined) updateData.graduationYear = graduationYear
    if (mena !== undefined) updateData.mena = mena === 'Yes' || mena === true  // Handle radio button value
    if (terms !== undefined) updateData.terms = terms
    
    console.log('🔍 Final updateData object:', updateData)
    
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
    
    // Get current user status BEFORE update to check if this is first-time completion
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: { profileCompleted: true }
    })
    
    const wasAlreadyCompleted = currentUser?.profileCompleted === true
    const isFirstTimeCompletion = hasRequiredFields && !wasAlreadyCompleted
    
    // Handle explicit profileCompleted flag (from guided tutorial)
    if (profileCompleted !== undefined) {
      updateData.profileCompleted = profileCompleted
      console.log('🎯 EXPLICIT profileCompleted flag received:', profileCompleted)
    } else if (hasRequiredFields) {
      updateData.profileCompleted = true
      console.log('✅ Marking profile as completed in database - profileCompleted will be set to TRUE')
      if (isFirstTimeCompletion) {
        console.log('🎉 FIRST TIME COMPLETION - will send Slack notification')
      } else {
        console.log('🔄 Profile already completed - NO Slack notification')
      }
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
      fieldsUpdated: Object.keys(updateData),
      profileCompleted: updatedUser.profileCompleted
    })
    
    // CRITICAL: If profileCompleted was updated, log this for debugging
    if (updateData.profileCompleted !== undefined) {
      console.log('🔑 PROFILE COMPLETION STATUS UPDATE - Database now shows:', updatedUser.profileCompleted)
      console.log('🔄 NextAuth should refresh session token on next request')
    }

    // Track analytics for first-time profile completion
    if (isFirstTimeCompletion) {
      try {
        await AnalyticsTracker.trackProfileCompleted(session.user?.id!)
        console.log('📊 Analytics tracked: Profile completion timestamp saved')
      } catch (analyticsError) {
        console.error('Failed to track profile completion analytics (non-blocking):', analyticsError)
        // Don't block the user's flow if analytics fails
      }
    }

    // Send Slack notification ONLY for first-time profile completion (prevents duplicates)
    if (isFirstTimeCompletion) {
      try {
        await slackAutomation.notifyUserSignup(session.user?.id!)
        console.log('📱 Slack notification sent for FIRST-TIME user profile completion')
      } catch (slackError) {
        console.error('Failed to send Slack notification (non-blocking):', slackError)
        // Don't block the user's flow if Slack fails
      }
    }

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