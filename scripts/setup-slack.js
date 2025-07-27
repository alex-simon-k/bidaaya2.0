const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function setupSlackIntegration() {
  console.log('📱 Setting up Slack Integration...')
  
  // Check if Slack webhook URL is configured
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  if (!webhookUrl) {
    console.log(`
❌ Slack webhook URL not configured!

To set up Slack integration:

1. Go to your Slack workspace
2. Create a new app at https://api.slack.com/apps
3. Add Incoming Webhooks feature
4. Create a webhook for your desired channel
5. Add to your .env.local file:
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

6. Restart your development server

Then run this script again to test the integration.
`)
    return
  }

  console.log('✅ Slack webhook URL configured')
  
  // Test Slack integration
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '🎉 Bidaaya Slack Integration Test',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Bidaaya Platform - Slack Integration Test*\n\n✅ Connection successful!\n📊 Ready for daily summaries and live notifications'
            }
          }
        ]
      })
    })
    
    if (response.ok) {
      console.log('✅ Slack test message sent successfully!')
    } else {
      console.log('❌ Failed to send Slack test message:', response.statusText)
    }
  } catch (error) {
    console.log('❌ Slack integration error:', error.message)
  }

  // Show current platform stats
  try {
    const stats = await getDailyStats()
    console.log('\n📊 Current Platform Stats:')
    console.log(`   Users: ${stats.totalUsers} (${stats.students} students, ${stats.companies} companies)`)
    console.log(`   Projects: ${stats.activeProjects} active, ${stats.pendingProjects} pending`)
    console.log(`   Applications: ${stats.totalApplications}`)
    
    // Send a sample daily summary
    if (webhookUrl) {
      const summaryMessage = {
        text: '📊 Bidaaya Daily Summary (Test)',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📊 Bidaaya Daily Summary'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*👥 Total Users:*\n${stats.totalUsers}`
              },
              {
                type: 'mrkdwn',
                text: `*🎓 Students:*\n${stats.students}`
              },
              {
                type: 'mrkdwn',
                text: `*🏢 Companies:*\n${stats.companies}`
              },
              {
                type: 'mrkdwn',
                text: `*📂 Active Projects:*\n${stats.activeProjects}`
              },
              {
                type: 'mrkdwn',
                text: `*⏳ Pending Projects:*\n${stats.pendingProjects}`
              },
              {
                type: 'mrkdwn',
                text: `*📝 Applications:*\n${stats.totalApplications}`
              }
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Generated at ${new Date().toLocaleString()}`
              }
            ]
          }
        ]
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summaryMessage)
      })
      
      console.log('✅ Sample daily summary sent to Slack!')
    }
    
  } catch (error) {
    console.log('❌ Failed to get platform stats:', error.message)
  }

  console.log(`
🎯 Slack Integration Setup Complete!

Next steps:
1. Set up a daily cron job to call: /api/admin/slack-summary
2. The system will automatically send notifications for new signups
3. Daily summaries will be sent at 7 AM (configure via cron)

Manual triggers:
- Daily summary: POST /api/admin/slack-summary
- Test message: Use the admin dashboard 'Admin Tools' tab
`)
}

async function getDailyStats() {
  const [
    totalUsers,
    students,
    companies,
    activeProjects,
    pendingProjects,
    totalApplications
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'COMPANY' } }),
    prisma.project.count({ where: { status: 'LIVE' } }),
    prisma.project.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.application.count()
  ])

  return {
    totalUsers,
    students,
    companies,
    activeProjects,
    pendingProjects,
    totalApplications
  }
}

if (require.main === module) {
  setupSlackIntegration()
    .then(() => {
      console.log('✅ Slack setup completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Slack setup failed:', error)
      process.exit(1)
    })
}

module.exports = { setupSlackIntegration } 