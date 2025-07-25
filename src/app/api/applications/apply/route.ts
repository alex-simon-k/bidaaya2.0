import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"'
import { PrismaClient } from '@prisma/client'
import { 
  checkApplicationLimits, 
  incrementApplicationCount, 
  shouldResetMonthlyApplications,
  resetMonthlyApplications,
  getApplicationUpgradePrompt 
} from '@/lib/application-limits'
import { calculateCompatibilityScore, updateApplicationScore } from '@/lib/ai-scoring'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, coverLetter, motivation, additionalDocument } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get user with application limits data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptionPlan: true,
        applicationsThisMonth: true,
        lastMonthlyReset: true,
        name: true,
        email: true,
        university: true,
        major: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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
          userId: session.user.id,
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

    // Create the application
    const application = await prisma.application.create({
      data: {
        projectId,
        userId: session.user.id,
        status: 'PENDING',
        coverLetter,
        motivation,
        additionalDocument,
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

    // Increment application count
    await incrementApplicationCount(session.user.id, prisma)

    // Update project application count
    await prisma.project.update({
      where: { id: projectId },
      data: {
        currentApplications: {
          increment: 1
        }
      }
    })

    // Calculate compatibility score asynchronously
    try {
      const compatibilityResult = await calculateCompatibilityScore(
        session.user.id, 
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
      where: { id: session.user.id },
      select: {
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