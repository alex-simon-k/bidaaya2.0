const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function setupSlackAutomation() {
  console.log('📱 Setting up Slack Automation for Bidaaya Platform...\n')
  
  // Check environment variables
  const requiredEnvVars = {
    'SLACK_WEBHOOK_URL': process.env.SLACK_WEBHOOK_URL,
    'CRON_SECRET': process.env.CRON_SECRET,
    'ADMIN_SECRET': process.env.ADMIN_SECRET
  }

  console.log('🔍 Checking environment variables...')
  
  const missingVars = []
  for (const [name, value] of Object.entries(requiredEnvVars)) {
    if (value) {
      console.log(`  ✅ ${name}: Configured`)
    } else {
      console.log(`  ❌ ${name}: Missing`)
      missingVars.push(name)
    }
  }

  if (missingVars.length > 0) {
    console.log(`\n❌ Missing required environment variables!\n`)
    
    console.log('Please add these to your .env.local file:\n')
    
    missingVars.forEach(varName => {
      switch(varName) {
        case 'SLACK_WEBHOOK_URL':
          console.log(`${varName}=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK`)
          console.log('  ℹ️  Get this from: https://api.slack.com/apps → Your App → Incoming Webhooks\n')
          break
        case 'CRON_SECRET':
          console.log(`${varName}=your-secure-cron-secret-here`)
          console.log('  ℹ️  Generate a random string to secure your cron endpoint\n')
          break
        case 'ADMIN_SECRET':
          console.log(`${varName}=your-admin-secret-key-here`) 
          console.log('  ℹ️  For manually triggering summaries during testing\n')
          break
      }
    })

    console.log('After adding these variables, restart your development server and run this script again.\n')
    return
  }

  console.log('\n✅ All environment variables configured!\n')

  // Test Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    console.log('🧪 Testing Slack webhook...')
    
    try {
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '🚀 Bidaaya Slack Automation Setup Complete!',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '🚀 Bidaaya Slack Integration Active!'
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Automation Features Enabled:*\n• Real-time user signup notifications\n• Daily summaries at 7am Dubai time\n• Week-over-week growth analytics\n• Application milestone alerts\n• Revenue notifications'
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: '🇦🇪 Connecting UAE Students & Companies | Setup completed successfully'
                }
              ]
            }
          ]
        })
      })
      
      if (response.ok) {
        console.log('  ✅ Slack test message sent successfully!')
      } else {
        console.log('  ❌ Failed to send Slack test message:', response.statusText)
      }
    } catch (error) {
      console.log('  ❌ Slack webhook test failed:', error.message)
    }
  }

  // Display automation schedule
  console.log('\n📅 Automation Schedule:')
  console.log('  • Real-time notifications: Immediate on user signup/conversion')
  console.log('  • Daily summaries: 7:00 AM Dubai time (3:00 AM UTC)')
  console.log('  • Week-over-week analytics: Included in daily summaries')
  console.log('  • Application milestones: When projects hit 10, 25, 50, 100 applications')

  console.log('\n🔗 Manual Testing Endpoints:')
  console.log(`  • Test daily summary: POST /api/cron/daily-summary`)
  console.log(`    Body: { "adminKey": "${process.env.ADMIN_SECRET}" }`)
  console.log(`  • Test user notification: Available via admin dashboard`)

  console.log('\n✨ Slack automation is now fully configured and ready!')
  console.log('You will receive:')
  console.log('  📊 Daily platform summaries with UAE timezone')  
  console.log('  🎉 Real-time user signup alerts')
  console.log('  📈 Week-over-week growth analytics')
  console.log('  🎯 Application milestone notifications')
  console.log('  💰 Revenue and subscription alerts')
}

setupSlackAutomation()
  .catch((error) => {
    console.error('Setup failed:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 