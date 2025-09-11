# Environment Variables Needed in Vercel

## Student Plan Price IDs (GBP)
```
STRIPE_STUDENT_PREMIUM_MONTHLY=price_xxxxx_gbp_monthly
STRIPE_STUDENT_PREMIUM_YEARLY=price_xxxxx_gbp_yearly  
STRIPE_STUDENT_PRO_MONTHLY=price_xxxxx_gbp_monthly
STRIPE_STUDENT_PRO_YEARLY=price_xxxxx_gbp_yearly
```

## Company Plan Price IDs (GBP) - MISSING FROM VERCEL
```
STRIPE_COMPANY_BASIC_MONTHLY=price_xxxxx_gbp_monthly
STRIPE_COMPANY_PREMIUM_MONTHLY=price_xxxxx_gbp_monthly
STRIPE_COMPANY_PRO_MONTHLY=price_xxxxx_gbp_monthly
```

## How to Add in Vercel:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable above with your actual Stripe price IDs
5. Set Environment: Production (and Preview if needed)
6. Redeploy your application

## Current Fallback Values (from stripe-config.ts):
- Student plans have real price IDs (but might be USD)
- Company plans are using test values: 'price_test_company_basic_monthly'
