// Slack Service for Admin Notifications
// Sends daily user statistics and new signup notifications

interface SlackMessage {
  text?: string
  blocks?: any[]
  attachments?: any[]
}

interface NewStudentSignupData {
  name: string
  email: string
  university?: string
  major?: string
  role: 'STUDENT'
}

interface NewCompanySignupData {
  name: string
  email: string
  companyName: string
  industry?: string
  role: 'COMPANY'
}

export class SlackService {
  private static webhookUrl = process.env.SLACK_WEBHOOK_URL

  // Send a simple text message to Slack
  static async sendMessage(message: SlackMessage): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('⚠️ Slack webhook URL not configured, skipping notification')
      return false
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error(`Slack API responded with status: ${response.status}`)
      }

      console.log('✅ Slack notification sent successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error)
      return false
    }
  }

  // Send notification for new student signup
  static async notifyNewStudentSignup(data: NewStudentSignupData): Promise<boolean> {
    const message: SlackMessage = {
      text: `🎓 New Student Signup: ${data.name}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎓 New Student Joined Bidaaya!',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Name:*\n${data.name}`
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${data.email}`
            }
          ]
        },
        ...(data.university ? [{
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*University:*\n${data.university}`
            },
            {
              type: 'mrkdwn',
              text: `*Major:*\n${data.major || 'Not specified'}`
            }
          ]
        }] : []),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 Signed up at ${new Date().toLocaleString()}`
            }
          ]
        },
        {
          type: 'divider'
        }
      ]
    }

    return this.sendMessage(message)
  }

  // Send notification for new company signup
  static async notifyNewCompanySignup(data: NewCompanySignupData): Promise<boolean> {
    const message: SlackMessage = {
      text: `🏢 New Company Signup: ${data.companyName}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🏢 New Company Joined Bidaaya!',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Company:*\n${data.companyName}`
            },
            {
              type: 'mrkdwn',
              text: `*Contact:*\n${data.name}`
            }
          ]
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Email:*\n${data.email}`
            },
            {
              type: 'mrkdwn',
              text: `*Industry:*\n${data.industry || 'Not specified'}`
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 Signed up at ${new Date().toLocaleString()}`
            }
          ]
        },
        {
          type: 'divider'
        }
      ]
    }

    return this.sendMessage(message)
  }
} 