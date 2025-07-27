// Daily Summary Service for Slack Notifications
// Sends daily user statistics at 9am

import { PrismaClient } from '@prisma/client'
import { SlackService } from './slack-service'

const prisma = new PrismaClient()

interface DailyStats {
  newStudents24h: number
  newCompanies24h: number
  totalStudents: number
  totalCompanies: number
}

export class DailySummaryService {
  // Get user statistics for the past 24 hours and totals
  static async getDailyStats(): Promise<DailyStats> {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    try {
      // Get new users in the past 24 hours
      const newStudents24h = await prisma.user.count({
        where: {
          role: 'STUDENT',
          createdAt: {
            gte: twentyFourHoursAgo
          }
        }
      })

      const newCompanies24h = await prisma.user.count({
        where: {
          role: 'COMPANY',
          createdAt: {
            gte: twentyFourHoursAgo
          }
        }
      })

      // Get total users
      const totalStudents = await prisma.user.count({
        where: {
          role: 'STUDENT'
        }
      })

      const totalCompanies = await prisma.user.count({
        where: {
          role: 'COMPANY'
        }
      })

      return {
        newStudents24h,
        newCompanies24h,
        totalStudents,
        totalCompanies
      }
    } catch (error) {
      console.error('Error fetching daily stats:', error)
      throw error
    }
  }

  // Send daily summary to Slack
  static async sendDailySummary(): Promise<boolean> {
    try {
      const stats = await this.getDailyStats()
      
      const message = {
        text: `📊 Daily Bidaaya Summary - ${new Date().toLocaleDateString()}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `📊 Daily Bidaaya Summary - ${new Date().toLocaleDateString()}`,
              emoji: true
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🎓 *${stats.newStudents24h} students* joined in the past 24 hours (${stats.totalStudents} total students)`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🏢 *${stats.newCompanies24h} companies* joined in the past 24 hours (${stats.totalCompanies} total companies)`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `📅 Generated at ${new Date().toLocaleString()}`
              }
            ]
          },
          {
            type: 'divider'
          }
        ]
      }

      const { slackService } = await import('@/lib/slack-service')
      return await slackService.sendDailySummary()
    } catch (error) {
      console.error('Error sending daily summary:', error)
      return false
    }
  }

  // Manual trigger for testing
  static async sendTestSummary(): Promise<boolean> {
    console.log('🧪 Sending test daily summary...')
    return await this.sendDailySummary()
  }
} 