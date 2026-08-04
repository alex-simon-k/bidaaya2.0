# Bidaaya Slack Bot

Internal Slack notifications for the Bidaaya platform. Sends real-time signup alerts and a daily growth summary to a Slack channel so the team can track platform activity without opening the admin dashboard.

## What it sends

| Notification | Trigger | Content |
|---|---|---|
| New signup alert | A user completes their profile (not raw registration) | Name, email, role (Student/Company), university |
| Daily summary | Vercel cron, daily at 03:00 UTC (~7:00 AM UAE) | Students and companies who joined yesterday, plus running totals |
| Application milestone | A project's applications hit exactly 10, 25, 50, or 100 | Project title and application count |
| Project approval | Admin approves a project (available, wired on demand) | Project title and company name |
| New subscription | Stripe subscription created (available, wired on demand) | Company, plan, amount |

## How it works — data flow

1. **Source of truth is the Postgres database via Prisma.** No data is stored in or read from Slack; the bot is one-way (platform → Slack).
2. **Event notifications** (signups, milestones) are fired inline from API routes after the database write succeeds:
   - `src/app/api/user/profile/route.ts` — fires the signup alert when a student completes onboarding. Registration itself (`/api/auth/register`) deliberately does **not** notify, to avoid duplicate/empty alerts before profile data exists.
   - `src/app/api/user/convert-to-company/route.ts` — fires when a user converts to a company account.
   - `src/app/api/applications/apply/route.ts` — checks the application count after each new application and fires on exact milestone hits.
3. **The daily summary** is pulled, not pushed: the cron route queries `prisma.user.count()` grouped by role and signup date (yesterday 00:00 → today 00:00, plus all-time totals) and formats the result into a Slack Block Kit message.
4. **Delivery** is a plain HTTPS `POST` of a JSON payload (Slack Block Kit format) to a **Slack Incoming Webhook URL**. No Slack SDK, no bot token, no OAuth scopes — the webhook URL is the only credential, and it can only post to the one channel it was created for.
5. **What leaves the platform:** user name, email, role, and university on signup alerts; aggregate counts only on daily summaries. Nothing else is transmitted.

## Implementation

| File | Purpose |
|---|---|
| `src/lib/slack-service.ts` | Core service: `SlackService` (message builders + webhook delivery) and `SlackAutomation` (DB lookups, milestone checks) |
| `src/lib/daily-summary-service.ts` | Stats aggregation used by the daily summary |
| `src/app/api/cron/daily-summary/route.ts` | Cron endpoint. `GET` secured with `Authorization: Bearer <CRON_SECRET>` (sent by Vercel Cron); `POST` allows manual trigger with `ADMIN_SECRET` |
| `src/app/api/admin/slack-summary/route.ts` | Admin-only management API: trigger the summary, send a test signup alert, run a milestone check, and inspect config status |
| `vercel.json` | Cron schedule: `0 3 * * *` hitting `/api/cron/daily-summary` |

### Behaviour notes

- **Mock mode:** if `SLACK_WEBHOOK_URL` is not set, the service disables itself and logs every would-be message to the console (`📱 [MOCK] ...`). The platform is fully functional without Slack configured — notifications fail silently and never block a signup or application.
- All Slack calls are wrapped in try/catch; a Slack outage cannot break an API route.
- Timestamps in messages use the `en-AE` locale.

## Configuration (environment variables)

| Variable | Required | Purpose |
|---|---|---|
| `SLACK_WEBHOOK_URL` | Yes — bot is disabled without it | Incoming Webhook URL from Slack (`https://hooks.slack.com/services/...`) |
| `CRON_SECRET` | Yes (production) | Verifies daily-summary requests genuinely come from Vercel Cron |
| `ADMIN_SECRET` | Optional | Allows manual daily-summary triggering via `POST /api/cron/daily-summary` |

## Setup

1. **In Slack (workspace admin):** create a Slack app → enable **Incoming Webhooks** → add a webhook to the target channel (e.g. `#bidaaya-growth`) → copy the webhook URL.
2. **In Vercel:** set `SLACK_WEBHOOK_URL` and `CRON_SECRET` in the project's environment variables (Production), then redeploy.
3. **Verify:** as an admin, `GET /api/admin/slack-summary` shows `webhookConfigured: true`; `POST` with `{"action": "daily-summary"}` sends a live test message to the channel.
