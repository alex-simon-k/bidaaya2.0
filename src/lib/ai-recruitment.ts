import { PrismaClient } from '@prisma/client'
import { calculateCompatibilityScore, CompatibilityResult } from './ai-scoring'
import { getApplicantVisibilityLevel, getSubscriptionTier } from './subscription'

const prisma = new PrismaClient()

export interface ShortlistedCandidate {
  applicationId: string
  userId: string
  compatibilityScore: number
  ranking: number
  user: {
  id: string
  name: string
    email?: string // Tier-dependent
  university?: string
  major?: string
  skills: string[]
  bio?: string
    linkedin?: string // Tier-dependent
    graduationYear?: number
  }
  application: {
    coverLetter?: string
    motivation?: string
    createdAt: Date
  }
  aiInsights?: {
    keyStrengths: string[]
    concerns: string[]
    recommendation: string
  }
}

export interface ShortlistingResult {
  projectId: string
  totalApplications: number
  shortlistedCount: number
  candidates: ShortlistedCandidate[]
  generatedAt: Date
  visibilityLevel: 'shortlisted_only' | 'full_pool' | 'complete_transparency'
  upgradePrompt?: {
    currentTier: string
    benefits: string[]
    nextTier: string
  }
}

// Main function to check and trigger shortlisting
export async function checkAndTriggerShortlisting(projectId: string): Promise<ShortlistingResult | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      company: {
        select: {
          id: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
        }
      },
      applications: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              university: true,
              major: true,
              skills: true,
              bio: true,
              linkedin: true,
              graduationYear: true,
            }
          }
        }
      }
    }
  })

  if (!project) {
    throw new Error('Project not found')
  }

  const applicationCount = project.applications.length

  // Check if we have enough applications to trigger shortlisting
  if (applicationCount < 30) {
    return null // Not enough applications yet
  }

  // Check if shortlisting has already been triggered
  const existingShortlist = await prisma.application.findFirst({
    where: { 
      projectId,
      status: 'SHORTLISTED'
    }
  })

  if (existingShortlist) {
    // Return existing shortlist
    return await getExistingShortlist(projectId, project.company)
  }

  // Trigger new shortlisting
  return await generateShortlist(projectId, project.applications, project.company)
}

// Generate AI shortlist for the first time
async function generateShortlist(
  projectId: string, 
  applications: any[], 
  company: any
): Promise<ShortlistingResult> {
  console.log(`🤖 Generating AI shortlist for project ${projectId} with ${applications.length} applications`)

  // Calculate compatibility scores for all applications (if not already calculated)
  const scoredApplications = await Promise.all(
    applications.map(async (app) => {
      if (app.compatibilityScore === null) {
        try {
          const compatibilityResult = await calculateCompatibilityScore(app.userId, projectId)
          await prisma.application.update({
            where: { id: app.id },
            data: { compatibilityScore: compatibilityResult.score }
          })
          return { ...app, compatibilityScore: compatibilityResult.score, aiResult: compatibilityResult }
        } catch (error) {
          console.error(`Failed to score application ${app.id}:`, error)
          return { ...app, compatibilityScore: 50, aiResult: null } // Default score
        }
      }
      return app
    })
  )

  // Sort by compatibility score and select top 10
  const topCandidates = scoredApplications
    .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
    .slice(0, 10)

  // Update the top 10 applications to SHORTLISTED status
  await Promise.all(
    topCandidates.map(async (candidate, index) => {
      await prisma.application.update({
        where: { id: candidate.id },
        data: { 
          status: 'SHORTLISTED',
          // Store ranking for later use
          adminNotes: JSON.stringify({ ranking: index + 1, shortlistedAt: new Date() })
        }
      })
    })
  )

  console.log(`✅ Shortlisted top ${topCandidates.length} candidates for project ${projectId}`)

  return await getExistingShortlist(projectId, company)
}

// Get existing shortlist with proper tier-based filtering
async function getExistingShortlist(projectId: string, company: any): Promise<ShortlistingResult> {
  const applications = await prisma.application.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          university: true,
          major: true,
          skills: true,
          bio: true,
          linkedin: true,
          graduationYear: true,
        }
      }
    },
    orderBy: [
      { status: 'desc' }, // SHORTLISTED first
      { compatibilityScore: 'desc' }
    ]
  })

  const visibilityLevel = getApplicantVisibilityLevel(company)
  const shortlistedApps = applications.filter(app => app.status === 'SHORTLISTED')

  // Apply tier-based filtering
  const visibleCandidates = await Promise.all(
    shortlistedApps.map(async (app, index) => {
      const candidate: ShortlistedCandidate = {
        applicationId: app.id,
        userId: app.userId,
        compatibilityScore: app.compatibilityScore || 50,
        ranking: index + 1,
        user: await applyTierFiltering(app.user, visibilityLevel),
        application: {
          coverLetter: visibilityLevel !== 'shortlisted_only' ? app.coverLetter || undefined : undefined,
          motivation: visibilityLevel !== 'shortlisted_only' ? app.motivation || undefined : undefined,
          createdAt: app.createdAt,
        }
      }

      // Add AI insights for Premium tier
      if (visibilityLevel === 'complete_transparency') {
        candidate.aiInsights = await generateCandidateInsights(app, projectId)
      }

      return candidate
    })
  )

  const upgradePrompt = getUpgradePromptForVisibility(company.subscriptionPlan, visibilityLevel)

  return {
    projectId,
    totalApplications: applications.length,
    shortlistedCount: shortlistedApps.length,
    candidates: visibleCandidates,
    generatedAt: shortlistedApps[0]?.updatedAt || new Date(),
    visibilityLevel,
    upgradePrompt
  }
}

// Apply tier-based filtering to user data
async function applyTierFiltering(user: any, visibilityLevel: string): Promise<any> {
  const baseInfo = {
    id: user.id,
    name: user.name,
    university: user.university,
    major: user.major,
    skills: user.skills || [],
    graduationYear: user.graduationYear,
  }

  switch (visibilityLevel) {
    case 'shortlisted_only':
      // Basic tier - minimal info
      return {
        ...baseInfo,
        bio: user.bio ? user.bio.substring(0, 100) + '...' : undefined // Truncated bio
      }
    
    case 'full_pool':
      // Pro tier - more details + contact info
      return {
        ...baseInfo,
        email: user.email,
        bio: user.bio,
        linkedin: user.linkedin,
      }
    
    case 'complete_transparency':
      // Premium tier - everything
      return user
    
    default:
      return baseInfo
  }
}

// Generate AI insights for premium tier
async function generateCandidateInsights(application: any, projectId: string): Promise<any> {
  // This could call an AI service to generate detailed insights
  // For now, return structured insights based on compatibility score
  
  const score = application.compatibilityScore || 50

  if (score >= 80) {
    return {
      keyStrengths: ['Strong skill alignment', 'Relevant experience', 'High motivation'],
      concerns: [],
      recommendation: 'Highly recommended candidate - schedule interview immediately'
    }
  } else if (score >= 60) {
    return {
      keyStrengths: ['Good potential', 'Relevant background'],
      concerns: ['Some skill gaps', 'May need training'],
      recommendation: 'Solid candidate - worth interviewing with skill assessment'
    }
  } else {
    return {
      keyStrengths: ['Enthusiastic applicant'],
      concerns: ['Limited relevant experience', 'Skill gaps'],
      recommendation: 'Consider for entry-level role with mentoring'
    }
  }
}

// Get upgrade prompt based on current tier
function getUpgradePromptForVisibility(currentPlan: string, visibilityLevel: string) {
  if (visibilityLevel === 'complete_transparency') return undefined

  const tier = getSubscriptionTier(currentPlan || 'COMPANY_BASIC', 'COMPANY')
  
  if (visibilityLevel === 'shortlisted_only') {
      return {
      currentTier: tier?.name || 'Basic',
      benefits: [
        '📧 See candidate contact information',
        '👀 View all applicants, not just shortlist',
        '📄 Access full cover letters and motivations',
        '🔗 LinkedIn profile access',
        '📊 Enhanced candidate analytics'
      ],
      nextTier: 'HR Booster (£75/month)'
    }
  }

  // Full pool visibility - prompt for Premium
  return {
    currentTier: tier?.name || 'Pro',
    benefits: [
      '🤖 AI-powered candidate insights and recommendations',
      '🎯 Detailed compatibility analysis',
      '📞 White-glove interview service',
      '📋 Interview transcript analysis',
      '⭐ Priority candidate selection'
    ],
    nextTier: 'HR Agent (£175/month)'
        }
      }

// Manual shortlisting override for admin/premium users
export async function manualShortlist(
  projectId: string, 
  candidateIds: string[], 
  performedBy: string
): Promise<ShortlistingResult> {
  // Reset existing shortlist
  await prisma.application.updateMany({
    where: { projectId, status: 'SHORTLISTED' },
    data: { status: 'PENDING' }
  })

  // Set new shortlist
  await Promise.all(
    candidateIds.map(async (applicationId, index) => {
      await prisma.application.update({
        where: { id: applicationId },
        data: { 
          status: 'SHORTLISTED',
          adminNotes: JSON.stringify({ 
            ranking: index + 1, 
            shortlistedAt: new Date(),
            shortlistedBy: performedBy,
            isManual: true
          })
  }
      })
    })
  )

  console.log(`✅ Manual shortlist updated for project ${projectId} by ${performedBy}`)

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { company: true }
  })

  return await getExistingShortlist(projectId, project!.company)
}

// Check if project qualifies for shortlisting
export async function getShortlistingEligibility(projectId: string): Promise<{
  eligible: boolean
  currentApplications: number
  requiredApplications: number
  remainingNeeded: number
  estimatedTimeToEligibility?: string
}> {
  const applicationCount = await prisma.application.count({
    where: { projectId }
  })

  const required = 30
  const remaining = Math.max(0, required - applicationCount)

  return {
    eligible: applicationCount >= required,
    currentApplications: applicationCount,
    requiredApplications: required,
    remainingNeeded: remaining,
    estimatedTimeToEligibility: remaining > 0 
      ? `${Math.ceil(remaining / 3)} days (estimated based on current application rate)`
      : undefined
  }
} 