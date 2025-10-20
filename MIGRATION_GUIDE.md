# Database Migration Guide - Early Access System

**Date:** October 20, 2025  
**Version:** 1.0  
**Status:** Ready to Run

---

## 🎯 What This Migration Does

Adds the complete **Early Access System** to your database:

1. **User Table Updates:**
   - `earlyAccessUnlocksRemaining` (Int) - Tracks monthly free unlocks
   - `earlyAccessUnlocksResetAt` (DateTime) - When counter resets
   - `profileCompletionChecklist` (Json) - Stores checklist progress

2. **Project Table Updates:**
   - `isNewOpportunity` (Boolean) - Marks as new/early access
   - `publishedAt` (DateTime) - When marked as new
   - `earlyAccessUntil` (DateTime) - 48h timer
   - `unlockCredits` (Int) - Credits to unlock for free users

3. **ExternalOpportunity Table Updates:**
   - Same fields as Project

4. **New Tables:**
   - `EarlyAccessUnlock` - Tracks who unlocked what
   - `OpportunityFeedback` - Stores mismatch reports

---

## ⚠️ Pre-Migration Checklist

Before running the migration, ensure:

- [ ] You have a backup of your database
- [ ] No other migrations are pending
- [ ] Your `.env` file has `DATABASE_URL` set
- [ ] You're in the project root directory
- [ ] You have Prisma installed (`npm install`)

---

## 🚀 Migration Steps

### Step 1: Generate the Migration

```bash
cd /Users/elisasimon/Documents/Bidaaya\ Web\ App\ 2.0/bidaaya-web-app
npx prisma migrate dev --name add_early_access_system
```

**What it does:**
- Creates migration SQL files
- Applies changes to your database
- Regenerates Prisma Client
- Shows you a summary of changes

**Expected output:**
```
✔ Generated Prisma Client
✔ The following migrations have been created and applied:

migrations/
  └─ 20251020_add_early_access_system/
    └─ migration.sql

✔ Your database is now in sync with your schema.
```

### Step 2: Verify Migration Success

```bash
npx prisma studio
```

**Check these tables exist:**
1. Open Prisma Studio (http://localhost:5555)
2. Verify `EarlyAccessUnlock` table exists
3. Verify `OpportunityFeedback` table exists
4. Check `User` table has new fields
5. Check `Project` table has new fields
6. Check `ExternalOpportunity` table has new fields

### Step 3: Initialize Early Access Unlocks for Paid Users

Run this script to set monthly unlocks for existing paid users:

```bash
node scripts/initialize-early-access.js
```

Create the script first:

```javascript
// scripts/initialize-early-access.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Initializing early access unlocks for paid users...');

  // Set unlocks for Basic tier users (10/month)
  const basicUpdated = await prisma.user.updateMany({
    where: {
      subscriptionPlan: 'STUDENT_PREMIUM',
      earlyAccessUnlocksRemaining: 0
    },
    data: {
      earlyAccessUnlocksRemaining: 10,
      earlyAccessUnlocksResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });

  console.log(`✅ Updated ${basicUpdated.count} Basic tier users`);

  // Set unlocks for Pro tier users (20/month)
  const proUpdated = await prisma.user.updateMany({
    where: {
      subscriptionPlan: 'STUDENT_PRO',
      earlyAccessUnlocksRemaining: 0
    },
    data: {
      earlyAccessUnlocksRemaining: 20,
      earlyAccessUnlocksResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });

  console.log(`✅ Updated ${proUpdated.count} Pro tier users`);
  console.log('🎉 Early access initialization complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
node scripts/initialize-early-access.js
```

---

## 🧪 Post-Migration Testing

### Test 1: Check Database Schema

```bash
npx prisma db pull
npx prisma validate
```

Should output: ✅ Schema is valid

### Test 2: Test API Endpoints

```bash
# Test opportunity dashboard (requires login)
curl -X GET https://your-domain.com/api/opportunities/dashboard

# Expected: JSON with opportunities array
```

### Test 3: Test Admin Interface

1. Log in as admin
2. Go to External Opportunities admin page
3. Click "Add New Opportunity"
4. Check for "Early Access Settings" section
5. Toggle "Mark as New Opportunity"
6. Verify credits field appears
7. Save opportunity
8. Check it shows "Early Access" badge

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong:

### Option 1: Revert Migration

```bash
npx prisma migrate resolve --rolled-back add_early_access_system
```

### Option 2: Restore from Backup

```bash
# If you have a database backup
# Restore from your backup system
```

### Option 3: Remove Migration Manually

```bash
rm -rf prisma/migrations/*add_early_access_system*
npx prisma migrate reset --skip-seed
npx prisma migrate dev
```

⚠️ **Warning:** This will reset your database!

---

## 📊 Migration Impact

### Performance Impact: **Low**
- New indexes on early access fields
- Minimal query overhead
- No data transformation needed

### Downtime: **Zero**
- Migration runs in seconds
- No service interruption needed
- Background indexes can be added live

### Data Safety: **High**
- Only adds new fields (defaults to NULL/false)
- No existing data modified
- Backward compatible

---

## 🎯 Verification Checklist

After migration, verify:

- [ ] No Prisma errors in console
- [ ] All tables have new fields
- [ ] Existing opportunities still work
- [ ] Can create new opportunity with early access
- [ ] Student dashboard loads without errors
- [ ] Admin dashboard shows early access controls
- [ ] Feedback modal works
- [ ] Match scores calculate correctly

---

## 🐛 Troubleshooting

### Error: "Column already exists"

**Cause:** Migration was partially applied

**Fix:**
```bash
npx prisma migrate resolve --applied add_early_access_system
npx prisma generate
```

### Error: "Relation does not exist"

**Cause:** Prisma Client not regenerated

**Fix:**
```bash
npx prisma generate
npm run build
```

### Error: "Cannot read properties of null"

**Cause:** Old Prisma Client cached

**Fix:**
```bash
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### API returns 500 error

**Cause:** Database connection issue or missing fields

**Check:**
1. Verify DATABASE_URL in Vercel
2. Run migration on production database
3. Check Vercel logs for specific error

---

## 📝 Production Deployment

### For Vercel:

**Option 1: Automatic (Recommended)**

Vercel will automatically run migrations when you push:

```bash
git add .
git commit -m "feat: Add early access system with database migration"
git push origin main
```

**Option 2: Manual**

Run migration directly on production:

```bash
# Set production database URL
export DATABASE_URL="your-production-url"

# Run migration
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### Environment Variables Needed in Vercel

Ensure these are set:
- `DATABASE_URL` - Your production database
- `DIRECT_URL` - Direct connection (if using Supabase)
- `NEXTAUTH_SECRET` - For auth
- `GOOGLE_CLIENT_ID` - OAuth
- `GOOGLE_CLIENT_SECRET` - OAuth

---

## 🎉 Success Indicators

You'll know migration succeeded when:

1. ✅ No errors in terminal
2. ✅ Prisma Studio shows new tables/fields
3. ✅ Student dashboard loads without errors
4. ✅ Admin can create opportunities with early access
5. ✅ Early access badge shows on new opportunities
6. ✅ Match scores calculate and display
7. ✅ Feedback modal opens and submits

---

## 📞 Need Help?

If you encounter issues:

1. **Check Logs:**
   - Vercel deployment logs
   - Browser console errors
   - Prisma migration output

2. **Verify Schema:**
   ```bash
   npx prisma validate
   npx prisma db pull
   ```

3. **Test Locally:**
   ```bash
   npm run dev
   # Visit http://localhost:3000/dashboard
   ```

---

## 🚀 Ready to Deploy!

Once migration succeeds, your platform will have:

- ✅ Daily opportunity matching
- ✅ Early access system
- ✅ Match score algorithm
- ✅ Feedback collection
- ✅ Credit-based unlocks
- ✅ Admin early access controls

**Time to ship! 🎊**

