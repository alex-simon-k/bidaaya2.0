import { PrismaClient } from '@prisma/client'
import { emailAutomation } from './email-automation'
import { aiScoring, ApplicationScore } from './ai-scoring'

const prisma = new PrismaClient()

export interface InterviewAutomationFeatures {
  canSeeAllApplicants: boolean
  canSeeScores: boolean
  automatedEmails: boolean
  fullInterviewService: boolean
  candidatePoolSize: number
  manualEmailsOnly: boolean
}

export interface CandidateInfo {
  id: string
  name: string
  email: string
  university?: string
  major?: string
  skills: string[]
  score?: number
  rank?: number
  applicationId: string
}

export class InterviewAutomationService {
  /**
   * Get features available based on subscription tier
   */
  getAutomationFeatures(subscriptionPlan: string): InterviewAutomationFeatures {
    switch (subscriptionPlan) {
      case 'FREE':
        return {
          canSeeAllApplicants: false,
          canSeeScores: false,
          automatedEmails: false,
          fullInterviewService: false,
          candidatePoolSize: 0, // No access to emails
          manualEmailsOnly: true
        }

      case 'COMPANY_BASIC':
        return {
          canSeeAllApplicants: false,
          canSeeScores: false,
          automatedEmails: false,
          fullInterviewService: false,
          candidatePoolSize: 10, // Top 10 emails revealed
          manualEmailsOnly: true
        }

      case 'COMPANY_PREMIUM': // HR Booster
        return {
          canSeeAllApplicants: true,
          canSeeScores: true,
          automatedEmails: true,
          fullInterviewService: false,
          candidatePoolSize: -1, // All candidates
          manualEmailsOnly: false
        }

      case 'COMPANY_PRO': // HR Agent
        return {
          canSeeAllApplicants: true,
          canSeeScores: true,
          automatedEmails: true,
          fullInterviewService: true,
          candidatePoolSize: -1, // All candidates + full service
          manualEmailsOnly: false
        }

      default:
        return {
          canSeeAllApplicants: false,
          canSeeScores: false,
          automatedEmails: false,
          fullInterviewService: false,
          candidatePoolSize: 0,
          manualEmailsOnly: true
        }
    }
  }

  /**
   * Get processed candidates for a project based on subscription tier
   */
  async getProcessedCandidates(
    projectId: string, 
    companySubscription: string
  ): Promise<{
    candidates: CandidateInfo[]
    totalApplications: number
    features: InterviewAutomationFeatures
    hasScoring: boolean
  }> {
    try {
      const features = this.getAutomationFeatures(companySubscription)

      // Get all applications
      const applications = await prisma.application.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              university: true,
              major: true,
              skills: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      let candidates: CandidateInfo[] = []
      let hasScoring = false

      // Try to get AI scores if available and enough applications
      let scores: ApplicationScore[] | null = null
      if (applications.length >= 20 && features.canSeeScores) {
        scores = await aiScoring.scoreApplications(projectId)
        hasScoring = scores !== null
      }

      // Process candidates based on subscription tier
      if (scores && hasScoring) {
        // Use AI-ranked candidates
        candidates = scores.map(score => {
          const application = applications.find(app => app.id === score.applicationId)
          if (!application) return null

          return {
            id: application.user.id,
            name: application.user.name || 'Anonymous',
            email: features.candidatePoolSize === 0 ? this.maskEmail(application.user.email) : application.user.email,
            university: application.user.university || undefined,
            major: application.user.major || undefined,
            skills: application.user.skills || [],
            score: score.score,
            rank: score.rank,
            applicationId: application.id
          }
        }).filter(Boolean) as CandidateInfo[]
      } else {
        // Use applications in order received (no scoring available)
        candidates = applications.map((application, index) => ({
          id: application.user.id,
          name: application.user.name || 'Anonymous',
          email: features.candidatePoolSize === 0 ? this.maskEmail(application.user.email) : application.user.email,
          university: application.user.university || undefined,
          major: application.user.major || undefined,
          skills: application.user.skills || [],
          rank: index + 1,
          applicationId: application.id
        }))
      }

      // Apply subscription limits
      if (!features.canSeeAllApplicants && features.candidatePoolSize > 0) {
        candidates = candidates.slice(0, features.candidatePoolSize)
      }

      // Mask emails for free tier
      if (features.candidatePoolSize === 0) {
        candidates.forEach(candidate => {
          candidate.email = this.maskEmail(candidate.email)
        })
      }

      return {
        candidates,
        totalApplications: applications.length,
        features,
        hasScoring
      }

    } catch (error) {
      console.error('🤖 Interview Automation Error:', error)
      return {
        candidates: [],
        totalApplications: 0,
        features: this.getAutomationFeatures(companySubscription),
        hasScoring: false
      }
    }
  }

  /**
   * Send interview invitation (automated for premium/pro, manual template for basic)
   */
  async sendInterviewInvitation(
    applicationId: string,
    companyId: string,
    interviewType: 'initial' | 'technical' | 'final' = 'initial'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get application and company details
      const [application, company] = await Promise.all([
        prisma.application.findUnique({
          where: { id: applicationId },
          include: {
            user: true,
            project: true
          }
        }),
        prisma.user.findUnique({
          where: { id: companyId },
          select: {
            subscriptionPlan: true,
            calendlyLink: true,
            name: true,
            email: true,
            companyName: true
          }
        })
      ])

      if (!application || !company) {
        return { success: false, message: 'Application or company not found' }
      }

      const features = this.getAutomationFeatures(company.subscriptionPlan || 'FREE')

      // Check if automated emails are available
      if (!features.automatedEmails) {
        return { 
          success: false, 
          message: 'Automated emails not available. Upgrade to HR Booster for automated interview scheduling.' 
        }
      }

      // Check if company has Calendly link
      if (!company.calendlyLink) {
        return { 
          success: false, 
          message: 'Please add your Calendly link in your company profile before sending interview invitations.' 
        }
      }

      // Prepare candidate info
      const candidateInfo = {
        id: application.user.id,
        name: application.user.name || 'Candidate',
        email: application.user.email,
        projectTitle: application.project.title,
        companyName: company.companyName || company.name || 'Company'
      }

      // Prepare interview scheduling info
      const schedulingInfo = {
        candidateInfo,
        calendlyLink: company.calendlyLink,
        interviewType,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        companyContactName: company.name || 'Hiring Manager',
        companyContactEmail: company.email
      }

      // Send automated interview invitation
      const emailSent = await emailAutomation.sendInterviewInvitation(schedulingInfo)

      if (emailSent) {
        // Update application status
        await prisma.application.update({
          where: { id: applicationId },
          data: { 
            status: 'INTERVIEWED',
            updatedAt: new Date()
          }
        })

        return { 
          success: true, 
          message: 'Interview invitation sent successfully! Candidate will receive an email with your Calendly link.' 
        }
      } else {
        return { 
          success: false, 
          message: 'Failed to send interview invitation. Please try again.' 
        }
      }

    } catch (error) {
      console.error('Interview invitation error:', error)
      return { 
        success: false, 
        message: 'An error occurred while sending the interview invitation.' 
      }
    }
  }

  /**
   * Bulk shortlist candidates (Premium/Pro feature)
   */
  async bulkShortlistCandidates(
    applicationIds: string[],
    companyId: string
  ): Promise<{ success: boolean; message: string; shortlisted: number }> {
    try {
      const company = await prisma.user.findUnique({
        where: { id: companyId },
        select: { subscriptionPlan: true }
      })

      if (!company) {
        return { success: false, message: 'Company not found', shortlisted: 0 }
      }

      const features = this.getAutomationFeatures(company.subscriptionPlan || 'FREE')

      if (!features.automatedEmails) {
        return { 
          success: false, 
          message: 'Bulk actions require HR Booster or HR Agent subscription.', 
          shortlisted: 0 
        }
      }

      // Update all applications to shortlisted
      const updateResult = await prisma.application.updateMany({
        where: { 
          id: { in: applicationIds }
        },
        data: { 
          status: 'SHORTLISTED',
          updatedAt: new Date()
        }
      })

      return { 
        success: true, 
        message: `Successfully shortlisted ${updateResult.count} candidates`, 
        shortlisted: updateResult.count 
      }

    } catch (error) {
      console.error('Bulk shortlist error:', error)
      return { 
        success: false, 
        message: 'Failed to shortlist candidates', 
        shortlisted: 0 
      }
    }
  }

  /**
   * Get subscription upgrade prompts
   */
  getUpgradePrompts(currentPlan: string): {
    showUpgrade: boolean
    message: string
    targetPlan: string
    features: string[]
  } {
    switch (currentPlan) {
      case 'FREE':
        return {
          showUpgrade: true,
          message: 'Upgrade to Company Basic to see top 10 candidate emails and start hiring!',
          targetPlan: 'COMPANY_BASIC',
          features: [
            'Access to top 10 candidate emails',
            'Manual interview scheduling',
            'Basic application management',
            '1 active project'
          ]
        }

      case 'COMPANY_BASIC':
        return {
          showUpgrade: true,
          message: 'Upgrade to HR Booster for automated interview scheduling and full candidate visibility!',
          targetPlan: 'COMPANY_PREMIUM',
          features: [
            'See ALL candidate details',
            'AI-powered candidate scoring',
            'Automated interview emails',
            'Bulk candidate actions',
            'Up to 5 active projects'
          ]
        }

      case 'COMPANY_PREMIUM':
        return {
          showUpgrade: true,
          message: 'Upgrade to HR Agent for hands-off hiring with interview service!',
          targetPlan: 'COMPANY_PRO',
          features: [
            'We conduct interviews for you',
            'Interview transcript analysis',
            'Team recommendations',
            'Unlimited projects',
            'Dedicated account manager'
          ]
        }

      default:
        return {
          showUpgrade: false,
          message: '',
          targetPlan: '',
          features: []
        }
    }
  }

  /**
   * Helper method to mask emails for lower tiers
   */
  private maskEmail(email: string): string {
    const [username, domain] = email.split('@')
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`
    }
    return `${username.substring(0, 2)}***@${domain}`
  }
}

export const interviewAutomation = new InterviewAutomationService() 