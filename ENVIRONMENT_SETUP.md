# 🚀 Environment Setup Guide

## Quick Start

1. **Copy the environment file**:
   ```bash
   cp .env.local .env.local.backup  # backup if you already have one
   ```

2. **Fill in your actual values** in `.env.local`:

### 🔑 Required for Basic Functionality
```env
DATABASE_URL="your_supabase_or_postgres_connection_string"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_random_secret_string"
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"
EMAIL_USER="your_gmail_address@gmail.com"
EMAIL_PASSWORD="your_gmail_app_password"
```

### 💳 Required for Stripe Payments
```env
STRIPE_SECRET_KEY="sk_test_your_actual_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_stripe_publishable_key"
```

### 🛍️ Stripe Price IDs (Replace after creating products)
```env
STRIPE_COMPANY_BASIC_MONTHLY="price_your_actual_basic_price_id"
STRIPE_COMPANY_PREMIUM_MONTHLY="price_your_actual_premium_price_id"
STRIPE_COMPANY_PRO_MONTHLY="price_your_actual_pro_price_id"
```

## 🏃‍♂️ Quick Stripe Setup (5 minutes)

1. **Go to** [stripe.com](https://stripe.com) → Create account
2. **Get test keys**: Dashboard → Developers → API keys (make sure you're in Test mode)
3. **Create products**: Dashboard → Products → Add product
   - Company Basic Plan: $20/month
   - Company Premium Plan: $75/month
   - Company Pro Plan: $150/month
4. **Copy the price IDs** (start with `price_`) to your `.env.local`
5. **Restart your dev server**: `npm run dev`

## 🚨 Current Status

If you see errors like "Payment system is currently being set up", it means:
- Stripe keys are missing or contain placeholder values
- Price IDs haven't been set up yet

**Fix**: Follow the Stripe setup above or see `STRIPE_SETUP_GUIDE.md` for detailed instructions.

## 🧪 Test with These Cards
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Any future expiry date and any 3-digit CVC**

## ❓ Need Help?
- Full Stripe guide: `STRIPE_SETUP_GUIDE.md`
- Database issues: Check your Supabase connection
- Google OAuth: Check your Google Cloud Console settings 