// Credit System Configuration and Utilities

export const CREDIT_COSTS = {
  EARLY_ACCESS: 7,           // 2 opportunities early access
  CUSTOM_CV: 5,              // Custom CV generation
  CUSTOM_COVER_LETTER: 3,    // Custom cover letter generation
  INTERNAL_APPLICATION: 5,   // Legacy - applying to internal opportunities
  COMPANY_PROPOSAL: 7,       // Legacy - company proposal
} as const

export const MONTHLY_CREDITS = {
  FREE: 20,
  STUDENT_PREMIUM: 100,
  STUDENT_PRO: 200,
  COMPANY_BASIC: 50,
  COMPANY_PREMIUM: 150,
  COMPANY_PRO: 300,
} as const

export type CreditAction = keyof typeof CREDIT_COSTS

export interface CreditTransactionData {
  userId: string
  type: 'monthly_refresh' | 'purchase' | 'spent' | 'refund'
  action?: CreditAction
  amount: number
  balanceBefore: number
  balanceAfter: number
  relatedId?: string  // e.g., opportunityId, applicationId
  description?: string
}

/**
 * Calculate credits for a specific action
 */
export function getActionCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action]
}

/**
 * Get monthly credit allocation for a subscription plan
 */
export function getMonthlyCreditsForPlan(plan: string): number {
  return MONTHLY_CREDITS[plan as keyof typeof MONTHLY_CREDITS] || MONTHLY_CREDITS.FREE
}

/**
 * Check if user has enough credits for an action
 */
export function hasEnoughCredits(currentCredits: number, action: CreditAction): boolean {
  return currentCredits >= CREDIT_COSTS[action]
}

/**
 * Calculate if early access should be shown (for Pro tier)
 */
export function canAccessEarlyForFree(subscriptionPlan: string): boolean {
  return subscriptionPlan === 'STUDENT_PRO'
}

