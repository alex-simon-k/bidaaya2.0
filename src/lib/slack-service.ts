import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SlackMessage {
  text: string
  blocks?: any[]
  channel?: string
}

interface DailyStats {
  date: string
  newStudents: number
  newCompanies: number
  totalStudents: number
  totalCompanies: number
  // Legacy fields (kept for backward compatibility)
  newUsers: number
  newApplications: number
  newProjects: number
  activeProjects: number
  conversionsToday: number
  userGrowthTrend: number
  applicationGrowthTrend: number
  weekOverWeekUserGrowth: number
  weekOverWeekApplicationGrowth: number
  totalUsers: number
  totalApplications: number
}

interface UserSignupInfo {
  id: string
  name: string
  email: string
  role: string
  university?: string
  companyName?: string
  signupTime: string
}

export class SlackService {
  private webhookUrl: string | null
  private isEnabled: boolean

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || null
    this.isEnabled = !!this.webhookUrl
    
    if (!this.isEnabled) {
      console.log('📱 Slack service: Disabled (no webhook URL)')
    }
  }

  // Real-time user signup notifications
  async notifyNewUserSignup(userInfo: UserSignupInfo): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('📱 [MOCK] User signup notification:', userInfo)
      return true
    }

    const message: SlackMessage = {
      text: `🎉 New ${userInfo.role.toLowerCase()} signup: ${userInfo.name}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🎉 New ${userInfo.role === 'STUDENT' ? 'Student' : 'Company'} Signup!`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Name:*\n${userInfo.name}`
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${userInfo.email}`
            },
            {
              type: "mrkdwn",
              text: `*Role:*\n${userInfo.role}`
            },
            {
              type: "mrkdwn",
              text: `*University:*\n${userInfo.university || 'Not specified'}`
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `📅 ${new Date().toLocaleString('en-AE')}`
            }
          ]
        }
      ]
    }

    return this.sendSlackMessage(message)
  }

  // Daily summary notifications
  async sendDailySummary(): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('📱 [MOCK] Daily summary would be sent to Slack')
      return true
    }

    const stats = await this.getDailyStats()
    const message = this.buildDailySummaryMessage(stats)
    
    return this.sendSlackMessage(message)
  }

  // Weekly summary notifications
  async sendWeeklySummary(): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('📱 [MOCK] Weekly summary would be sent to Slack')
      return true
    }

    const weeklyStats = await this.getWeeklyStats()
    const message = this.buildWeeklySummaryMessage(weeklyStats)
    
    return this.sendSlackMessage(message)
  }

  // Application milestone notifications
  async notifyApplicationMilestone(projectTitle: string, applicationCount: number): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`📱 [MOCK] Application milestone: ${projectTitle} reached ${applicationCount} applications`)
      return true
    }

    const message: SlackMessage = {
      text: `🎯 Application Milestone Reached!`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎯 Application Milestone!"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${projectTitle}* has reached *${applicationCount} applications*! 🚀`
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `📈 Great engagement! Time to consider promoting this project.`
            }
          ]
        }
      ]
    }

    return this.sendSlackMessage(message)
  }

  // Project approval notifications
  async notifyProjectApproval(projectTitle: string, companyName: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`📱 [MOCK] Project approved: ${projectTitle} by ${companyName}`)
      return true
    }

    const message: SlackMessage = {
      text: `✅ New project approved: ${projectTitle}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "✅ Project Approved"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Project:*\n${projectTitle}`
            },
            {
              type: "mrkdwn",
              text: `*Company:*\n${companyName}`
            }
          ]
        }
      ]
    }

    return this.sendSlackMessage(message)
  }

  // Revenue notifications
  async notifyNewSubscription(companyName: string, plan: string, amount: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`📱 [MOCK] New subscription: ${companyName} - ${plan} - ${amount}`)
      return true
    }

    const message: SlackMessage = {
      text: `💰 New subscription: ${companyName}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "💰 New Subscription!"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Company:*\n${companyName}`
            },
            {
              type: "mrkdwn",
              text: `*Plan:*\n${plan}`
            },
            {
              type: "mrkdwn",
              text: `*Amount:*\n${amount}`
            }
          ]
        }
      ]
    }

    return this.sendSlackMessage(message)
  }

  // Core Slack messaging
  private async sendSlackMessage(message: SlackMessage): Promise<boolean> {
    if (!this.webhookUrl) {
      console.log('📱 Slack webhook not configured')
      return false
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      })

      if (response.ok) {
        console.log('📱 ✅ Slack message sent successfully')
        return true
      } else {
        console.error('📱 ❌ Slack message failed:', response.status, response.statusText)
        return false
      }
    } catch (error) {
      console.error('📱 ❌ Slack message error:', error)
      return false
    }
  }

  // Simplified data collection - only yesterday's students/companies with totals
  private async getDailyStats(): Promise<DailyStats> {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    const [
      newStudentsYesterday,
      newCompaniesYesterday,
      totalStudents,
      totalCompanies
    ] = await Promise.all([
      // Yesterday's metrics
      prisma.user.count({
        where: { role: 'STUDENT', createdAt: { gte: yesterdayStart, lt: todayStart } }
      }),
      prisma.user.count({
        where: { role: 'COMPANY', createdAt: { gte: yesterdayStart, lt: todayStart } }
      }),
      // Total counts
      prisma.user.count({
        where: { role: 'STUDENT' }
      }),
      prisma.user.count({
        where: { role: 'COMPANY' }
      })
    ])

    return {
      date: yesterday.toISOString().split('T')[0],
      newStudents: newStudentsYesterday,
      newCompanies: newCompaniesYesterday,
      totalStudents,
      totalCompanies,
      // Legacy fields (not used in simplified message)
      newUsers: 0,
      newApplications: 0,
      newProjects: 0,
      activeProjects: 0,
      conversionsToday: 0,
      userGrowthTrend: 0,
      applicationGrowthTrend: 0,
      weekOverWeekUserGrowth: 0,
      weekOverWeekApplicationGrowth: 0,
      totalUsers: 0,
      totalApplications: 0
    }
  }

  private async getWeeklyStats(): Promise<any> {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Implementation for weekly stats
    return {
      weekOf: weekAgo.toISOString().split('T')[0],
      // ... weekly statistics
    }
  }

  private buildDailySummaryMessage(stats: DailyStats): SlackMessage {
    // Simple format: Yesterday's students and companies with totals in brackets
    const yesterdayDate = new Date(stats.date).toLocaleDateString('en-AE')
    
    return {
      text: `📊 Daily Bidaaya Summary - ${yesterdayDate}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `📊 *Daily Summary - ${yesterdayDate}*\n\n🎓 *${stats.newStudents} students* joined yesterday (${stats.totalStudents} total)\n🏢 *${stats.newCompanies} companies* joined yesterday (${stats.totalCompanies} total)`
          }
        }
      ]
    }
  }

  private buildWeeklySummaryMessage(stats: any): SlackMessage {
    return {
      text: `📈 Weekly Platform Summary`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📈 Weekly Summary"
          }
        }
        // Implementation for weekly summary
      ]
    }
  }
}

// Scheduled tasks and automation
export class SlackAutomation {
  private slackService: SlackService

  constructor() {
    this.slackService = new SlackService()
  }

  // Set up daily summary cron job (would be called by a scheduler)
  async setupDailySummary(): Promise<void> {
    console.log('📅 Setting up daily Slack summary automation')
    
    // In production, this would be called by a cron job or scheduled function
    // For now, we'll just log the setup
    console.log('📱 Daily summary will be sent at 9:00 AM UTC')
  }

  // Manual trigger for daily summary (for testing)
  async triggerDailySummary(): Promise<boolean> {
    console.log('📊 Manually triggering daily summary...')
    return await this.slackService.sendDailySummary()
  }

  // Real-time user notification when profile is completed
  async notifyUserSignup(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          university: true,
          major: true,
          companyName: true,
          createdAt: true
        }
      })

      if (!user) {
        console.log('📱 User not found for Slack notification:', userId)
        return false
      }

      // Call the main Slack service with user info
      return await this.slackService.notifyNewUserSignup({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        role: user.role as 'STUDENT' | 'COMPANY',
        university: user.university,
        companyName: user.companyName,
        signupTime: user.createdAt.toISOString()
      })
    } catch (error) {
      console.error('Error sending Slack notification:', error)
      return false
    }
  }

  // Application milestone tracking
  async checkApplicationMilestones(): Promise<void> {
    try {
      const projects = await prisma.project.findMany({
        where: { status: 'LIVE' },
        include: {
          _count: {
            select: { applications: true }
          }
        }
      })

      for (const project of projects) {
        const applicationCount = project._count.applications
        
        // Notify on milestones: 10, 25, 50, 100 applications
        const milestones = [10, 25, 50, 100]
        
        for (const milestone of milestones) {
          if (applicationCount === milestone) {
            await this.slackService.notifyApplicationMilestone(project.title, applicationCount)
            break
          }
        }
      }
    } catch (error) {
      console.error('Error checking application milestones:', error)
    }
  }
}

// Export instances
export const slackService = new SlackService()
export const slackAutomation = new SlackAutomation() 