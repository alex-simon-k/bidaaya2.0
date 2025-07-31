import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'
import { slackAutomation } from '@/lib/slack-service'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      companyName, 
      companySize, 
      industry, 
      role,
      firstName,
      lastName,
      companyOneLiner,
      goals,
      contactPersonType,
      contactPersonName,
      contactEmail,
      contactWhatsapp,
      companyWebsite,
      calendlyLink,
      referralSource,
      referralDetails,
      email // Add email to the request body
    } = body

    console.log('🔐 Convert-to-company API - Request body:', { 
      email, 
      companyName, 
      companySize, 
      industry 
    });

    if (!email) {
      console.log('❌ Convert-to-company API - No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Verify user exists and has the right to convert
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, email: true, role: true }
    })

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`✅ Authentication successful for: ${email}, role: ${user.role}`)

    // Validate required fields
    if (!companyName || !companySize || !industry || !role || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Company name, size, industry, role, and name are required' 
      }, { status: 400 })
    }

    if (!companyOneLiner || !goals || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Company description and goals are required' 
      }, { status: 400 })
    }

    if (!contactPersonType || !contactEmail || !contactWhatsapp || !companyWebsite) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Contact information and company website are required' 
      }, { status: 400 })
    }

    if (contactPersonType === 'other' && !contactPersonName) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Contact person name is required when selecting "Other"' 
      }, { status: 400 })
    }

    // Determine the actual contact person name
    const finalContactPersonName = contactPersonType === 'me' 
      ? `${firstName} ${lastName}`.trim()
      : contactPersonName

         // Update user to company role with all profile information
     const updatedUser = await prisma.user.update({
       where: { email: email },
       data: {
         role: 'COMPANY',
         profileCompleted: true,
         name: `${firstName} ${lastName}`.trim(),
         companyName,
         companySize,
         industry,
         companyRole: role,
         companyOneLiner,
         companyGoals: goals,
         contactPersonType,
         contactPersonName: finalContactPersonName,
         contactEmail,
         contactWhatsapp,
         companyWebsite,
         calendlyLink,
         referralSource,
         referralDetails,
         // Set subscription to free by default for companies - require payment for approval
         subscriptionStatus: 'FREE',
         subscriptionPlan: 'FREE'
       } as any
     })

         const userWithFields = updatedUser as any;
     
     console.log('✅ Successfully converted user to company:', {
       email: updatedUser.email,
       role: updatedUser.role,
       companyName: updatedUser.companyName,
       companySize: updatedUser.companySize,
       industry: updatedUser.industry,
       goals: userWithFields.companyGoals,
       contactPerson: userWithFields.contactPersonName
     })

     // Send Slack notification for new company signup
     try {
       await slackAutomation.notifyUserSignup(updatedUser.id)
       console.log(`📱 Slack notification sent for new company conversion: ${updatedUser.email}`)
     } catch (error) {
       console.error('📱 Failed to send Slack notification for company conversion:', error)
       // Don't fail the conversion if Slack notification fails
     }

     return NextResponse.json({ 
       success: true, 
       message: 'Successfully converted to company account',
       user: {
         id: updatedUser.id,
         email: updatedUser.email,
         role: updatedUser.role,
         profileCompleted: userWithFields.profileCompleted,
         companyName: updatedUser.companyName
       }
     })

  } catch (error) {
    console.error('❌ Error converting to company:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'Database error', 
        message: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while setting up your company profile'
    }, { status: 500 })
  }
} 