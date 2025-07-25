# Slack Integration Setup Guide

This guide will help you set up Slack notifications for admin alerts instead of email notifications.

## 🚀 Quick Setup

### Step 1: Create a Slack App

1. **Go to [api.slack.com/apps](https://api.slack.com/apps)**
2. **Click "Create New App"** → "From scratch"
3. **Name your app**: `Bidaaya Admin Notifications`
4. **Select your workspace**
5. **Click "Create App"**

### Step 2: Configure Incoming Webhooks

1. **In the left sidebar, click "Incoming Webhooks"**
2. **Toggle "Activate Incoming Webhooks" to ON**
3. **Click "Add New Webhook to Workspace"**
4. **Choose the channel** where you want notifications (e.g., `#admin-notifications`)
5. **Click "Allow"**
6. **Copy the Webhook URL** (looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)

### Step 3: Add Environment Variable

Add this to your `.env` file:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Step 4: Test the Integration

The integration will automatically send notifications for:
- ✅ New student signups
- ✅ New company signups
- ✅ Error alerts
- ✅ Success notifications

## 📋 What You'll Receive

### New Student Signup Notification
```
🎓 New Student Joined Bidaaya!
Name: John Doe
Email: john@university.edu
University: MIT
Major: Computer Science
📅 Signed up at 1/15/2025, 2:30:45 PM
```

### New Company Signup Notification
```
🏢 New Company Joined Bidaaya!
Company: TechCorp
Contact: Jane Smith
Email: jane@techcorp.com
Industry: Technology
📅 Signed up at 1/15/2025, 2:30:45 PM
```

### Error Notifications
```
🚨 Error Alert
Context: Student Welcome Email API
Error: Failed to send email
📅 1/15/2025, 2:30:45 PM
```

## 🔧 Advanced Configuration

### Custom Channel Setup
You can create multiple webhooks for different channels:
- `#admin-notifications` - General admin alerts
- `#new-signups` - Only new user notifications
- `#errors` - Only error notifications

### Message Customization
Edit `src/lib/slack-service.ts` to customize:
- Message formatting
- Emoji usage
- Field layout
- Notification timing

## 🛠️ Troubleshooting

### Webhook URL Issues
- **Invalid URL**: Make sure the webhook URL is copied correctly
- **Channel not found**: Ensure the channel exists in your workspace
- **Permission denied**: Check that the app has permission to post to the channel

### Environment Variable Issues
- **Not loading**: Restart your development server after adding the environment variable
- **Production**: Make sure to add the environment variable to your production environment (Vercel, etc.)

### Testing
To test the integration manually:

```typescript
import { SlackService } from '@/lib/slack-service'

// Test notification
await SlackService.sendAdminNotification(
  'Test Message',
  'This is a test notification from Bidaaya!',
  '🧪'
)
```

## 📱 Mobile Notifications

Enable mobile notifications for your Slack channel:
1. **Open Slack mobile app**
2. **Go to the notification channel**
3. **Tap the channel name**
4. **Tap "Notifications"**
5. **Enable "Mobile push notifications"**

## 🔒 Security Notes

- **Keep webhook URLs private** - Don't commit them to public repositories
- **Use environment variables** - Never hardcode webhook URLs
- **Monitor usage** - Check Slack app usage in your workspace settings
- **Rotate webhooks** - Consider rotating webhook URLs periodically

## 🎉 You're All Set!

Once configured, you'll receive real-time notifications in Slack for:
- New student and company signups
- System errors and alerts
- Success confirmations
- Any other admin events

No more email clutter - everything goes straight to your Slack! 🚀 