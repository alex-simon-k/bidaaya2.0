// Stripe Price IDs - Replace these with your actual price IDs from Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  // Student Plans
  STUDENT_PREMIUM_MONTHLY: process.env.STRIPE_STUDENT_PREMIUM_MONTHLY || 'price_1Rf3ufRoORqpPhxpIMusBejz',
  STUDENT_PREMIUM_YEARLY: process.env.STRIPE_STUDENT_PREMIUM_YEARLY || 'price_1Rf3ufRoORqpPhxpimdP61lN',
  STUDENT_PRO_MONTHLY: process.env.STRIPE_STUDENT_PRO_MONTHLY || 'price_1Rf3ufRoORqpPhxpf92FixEq',
  STUDENT_PRO_YEARLY: process.env.STRIPE_STUDENT_PRO_YEARLY || 'price_1Rf3ugRoORqpPhxpOH82H0kO',
  
  // Company Plans
  COMPANY_BASIC_MONTHLY: process.env.STRIPE_COMPANY_BASIC_MONTHLY || 'price_test_company_basic_monthly',
  COMPANY_PREMIUM_MONTHLY: process.env.STRIPE_COMPANY_PREMIUM_MONTHLY || 'price_test_company_premium_monthly',
  COMPANY_PRO_MONTHLY: process.env.STRIPE_COMPANY_PRO_MONTHLY || 'price_test_company_pro_monthly',
} as const

// Helper function to get price ID based on plan and billing cycle
export function getStripePriceId(planId: string, isYearly: boolean = false): string {
  switch (planId) {
    case 'student-premium':
      return isYearly ? STRIPE_PRICE_IDS.STUDENT_PREMIUM_YEARLY : STRIPE_PRICE_IDS.STUDENT_PREMIUM_MONTHLY
    case 'student-pro':
      return isYearly ? STRIPE_PRICE_IDS.STUDENT_PRO_YEARLY : STRIPE_PRICE_IDS.STUDENT_PRO_MONTHLY
    case 'company-basic':
      return STRIPE_PRICE_IDS.COMPANY_BASIC_MONTHLY
    case 'company-premium':
      return STRIPE_PRICE_IDS.COMPANY_PREMIUM_MONTHLY
    case 'company-pro':
      return STRIPE_PRICE_IDS.COMPANY_PRO_MONTHLY
    default:
      throw new Error(`Unknown plan ID: ${planId}`)
  }
}

// Map Stripe price IDs back to plan names (for webhooks)
export function getPlanFromStripePrice(priceId: string): string {
  const priceMapping: Record<string, string> = {
    [STRIPE_PRICE_IDS.STUDENT_PREMIUM_MONTHLY]: 'STUDENT_PREMIUM',
    [STRIPE_PRICE_IDS.STUDENT_PREMIUM_YEARLY]: 'STUDENT_PREMIUM',
    [STRIPE_PRICE_IDS.STUDENT_PRO_MONTHLY]: 'STUDENT_PRO',
    [STRIPE_PRICE_IDS.STUDENT_PRO_YEARLY]: 'STUDENT_PRO',
    [STRIPE_PRICE_IDS.COMPANY_BASIC_MONTHLY]: 'COMPANY_BASIC',
    [STRIPE_PRICE_IDS.COMPANY_PREMIUM_MONTHLY]: 'COMPANY_PREMIUM',
    [STRIPE_PRICE_IDS.COMPANY_PRO_MONTHLY]: 'COMPANY_PRO',
  }

  return priceMapping[priceId] || 'FREE'
} 