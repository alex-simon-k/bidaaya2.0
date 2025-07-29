import { SubscriptionPlan } from '@prisma/client'

// Define a more complete User interface
interface UserWithLimits {
  id: string
  subscriptionPlan: SubscriptionPlan
  applicationsThisMonth: number
  lastMonthlyReset: Date
}

export interface ApplicationLimits {
  maxApplications: number
  documentsAllowed: number
  canApply: boolean
  applicationsUsed: number
  applicationsRemaining: number
  nextResetDate: Date
  requiresUpgrade: boolean
  upgradeReason?: string
}

export interface StudentSubscriptionTier {
  plan: SubscriptionPlan
  monthlyApplications: number
  documentsAllowed: number
  externalTracking: boolean
  portfolioFeatures: boolean
  prioritySupport: boolean
  earlyAccess?: boolean // Added for new tier
}

export const STUDENT_TIERS: Record<string, StudentSubscriptionTier> = {
  FREE: {
    plan: 'FREE',
    monthlyApplications: 4, // ✅ Updated to 4 applications
    documentsAllowed: 0, // No additional documents
    externalTracking: false,
    portfolioFeatures: true, // Basic gamification
    prioritySupport: false
  },
  STUDENT_PREMIUM: {
    plan: 'STUDENT_PREMIUM',
    monthlyApplications: 10, // ✅ Updated to 10 applications
    documentsAllowed: 1, // 1 additional document per application
    externalTracking: true, // External job tracking
    portfolioFeatures: true, // Enhanced gamification
    prioritySupport: false
  },
  STUDENT_PRO: {
    plan: 'STUDENT_PRO',
    monthlyApplications: -1, // ✅ Unlimited applications
    documentsAllowed: 1, // 1 additional document per application
    externalTracking: true,
    portfolioFeatures: true, // Premium gamification features
    prioritySupport: true, // Priority customer support
    earlyAccess: true // 🔥 NEW: 24-36h early access to projects
  }
}

export function getStudentTier(subscriptionPlan: SubscriptionPlan): StudentSubscriptionTier {
  return STUDENT_TIERS[subscriptionPlan] || STUDENT_TIERS.FREE
}

export function shouldResetMonthlyApplications(user: UserWithLimits): boolean {
  const now = new Date()
  const lastReset = new Date(user.lastMonthlyReset)
  
  // Reset if it's been more than 30 days OR if it's a new month
  const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24))
  const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()
  
  return daysSinceReset >= 30 || isNewMonth
}

export function getNextResetDate(lastReset: Date): Date {
  const nextReset = new Date(lastReset)
  nextReset.setMonth(nextReset.getMonth() + 1)
  return nextReset
}

export function checkApplicationLimits(user: UserWithLimits): ApplicationLimits {
  const tier = getStudentTier(user.subscriptionPlan)
  const shouldReset = shouldResetMonthlyApplications(user)
  
  // Calculate current usage (reset if needed)
  const applicationsUsed = shouldReset ? 0 : user.applicationsThisMonth
  const applicationsRemaining = Math.max(0, tier.monthlyApplications - applicationsUsed)
  const canApply = applicationsRemaining > 0

  return {
    maxApplications: tier.monthlyApplications,
    documentsAllowed: tier.documentsAllowed,
    canApply,
    applicationsUsed,
    applicationsRemaining,
    nextResetDate: getNextResetDate(user.lastMonthlyReset),
    requiresUpgrade: !canApply && user.subscriptionPlan === 'FREE',
    upgradeReason: !canApply ? `You've reached your monthly limit of ${tier.monthlyApplications} applications. Upgrade to apply to more projects!` : undefined
  }
}

export function canUploadDocuments(user: UserWithLimits): { canUpload: boolean; reason?: string; upgradePrompt?: string } {
  const tier = getStudentTier(user.subscriptionPlan)
  
  if (tier.documentsAllowed === 0) {
    return {
      canUpload: false,
      reason: 'Document uploads are not available on the free plan',
      upgradePrompt: 'Premium users can add additional files to strengthen their application. Upgrade now to stand out!'
    }
  }
  
  return { canUpload: true }
}

export function canUserApply(user: any, currentApplications: number = 0): { canApply: boolean; reason?: string } {
  const limits = checkApplicationLimits(user)
  
  if (!limits.canApply) {
    return {
      canApply: false,
      reason: limits.upgradeReason || 'Application limit reached'
    }
  }
  
  return { canApply: true }
}

export interface UpgradePromptConfig {
  title: string
  description: string
  benefits: string[]
  ctaText: string
  urgency?: string
}

export function getApplicationUpgradePrompt(user: UserWithLimits): UpgradePromptConfig | null {
  const limits = checkApplicationLimits(user)
  
  if (!limits.requiresUpgrade) return null
  
  return {
    title: "🚀 You've Hit Your Application Limit!",
    description: `You've used all ${limits.maxApplications} of your free monthly applications.`,
    benefits: [
      '📈 Premium: 10 apps/month • Pro: Unlimited',
      '📎 Upload additional documents',
      '📊 Track external applications',
      '🎯 AI-powered project matching',
      '⭐ Priority support'
    ],
    ctaText: 'Upgrade to Premium',
    urgency: `Next reset: ${limits.nextResetDate.toLocaleDateString()}`
  }
}

export function getFileUpgradePrompt(): UpgradePromptConfig {
  return {
    title: "💼 Strengthen Your Application",
    description: "Premium users can upload additional documents like portfolios, transcripts, and certificates.",
    benefits: [
      '📎 Upload 1 additional file per application',
      '📊 Portfolio & transcript uploads',
      '🎯 Higher acceptance rates',
      '⚡ Stand out from other candidates'
    ],
    ctaText: 'Upgrade Now',
    urgency: 'Join thousands of successful students!'
  }
}

// Reset monthly applications (for cron job or manual reset)
export async function resetMonthlyApplications(userId: string, prisma: any): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      applicationsThisMonth: 0,
      lastMonthlyReset: new Date()
      }
  })
}

// Increment application count
export async function incrementApplicationCount(userId: string, prisma: any): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      applicationsThisMonth: {
        increment: 1
      }
    }
  })
} 