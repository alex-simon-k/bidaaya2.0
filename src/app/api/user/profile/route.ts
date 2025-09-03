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
        emailVerified: true,
        // Company-specific fields
        companyName: true,
        companyRole: true,
        companySize: true,
        industry: true,
        companyOneLiner: true,
        companyGoals: true,
        contactPersonName: true,
        contactPersonType: true,
        contactEmail: true,
        contactWhatsapp: true,
        companyWebsite: true,
        referralSource: true,
        referralDetails: true,
        image: true
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
      profileCompleted,
      // Company-specific fields
      companyName,
      companyRole,
      companySize,
      industry,
      companyOneLiner,
      companyGoals,
      contactPersonName,
      contactPersonType,
      contactEmail,
      contactWhatsapp,
      companyWebsite,
      referralSource,
      referralDetails,
      image
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
    
    // Company-specific fields
    if (companyName !== undefined) updateData.companyName = companyName
    if (companyRole !== undefined) updateData.companyRole = companyRole
    if (companySize !== undefined) updateData.companySize = companySize
    if (industry !== undefined) updateData.industry = industry
    if (companyOneLiner !== undefined) updateData.companyOneLiner = companyOneLiner
    if (companyGoals !== undefined) updateData.companyGoals = Array.isArray(companyGoals) ? companyGoals : [companyGoals]
    if (contactPersonName !== undefined) updateData.contactPersonName = contactPersonName
    if (contactPersonType !== undefined) updateData.contactPersonType = contactPersonType
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail
    if (contactWhatsapp !== undefined) updateData.contactWhatsapp = contactWhatsapp
    if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite
    if (referralSource !== undefined) updateData.referralSource = referralSource
    if (referralDetails !== undefined) updateData.referralDetails = referralDetails
    if (image !== undefined) updateData.image = image
    
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
    
    // Check completion requirements based on user role
    const currentUserRole = session.user?.role
    
    // PHASE 1 COMPLETION: Basic profile setup (5 initial questions)
    let hasPhase1Requirements = false
    if (currentUserRole === 'STUDENT') {
      hasPhase1Requirements = name && (university || major || subjects || skills || educationStatus || interests) && terms
    } else if (currentUserRole === 'COMPANY') {
      hasPhase1Requirements = name && companyName && companySize && industry && companyOneLiner
    }
    
    // PHASE 2 COMPLETION: Detailed profile (guided tutorial - educational details)
    const isPhase2Update = !!(university || highSchool || major || subjects || bio || (interests && interests.length > 0))
    
    console.log('🔍 Profile completion analysis:', {
      hasPhase1Requirements,
      isPhase2Update,
      role: currentUserRole,
      explicitFlag: profileCompleted
    })
    
    // Get current user status BEFORE update to check if this is first-time completion
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: { 
        profileCompleted: true,
        onboardingStepsCompleted: true
      }
    })
    
    const wasAlreadyCompleted = currentUser?.profileCompleted === true
    const isFirstTimeCompletion = hasPhase1Requirements && !wasAlreadyCompleted
    
    // CRITICAL FIX: Only mark profileCompleted=true after Phase 1, not Phase 2
    if (profileCompleted !== undefined && profileCompleted === false) {
      // Explicit false from guided tutorial early exit - respect it
      updateData.profileCompleted = false
      console.log('🎯 EXPLICIT profileCompleted=false received (early exit)')
    } else if (hasPhase1Requirements) {
      // Phase 1 completion = true profile completion
      updateData.profileCompleted = true
      console.log('✅ PHASE 1 COMPLETED - Marking profile as completed in database')
      if (isFirstTimeCompletion) {
        console.log('🎉 FIRST TIME PHASE 1 COMPLETION - will send Slack notification')
      } else {
        console.log('🔄 Phase 1 already completed - NO Slack notification')
      }
    } else {
      console.log('❌ NOT marking profile as completed - missing Phase 1 requirements')
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

    // Track analytics for first-time profile completion and phases
    const currentSteps = currentUser?.onboardingStepsCompleted || []
    const hasEducationDetails = !!(university || highSchool || major || subjects)
    
    console.log('🔍 Phase tracking analysis:', {
      isFirstTimeCompletion,
      hasEducationDetails,
      currentSteps,
      profileCompleted: updatedUser.profileCompleted,
      userEmail: session.user?.email
    })
    
    // Track Phase 1 completion for first-time profile completion
    if (isFirstTimeCompletion) {
      try {
        await AnalyticsTracker.trackProfileCompleted(session.user?.id!)
        await AnalyticsTracker.trackPhase1Completed(session.user?.id!)
        console.log('📊 ✅ Analytics tracked: Profile completion and Phase 1 completion for', session.user?.email)
      } catch (analyticsError) {
        console.error('Failed to track profile completion analytics (non-blocking):', analyticsError)
        // Don't block the user's flow if analytics fails
      }
    }

    // Track Phase 2 completion when detailed education profile is added
    if (hasEducationDetails && !currentSteps.includes('phase_2_completed')) {
      try {
        await AnalyticsTracker.trackPhase2Completed(session.user?.id!)
        console.log('📊 ✅ Analytics tracked: Phase 2 completion (education details added) for', session.user?.email)
      } catch (analyticsError) {
        console.error('Failed to track Phase 2 completion analytics (non-blocking):', analyticsError)
      }
    } else if (hasEducationDetails && currentSteps.includes('phase_2_completed')) {
      console.log('📊 ⏭️ Phase 2 already tracked for', session.user?.email)
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