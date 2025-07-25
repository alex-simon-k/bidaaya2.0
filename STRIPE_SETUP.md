# 🚀 Stripe Integration Setup & Testing Guide

## 📋 Prerequisites

1. **Stripe Account**: Create a free account at [stripe.com](https://stripe.com)
2. **Environment Variables**: Add these to your `.env` file

## 🔧 Environment Variables Setup

Add these variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
ki
# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_STUDENT_PREMIUM_MONTHLY=price_your_premium_monthly_id
STRIPE_STUDENT_PREMIUM_YEARLY=price_your_premium_yearly_id
STRIPE_STUDENT_PRO_MONTHLY=price_your_pro_monthly_id
STRIPE_STUDENT_PRO_YEARLY=price_your_pro_yearly_id
```

## 🛍️ Creating Products & Prices in Stripe Dashboard

### 1. Create Products
Go to Stripe Dashboard → Products → Add Product

**Product 1: Student Premium**
- Name: "Student Premium"
- Description: "For active job seekers"

**Product 2: Student Pro**
- Name: "Student Pro" 
- Description: "For serious career builders"

### 2. Create Prices
For each product, create monthly and yearly prices:

**Student Premium Prices:**
- Monthly: $5.00 USD, recurring monthly
- Yearly: $48.00 USD, recurring yearly (20% discount)

**Student Pro Prices:**
- Monthly: $15.00 USD, recurring monthly
- Yearly: $144.00 USD, recurring yearly (20% discount)

### 3. Copy Price IDs
After creating prices, copy the price IDs (they look like `price_1234567890abcdef`) and add them to your `.env` file.

## 🔗 Webhook Setup

### 1. Create Webhook Endpoint
In Stripe Dashboard → Developers → Webhooks → Add endpoint

**Endpoint URL:** `https://your-domain.com/api/webhooks/stripe`
(For local testing: use ngrok or similar tunneling service)

**Events to listen for:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 2. Get Webhook Secret
After creating the webhook, copy the webhook secret and add it to your `.env` file.

## 🧪 Testing the Payment Flow

### 1. Free Plan Testing
- Sign up as a student
- In the paywall modal, click "Get Started Free"
- Should upgrade to free plan without payment

### 2. Paid Plan Testing
- Click on Premium ($5/month) or Pro ($15/month)
- Should redirect to Stripe Checkout
- Use test card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

### 3. Test Cards for Different Scenarios

```
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Authentication Required: 4000 0025 0000 3155
```

## 🔄 Payment Flow Journey

### 1. User Journey
```
Dashboard → Paywall Modal → Select Plan → Stripe Checkout → Success Page → Dashboard
```

### 2. What Happens Behind the Scenes
1. User clicks plan → API call to `/api/subscription/checkout`
2. Creates Stripe checkout session with proper price ID
3. User completes payment on Stripe
4. Stripe sends webhook to `/api/webhooks/stripe`
5. Webhook updates user subscription in database
6. User redirected to success page
7. Session updated with new subscription status

### 3. Free User Experience
- **Zero friction**: Free plan selection immediately upgrades user
- **No payment flow**: Direct database update
- **Instant access**: Modal closes, user continues to dashboard

## 🛠️ Subscription Management

### Customer Portal
Users can manage their subscriptions via Stripe's customer portal:
- Update payment methods
- Cancel subscriptions
- View billing history
- Download invoices

Access via: `/api/subscription/portal` endpoint

## 🐛 Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is correct
   - Verify webhook secret in environment
   - Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

2. **Price ID not found**
   - Verify price IDs in Stripe dashboard
   - Check environment variables are loaded
   - Ensure price IDs match exactly

3. **Database sync issues**
   - Run: `npx prisma generate` to update types
   - If push hangs, use manual database scripts (as we did before)

### Testing Webhooks Locally

1. Install Stripe CLI: `npm install -g stripe`
2. Login: `stripe login`
3. Forward events: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Use the webhook secret from CLI output

## 📊 Monitoring

### Stripe Dashboard
- Monitor payments in real-time
- View subscription status
- Check webhook delivery logs
- Analyze payment failures

### Application Logs
- Checkout session creation
- Webhook event processing
- User subscription updates
- Error handling

## 🚀 Going Live

When ready for production:

1. Switch to live Stripe keys
2. Create live products and prices
3. Update webhook endpoint to production URL
4. Test with real payment methods
5. Monitor for issues

## 💡 Next Steps

After basic payment flow works:

1. **Feature Gating**: Implement premium feature restrictions
2. **Usage Limits**: Track and enforce plan limits
3. **Billing Alerts**: Notify users of payment issues
4. **Analytics**: Track conversion rates and churn
5. **Dunning Management**: Handle failed payments gracefully

---

## 🎯 Quick Test Checklist

- [ ] Environment variables configured
- [ ] Stripe products and prices created
- [ ] Webhook endpoint configured
- [ ] Free plan selection works
- [ ] Paid plan redirects to Stripe
- [ ] Test payment completes successfully
- [ ] Webhook updates user subscription
- [ ] Success page displays correctly
- [ ] User can access premium features
- [ ] Customer portal works for subscription management

Happy testing! 🎉 