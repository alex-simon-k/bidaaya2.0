# Daily Summary Setup Guide

This guide will help you set up the daily 9am Slack summary for Bidaaya user statistics.

## 🚀 What You'll Get

Every day at 9am, you'll receive a Slack message like this:

```
📊 Daily Bidaaya Summary - 1/15/2025
🎓 5 students joined in the past 24 hours (1,234 total students)
🏢 2 companies joined in the past 24 hours (89 total companies)
📅 Generated at 1/15/2025, 9:00:00 AM
```

## 📋 Prerequisites

1. **Slack Integration** - Follow `SLACK_SETUP.md` first
2. **Environment Variable** - Make sure `SLACK_WEBHOOK_URL` is set

## ⏰ Setting Up the Daily Schedule

### Option 1: Vercel Cron Jobs (Recommended)

If you're deploying on Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/daily-summary",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. **Create account** on your preferred cron service
2. **Add new cron job** with these settings:
   - **URL**: `https://your-domain.com/api/admin/daily-summary`
   - **Method**: POST
   - **Schedule**: `0 9 * * *` (9am daily)
   - **Body**: `{}`

### Option 3: Server Cron (If you have server access)

Add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add this line
0 9 * * * curl -X POST https://your-domain.com/api/admin/daily-summary
```

## 🧪 Testing the System

### Test Daily Summary

```bash
# Test the daily summary
curl -X POST http://localhost:3000/api/admin/daily-summary \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Test via API

```bash
# Test via the test endpoint
curl -X POST http://localhost:3000/api/admin/test-slack \
  -H "Content-Type: application/json" \
  -d '{"type": "daily-summary"}'
```

### View Current Stats

```bash
# Get current stats without sending
curl http://localhost:3000/api/admin/daily-summary
```

## 📊 What the System Tracks

- **New Students (24h)**: Students who joined in the past 24 hours
- **New Companies (24h)**: Companies who joined in the past 24 hours
- **Total Students**: All students in the database
- **Total Companies**: All companies in the database

## 🔧 Customization

### Change Time Zone

The system uses your server's timezone. To change it:

1. **Set environment variable**:
   ```env
   TZ=America/New_York
   ```

2. **Or modify the service** in `src/lib/daily-summary-service.ts`

### Customize Message Format

Edit the message format in `src/lib/daily-summary-service.ts`:

```typescript
// Customize the message blocks
const message = {
  text: `📊 Daily Bidaaya Summary - ${new Date().toLocaleDateString()}`,
  blocks: [
    // Your custom blocks here
  ]
}
```

### Add More Statistics

To add more stats, modify `getDailyStats()` in `src/lib/daily-summary-service.ts`:

```typescript
// Add more database queries
const activeUsers = await prisma.user.count({
  where: {
    lastLoginAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    }
  }
})
```

## 🛠️ Troubleshooting

### Cron Job Not Working

1. **Check logs**: Look at your deployment platform logs
2. **Test manually**: Use the test endpoints above
3. **Verify URL**: Make sure the cron job URL is correct
4. **Check timezone**: Ensure your cron service uses the right timezone

### No Data Showing

1. **Check database**: Verify users exist in your database
2. **Check role field**: Ensure users have `role: 'STUDENT'` or `role: 'COMPANY'`
3. **Check timestamps**: Verify `createdAt` fields are set correctly

### Slack Not Receiving Messages

1. **Test webhook**: Use the test endpoints
2. **Check webhook URL**: Verify `SLACK_WEBHOOK_URL` is correct
3. **Check channel**: Ensure the webhook is connected to the right channel

## 📱 Mobile Notifications

Enable mobile notifications for your Slack channel:
1. **Open Slack mobile app**
2. **Go to the notification channel**
3. **Tap the channel name**
4. **Tap "Notifications"**
5. **Enable "Mobile push notifications"**

## 🎉 You're All Set!

Once configured, you'll receive:
- ✅ **Daily 9am summary** with user statistics
- ✅ **Real-time notifications** for new signups
- ✅ **Clean, organized data** in your Slack channel

No more manual checking - everything is automated! 🚀 