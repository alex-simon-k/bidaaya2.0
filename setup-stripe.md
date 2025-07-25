# 🔥 URGENT: Set Up Stripe Environment Variables

## Why Your Upgrade Buttons Don't Work

Your Stripe checkout API returns this error when STRIPE_SECRET_KEY is missing:
"Payment system is currently being configured. Please try again later."

## ⚡ Quick Fix (2 minutes):

### Step 1: Create .env.local file
```bash
# Create the file
touch .env.local

# Add these lines to .env.local:
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### Step 2: Get Your Stripe Keys
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)
3. Copy your **Publishable key** (starts with `pk_test_`)

### Step 3: Replace in .env.local
```bash
# Replace these placeholder values:
STRIPE_SECRET_KEY=sk_test_51ABC123...your_actual_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123...your_actual_publishable_key
```

### Step 4: Restart Development Server
```bash
# Kill current server
pkill -f "next dev"

# Start fresh
npm run dev
```

## ✅ After Setup:
- Upgrade buttons will redirect to Stripe checkout
- Users can complete payments
- Subscriptions will be tracked in your dashboard
- Webhooks will update user tiers automatically

## 🎯 Your Price IDs Are Already Configured:
- Student Premium: price_1RoSRXRoQRapPhxpPpjy7RJQ ✅
- Student Pro: price_1RoSBRoQRapPhxpXXaZSwJ6 ✅
- Company Basic: price_1RoSM6RoQRapPhxpqlfJZrqY ✅
- HR Booster: price_1RoSM6RoQRapPhxproAl4FEc ✅
- HR Agent: price_1Rf2jRoQRapPhxpMOWnksOY ✅

You just need the environment variables!
