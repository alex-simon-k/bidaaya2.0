# 🚀 Stripe Integration Setup Guide - Test Mode

## 📋 Quick Setup Checklist

- [ ] Create Stripe account and get test API keys
- [ ] Add Stripe keys to your `.env` file
- [ ] Create test products and prices in Stripe Dashboard
- [ ] Update environment variables with test price IDs
- [ ] Test the payment flow
- [ ] Set up webhook endpoint (optional for testing)

## 🔧 Step 1: Get Stripe Test API Keys

1. **Create Stripe Account**: Go to [stripe.com](https://stripe.com) and create a free account
2. **Access Dashboard**: Go to [dashboard.stripe.com](https://dashboard.stripe.com)
3. **Get Test Keys**: 
   - Click "Developers" in the left sidebar
   - Click "API keys"
   - **Make sure you're in "Test mode"** (toggle in top right)
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Click "Reveal test key" and copy your **Secret key** (starts with `sk_test_`)

## 🔐 Step 2: Update Your .env File

Add these variables to your `.env` file:

```env
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY="sk_test_your_actual_test_secret_key_here"
STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_test_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Stripe Price IDs (TEST MODE - will be updated after creating products)
STRIPE_COMPANY_BASIC_MONTHLY="price_test_company_basic_monthly_placeholder"
STRIPE_COMPANY_PREMIUM_MONTHLY="price_test_company_premium_monthly_placeholder"  
STRIPE_COMPANY_PRO_MONTHLY="price_test_company_pro_monthly_placeholder"
```

## 🛍️ Step 3: Create Test Products in Stripe Dashboard

### Navigate to Products
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top right)
3. Click "Products" in the left sidebar
4. Click "Add product"

### Create Company Basic Plan
1. **Name**: `Company Basic Plan`
2. **Description**: `Perfect for internship programs - 1 project per quarter`
3. **Pricing model**: `Standard pricing`
4. **Price**: `$20.00 USD`
5. **Billing period**: `Monthly`
6. Click "Save product"
7. **Copy the Price ID** (starts with `price_`) - you'll need this!

### Create Company Premium Plan  
1. **Name**: `Company Premium Plan`
2. **Description**: `HR Booster with AI-powered features`
3. **Pricing model**: `Standard pricing`
4. **Price**: `$75.00 USD`
5. **Billing period**: `Monthly`
6. Click "Save product"
7. **Copy the Price ID** (starts with `price_`) - you'll need this!

### Create Company Pro Plan
1. **Name**: `Company Pro Plan`
2. **Description**: `Your AI-powered HR Agent`
3. **Pricing model**: `Standard pricing`
4. **Price**: `$150.00 USD`
5. **Billing period**: `Monthly`
6. Click "Save product"
7. **Copy the Price ID** (starts with `price_`) - you'll need this!

## 🔄 Step 4: Update Environment Variables with Real Price IDs

Replace the placeholder price IDs in your `.env` file with the actual ones:

```env
# Replace these with your actual price IDs from Stripe Dashboard
STRIPE_COMPANY_BASIC_MONTHLY="price_1AbCdEfGhIjKlMnO"
STRIPE_COMPANY_PREMIUM_MONTHLY="price_1PqRsTuVwXyZaBcD"
STRIPE_COMPANY_PRO_MONTHLY="price_1EfGhIjKlMnOpQrS"
```

## 🧪 Step 5: Test the Payment Flow

1. **Restart your development server**: `npm run dev`
2. **Login as a company user**
3. **Go to dashboard** - you should see the paywall modal
4. **Click on any paid plan** - this should redirect you to Stripe Checkout
5. **Use Stripe test card numbers**:
   - **Success**: `4242 4242 4242 4242`
   - **Declined**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0000 0000 3220`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3-digit number (e.g., `123`)
   - **ZIP**: Any 5-digit number (e.g., `12345`)

## 🔗 Step 6: Set Up Webhook (Optional for Basic Testing)

For production and advanced features, you'll need webhooks:

### Create Webhook Endpoint
1. In Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
   - For local testing, use ngrok: `https://abc123.ngrok.io/api/webhooks/stripe`
4. **Events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. **Copy the webhook secret** (starts with `whsec_`)
7. Add it to your `.env` file

### For Local Testing with ngrok
```bash
# Install ngrok
npm install -g ngrok

# In one terminal, start your app
npm run dev

# In another terminal, expose localhost:3000
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok.io) and use it in Stripe webhook
```

## 🎯 Testing Scenarios

### Successful Payment Flow
1. Company user clicks "Choose Plan" → Redirects to Stripe
2. User enters test card `4242 4242 4242 4242`
3. Completes payment → Redirects back to dashboard
4. User subscription is updated in database
5. User sees premium features unlocked

### Failed Payment Flow
1. Company user clicks "Choose Plan" → Redirects to Stripe
2. User enters declined card `4000 0000 0000 0002`
3. Payment fails → User stays on Stripe with error
4. User can retry with different card or cancel

## 🚀 Going Live

When ready for production:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Create live products** (same process as test products)
3. **Update .env** with live API keys and price IDs:
   ```env
   STRIPE_SECRET_KEY="sk_live_your_live_secret_key"
   STRIPE_PUBLISHABLE_KEY="pk_live_your_live_publishable_key"
   ```
4. **Update webhook endpoint** to your production URL
5. **Test with real card** (small amount first!)

## 🔍 Troubleshooting

### Common Issues

**"No such price" error**
- Check that price IDs in `.env` match exactly with Stripe Dashboard
- Ensure you're in the right mode (test vs live)

**Checkout session not creating**
- Verify `STRIPE_SECRET_KEY` is correct and starts with `sk_test_`
- Check server logs for detailed error messages

**Webhook not receiving events**
- Ensure webhook URL is publicly accessible
- Check webhook secret matches exactly
- Verify events are selected in Stripe Dashboard

### Debug Commands

```bash
# Check environment variables are loaded
echo $STRIPE_SECRET_KEY

# Test Stripe connection (install stripe CLI)
stripe customers list

# Listen to webhook events locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 📞 Support

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Test Cards**: [stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Webhook Testing**: [stripe.com/docs/webhooks/test](https://stripe.com/docs/webhooks/test)

---

🎉 **You're all set!** Your Stripe integration is ready for testing. Users can now subscribe to paid plans through secure Stripe checkout! 