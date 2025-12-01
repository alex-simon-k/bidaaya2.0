import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'
import { 
  checkApplicationLimits, 
  incrementApplicationCount, 
  shouldResetMonthlyApplications,
  resetMonthlyApplications,
  getApplicationUpgradePrompt 
} from '@/lib/application-limits'
import { calculateCompatibilityScore, updateApplicationScore } from '@/lib/ai-scoring'
import { AnalyticsTracker } from '@/lib/analytics-tracker'
import { slackService } from '@/lib/slack-service'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      projectId, 
      whyInterested,
      proposedApproach,
      additionalDocument,
      // Legacy fields (for backward compatibility)
      personalStatement,
      relevantExperience,
      projectUnderstanding,
      weeklyAvailability,
      startDate,
      commitmentLevel
    } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Validate required fields for simplified application
    if (!whyInterested || !proposedApproach) {
      if (!personalStatement && !whyInterested) {
        return NextResponse.json({ error: 'Why interested is required' }, { status: 400 })
      }
      if (!proposedApproach) {
        return NextResponse.json({ error: 'Proposed approach is required' }, { status: 400 })
      }
    }

    // Get user with application limits data
    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: {
        id: true,
        subscriptionPlan: true,
        applicationsThisMonth: true,
        lastMonthlyReset: true,
        name: true,
        email: true,
        university: true,
        major: true,
        highSchool: true,
        subjects: true,
        role: true,
        _count: {
          select: {
            cvEducation: true,
            cvExperience: true,
            cvSkills: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if student has completed Phase 2 (CV Builder with minimum requirements)
    if (user.role === 'STUDENT') {
      const hasEducation = user._count.cvEducation > 0
      const hasExperience = user._count.cvExperience > 0
      const hasSkills = user._count.cvSkills > 0
      const isPhase2Complete = (hasEducation || hasExperience) && hasSkills

      if (!isPhase2Complete) {
        // Determine what's missing for better error message
        const missingItems = []
        if (!hasEducation && !hasExperience) {
          missingItems.push('at least 1 Education or Experience entry')
        }
        if (!hasSkills) {
          missingItems.push('at least 1 Skill')
        }
        
        const errorMessage = missingItems.length > 0 
          ? `Please complete your CV profile. You need: ${missingItems.join(' and ')}`
          : 'Please complete your CV profile before applying to opportunities'
        
        return NextResponse.json({ 
          error: errorMessage,
          code: 'PHASE_2_INCOMPLETE',
          redirectTo: '/dashboard?cv_edit=true',
          missing: missingItems
        }, { status: 403 })
      }
    }

    // Reset monthly applications if needed
    if (shouldResetMonthlyApplications(user)) {
      await resetMonthlyApplications(user.id, prisma)
      user.applicationsThisMonth = 0 // Update local object
    }

    // Check if user has already applied to this project
    const existingApplication = await prisma.application.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user?.id,
        },
      },
    })
    
    if (existingApplication) {
      return NextResponse.json({ 
        error: 'You have already applied to this project',
        code: 'ALREADY_APPLIED'
      }, { status: 400 })
    }

    // Check application limits
    const limits = checkApplicationLimits(user)
    
    if (!limits.canApply) {
      const upgradePrompt = getApplicationUpgradePrompt(user)
      return NextResponse.json({ 
        error: limits.upgradeReason,
        limits,
        upgradePrompt,
        code: 'LIMIT_REACHED'
      }, { status: 403 })
    }

    // Verify project exists and is live
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            name: true,
            calendlyLink: true,
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status !== 'LIVE') {
      return NextResponse.json({ 
        error: 'This project is not currently accepting applications' 
      }, { status: 400 })
    }

    // Create the application - supports both simplified and legacy formats
    const application = await prisma.application.create({
      data: {
        projectId,
        userId: session.user?.id,
        status: 'PENDING',
        // Store in legacy format for backward compatibility
        coverLetter: personalStatement || proposedApproach || '', // Use proposedApproach if personalStatement not provided
        motivation: whyInterested || `${whyInterested || ''}\n\nRelevant Experience:\n${relevantExperience || ''}\n\nProject Understanding:\n${projectUnderstanding || ''}\n\nProposed Approach:\n${proposedApproach || ''}\n\nAvailability:\n${weeklyAvailability || ''}\n\nStart Date: ${startDate || ''}\n\nCommitment Level: ${commitmentLevel || ''}`,
        additionalDocument,
        // Structured fields (if available in schema)
        whyInterested,
        proposedApproach,
        personalStatement,
        relevantExperience,
        projectUnderstanding,
        weeklyAvailability,
        startDate,
        commitmentLevel,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            company: {
              select: {
                companyName: true,
                name: true,
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            university: true,
            major: true,
          }
        }
      }
    })

    // Track analytics for first application (if applicable)
    try {
      await AnalyticsTracker.trackFirstApplication(session.user?.id)
      console.log('📊 Analytics tracked: First application timestamp (if first time)')
    } catch (analyticsError) {
      console.error('Failed to track first application analytics (non-blocking):', analyticsError)
      // Don't block the user's flow if analytics fails
    }

    // Increment application count
    await incrementApplicationCount(session.user?.id, prisma)

    // Update project application count
    await prisma.project.update({
      where: { id: projectId },
      data: {
        currentApplications: {
          increment: 1
        }
      }
    })

    // Check for application milestones and send Slack notifications
    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        title: true,
        currentApplications: true
      }
    })

    if (updatedProject) {
      const applicationCount = updatedProject.currentApplications || 0
      const milestones = [10, 25, 50, 100]
      if (milestones.includes(applicationCount)) {
        try {
          await slackService.notifyApplicationMilestone(
            updatedProject.title, 
            applicationCount
          )
          console.log(`📱 Slack milestone notification sent: ${updatedProject.title} reached ${applicationCount} applications`)
        } catch (slackError) {
          console.error('Failed to send Slack milestone notification (non-blocking):', slackError)
        }
      }
    }

    // Calculate compatibility score asynchronously
    try {
      const compatibilityResult = await calculateCompatibilityScore(
        session.user?.id, 
        projectId
      )
      
      await updateApplicationScore(application.id, compatibilityResult)
      
      console.log(`✅ Compatibility score calculated: ${compatibilityResult.score}% for application ${application.id}`)
    } catch (scoreError) {
      console.error('Failed to calculate compatibility score:', scoreError)
      // Don't fail the application if scoring fails
    }

    // Send confirmation email (async)
    try {
      await sendApplicationConfirmationEmail(application)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the application if email fails
    }

    // Get updated limits for response
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: {
        id: true,
        applicationsThisMonth: true,
        subscriptionPlan: true,
        lastMonthlyReset: true,
      }
    })

    const updatedLimits = checkApplicationLimits(updatedUser!)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully! 🎉',
      application: {
        id: application.id,
        projectTitle: application.project.title,
        companyName: application.project.company.companyName || application.project.company.name,
        status: application.status,
        submittedAt: application.createdAt,
      },
      limits: updatedLimits,
      upgradePrompt: updatedLimits.requiresUpgrade ? getApplicationUpgradePrompt(updatedUser!) : null,
    })

  } catch (error) {
    console.error('Error submitting application:', error)
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again.' },
      { status: 500 }
    )
  }
}

async function sendApplicationConfirmationEmail(application: any) {
  // TODO: Implement email service
  // This would send a confirmation email to the student
  console.log(`📧 Would send confirmation email for application ${application.id}`)
  
  // Example structure:
  /*
  await emailService.send({
    to: application.user.email,
    template: 'application-confirmation',
    data: {
      studentName: application.user.name,
      projectTitle: application.project.title,
      companyName: application.project.company.companyName,
      applicationId: application.id,
    }
  })
  */
} 
