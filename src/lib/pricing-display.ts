// Centralized pricing display utility that uses environment variables
// This ensures all pricing across the platform is consistent

export interface PlanPricing {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice?: number
  currency: string
  stripeMonthlyPriceId?: string
  stripeYearlyPriceId?: string
}

// Student plan pricing from environment/config
export const STUDENT_PLAN_PRICING: PlanPricing[] = [
  {
    id: 'STUDENT_PREMIUM',
    name: 'Career Builder',
    monthlyPrice: 5,
    yearlyPrice: 50, // ~10% discount
    currency: '£',
    stripeMonthlyPriceId: process.env.STRIPE_STUDENT_PREMIUM_MONTHLY,
    stripeYearlyPriceId: process.env.STRIPE_STUDENT_PREMIUM_YEARLY,
  },
  {
    id: 'STUDENT_PRO',
    name: 'Career Accelerator',
    monthlyPrice: 15,
    yearlyPrice: 150, // ~10% discount
    currency: '£',
    stripeMonthlyPriceId: process.env.STRIPE_STUDENT_PRO_MONTHLY,
    stripeYearlyPriceId: process.env.STRIPE_STUDENT_PRO_YEARLY,
  }
]

// Company plan pricing from environment/config
export const COMPANY_PLAN_PRICING: PlanPricing[] = [
  {
    id: 'COMPANY_BASIC',
    name: 'Company Basic',
    monthlyPrice: 20,
    yearlyPrice: 200, // ~15% discount
    currency: '£',
    stripeMonthlyPriceId: process.env.STRIPE_COMPANY_BASIC_MONTHLY,
    stripeYearlyPriceId: process.env.STRIPE_COMPANY_BASIC_YEARLY,
  },
  {
    id: 'COMPANY_PREMIUM',
    name: 'HR Booster',
    monthlyPrice: 75,
    yearlyPrice: 750, // ~15% discount
    currency: '£',
    stripeMonthlyPriceId: process.env.STRIPE_COMPANY_PREMIUM_MONTHLY,
    stripeYearlyPriceId: process.env.STRIPE_COMPANY_PREMIUM_YEARLY,
  },
  {
    id: 'COMPANY_PRO',
    name: 'HR Agent',
    monthlyPrice: 175,
    yearlyPrice: 1750, // ~15% discount
    currency: '£',
    stripeMonthlyPriceId: process.env.STRIPE_COMPANY_PRO_MONTHLY,
    stripeYearlyPriceId: process.env.STRIPE_COMPANY_PRO_YEARLY,
  }
]

// Helper functions
export function getPlanPricing(planId: string): PlanPricing | null {
  const allPlans = [...STUDENT_PLAN_PRICING, ...COMPANY_PLAN_PRICING]
  return allPlans.find(plan => plan.id === planId) || null
}

export function formatPrice(price: number, currency: string = '£'): string {
  return `${currency}${price}`
}

export function getPlanDisplayName(planId: string): string {
  const plan = getPlanPricing(planId)
  return plan?.name || planId
}

export function getPlanPrice(planId: string, isYearly: boolean = false): number {
  const plan = getPlanPricing(planId)
  if (!plan) return 0
  return isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice
}

export function formatPlanPrice(planId: string, isYearly: boolean = false): string {
  const plan = getPlanPricing(planId)
  if (!plan) return 'Free'
  
  const price = isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice
  const period = isYearly ? 'year' : 'month'
  
  return `${plan.currency}${price}/${period}`
}
