import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SlackMessage {
  text: string
  blocks?: any[]
  channel?: string
}

interface DailyStats {
  date: string
  newUsers: number
  newStudents: number
  newCompanies: number
  newApplications: number
  newProjects: number
  activeProjects: number
  conversionsToday: number
  userGrowthTrend: number
  applicationGrowthTrend: number
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
      console.log('📱 [MOCK] New user signup notification:', userInfo)
      return true
    }

    const message: SlackMessage = {
      text: `🎉 New user signed up!`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎉 New User Signup Alert"
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
              text: `*Role:*\n${userInfo.role === 'STUDENT' ? '🎓 Student' : '🏢 Company'}`
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${userInfo.email}`
            },
            {
              type: "mrkdwn",
              text: `*Time:*\n${new Date(userInfo.signupTime).toLocaleString()}`
            }
          ]
        }
      ]
    }

    // Add role-specific information
    if (userInfo.role === 'STUDENT' && userInfo.university) {
      message.blocks![1].fields.push({
        type: "mrkdwn",
        text: `*University:*\n${userInfo.university}`
      })
    } else if (userInfo.role === 'COMPANY' && userInfo.companyName) {
      message.blocks![1].fields.push({
        type: "mrkdwn",
        text: `*Company:*\n${userInfo.companyName}`
      })
    }

    // Add context section
    message.blocks!.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📊 View full analytics in the <https://bidaaya-web-app.vercel.app/admin|Admin Dashboard>`
        }
      ]
    })

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

  // Data collection methods
  private async getDailyStats(): Promise<DailyStats> {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    const [
      newUsersToday,
      newUsersYesterday,
      newStudentsToday,
      newCompaniesToday,
      newApplicationsToday,
      newApplicationsYesterday,
      newProjectsToday,
      activeProjects,
      conversionsToday
    ] = await Promise.all([
      // New users today
      prisma.user.count({
        where: {
          createdAt: { gte: todayStart }
        }
      }),
      // New users yesterday
      prisma.user.count({
        where: {
          createdAt: { 
            gte: yesterdayStart,
            lt: todayStart
          }
        }
      }),
      // New students today
      prisma.user.count({
        where: {
          role: 'STUDENT',
          createdAt: { gte: todayStart }
        }
      }),
      // New companies today
      prisma.user.count({
        where: {
          role: 'COMPANY',
          createdAt: { gte: todayStart }
        }
      }),
      // New applications today
      prisma.application.count({
        where: {
          createdAt: { gte: todayStart }
        }
      }),
      // New applications yesterday
      prisma.application.count({
        where: {
          createdAt: { 
            gte: yesterdayStart,
            lt: todayStart
          }
        }
      }),
      // New projects today
      prisma.project.count({
        where: {
          createdAt: { gte: todayStart }
        }
      }),
      // Active projects
      prisma.project.count({
        where: { status: 'LIVE' }
      }),
      // Conversions today (companies that upgraded)
      prisma.user.count({
        where: {
          role: 'COMPANY',
          subscriptionPlan: { not: 'FREE' },
          updatedAt: { gte: todayStart }
        }
      })
    ])

    // Calculate growth trends
    const userGrowthTrend = newUsersYesterday > 0 ? 
      ((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100 : 
      newUsersToday > 0 ? 100 : 0

    const applicationGrowthTrend = newApplicationsYesterday > 0 ? 
      ((newApplicationsToday - newApplicationsYesterday) / newApplicationsYesterday) * 100 : 
      newApplicationsToday > 0 ? 100 : 0

    return {
      date: today.toISOString().split('T')[0],
      newUsers: newUsersToday,
      newStudents: newStudentsToday,
      newCompanies: newCompaniesToday,
      newApplications: newApplicationsToday,
      newProjects: newProjectsToday,
      activeProjects,
      conversionsToday,
      userGrowthTrend: Math.round(userGrowthTrend),
      applicationGrowthTrend: Math.round(applicationGrowthTrend)
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
    const trendEmoji = (trend: number) => {
      if (trend > 10) return '🚀'
      if (trend > 0) return '📈'
      if (trend === 0) return '➡️'
      return '📉'
    }

    return {
      text: `📊 Daily Platform Summary - ${stats.date}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `📊 Daily Summary - ${new Date(stats.date).toLocaleDateString()}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*🎯 Key Metrics Today*"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*New Users:*\n${stats.newUsers} ${trendEmoji(stats.userGrowthTrend)} (${stats.userGrowthTrend > 0 ? '+' : ''}${stats.userGrowthTrend}%)`
            },
            {
              type: "mrkdwn",
              text: `*New Applications:*\n${stats.newApplications} ${trendEmoji(stats.applicationGrowthTrend)} (${stats.applicationGrowthTrend > 0 ? '+' : ''}${stats.applicationGrowthTrend}%)`
            },
            {
              type: "mrkdwn",
              text: `*Students:*\n🎓 ${stats.newStudents}`
            },
            {
              type: "mrkdwn",
              text: `*Companies:*\n🏢 ${stats.newCompanies}`
            },
            {
              type: "mrkdwn",
              text: `*New Projects:*\n📋 ${stats.newProjects}`
            },
            {
              type: "mrkdwn",
              text: `*Conversions:*\n💰 ${stats.conversionsToday}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📈 Platform Health:* ${stats.activeProjects} active projects receiving applications`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `🔗 <https://bidaaya-web-app.vercel.app/admin|View detailed analytics> | Last updated: ${new Date().toLocaleTimeString()}`
            }
          ]
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

  // Real-time user notification
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
          companyName: true,
          createdAt: true
        }
      })

      if (!user) {
        console.error('User not found for notification:', userId)
        return false
      }

      const userInfo: UserSignupInfo = {
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        role: user.role,
        university: user.university || undefined,
        companyName: user.companyName || undefined,
        signupTime: user.createdAt.toISOString()
      }

      return await this.slackService.notifyNewUserSignup(userInfo)
    } catch (error) {
      console.error('Error notifying user signup:', error)
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