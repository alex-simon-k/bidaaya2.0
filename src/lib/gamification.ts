import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// XP Actions and Rewards
export const XP_ACTIONS = {
  // Profile & Setup
  COMPLETE_PROFILE: { xp: 50, description: 'Complete your profile' },
  ADD_SKILLS: { xp: 20, description: 'Add skills to your profile' },
  ADD_BIO: { xp: 30, description: 'Write a compelling bio' },
  ADD_LINKEDIN: { xp: 15, description: 'Connect your LinkedIn' },
  UPLOAD_RESUME: { xp: 25, description: 'Upload your resume' },
  
  // Applications
  FIRST_APPLICATION: { xp: 100, description: 'Submit your first application' },
  APPLICATION_SUBMITTED: { xp: 25, description: 'Submit a project application' },
  APPLICATION_ACCEPTED: { xp: 200, description: 'Get accepted for a project' },
  
  // Learning & Growth
  COMPLETE_QUIZ: { xp: 40, description: 'Complete career discovery quiz' },
  SKILLS_ASSESSMENT: { xp: 60, description: 'Complete skills assessment' },
  
  // Engagement
  DAILY_LOGIN: { xp: 5, description: 'Daily platform visit' },
  WEEKLY_STREAK: { xp: 50, description: 'Login 7 days in a row' },
  PROFILE_VIEW: { xp: 2, description: 'Someone viewed your profile' },
  
  // Social & Network
  REFERRAL_SIGNUP: { xp: 100, description: 'Friend signs up with your referral' },
  MENTORSHIP_SESSION: { xp: 75, description: 'Complete mentorship session' },
  
  // External Tracking (Pro/Premium)
  EXTERNAL_APPLICATION: { xp: 15, description: 'Track external application' },
  EXTERNAL_INTERVIEW: { xp: 50, description: 'Report external interview' },
} as const

// Level System
export const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, title: 'Explorer', description: 'Just getting started' },
  { level: 2, minXp: 100, title: 'Seeker', description: 'Building your foundation' },
  { level: 3, minXp: 250, title: 'Achiever', description: 'Making progress' },
  { level: 4, minXp: 500, title: 'Professional', description: 'Serious about growth' },
  { level: 5, minXp: 1000, title: 'Expert', description: 'Highly experienced' },
  { level: 6, minXp: 2000, title: 'Master', description: 'Elite performer' },
  { level: 7, minXp: 3500, title: 'Legend', description: 'Inspirational leader' },
  { level: 8, minXp: 5000, title: 'Champion', description: 'Top of the field' },
]

// Achievement Badges
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xpReward: number
  category: 'profile' | 'applications' | 'engagement' | 'social' | 'milestone'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  requirements: {
    type: 'count' | 'streak' | 'specific'
    action?: keyof typeof XP_ACTIONS
    target?: number
    condition?: string
  }
}

export const ACHIEVEMENTS: Achievement[] = [
  // Profile Achievements
  {
    id: 'profile_complete',
    name: 'Profile Master',
    description: 'Complete 100% of your profile',
    icon: '👤',
    xpReward: 100,
    category: 'profile',
    rarity: 'common',
    requirements: { type: 'specific', condition: 'profile_complete' }
  },
  {
    id: 'skill_collector',
    name: 'Skill Collector',
    description: 'Add 10 or more skills',
    icon: '🛠️',
    xpReward: 75,
    category: 'profile',
    rarity: 'uncommon',
    requirements: { type: 'count', target: 10, condition: 'skills_count' }
  },
  
  // Application Achievements
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Submit your first application',
    icon: '🚀',
    xpReward: 150,
    category: 'applications',
    rarity: 'common',
    requirements: { type: 'count', action: 'APPLICATION_SUBMITTED', target: 1 }
  },
  {
    id: 'application_machine',
    name: 'Application Machine',
    description: 'Submit 25 applications',
    icon: '⚡',
    xpReward: 300,
    category: 'applications',
    rarity: 'rare',
    requirements: { type: 'count', action: 'APPLICATION_SUBMITTED', target: 25 }
  },
  {
    id: 'success_story',
    name: 'Success Story',
    description: 'Get accepted for your first project',
    icon: '🏆',
    xpReward: 500,
    category: 'applications',
    rarity: 'epic',
    requirements: { type: 'count', action: 'APPLICATION_ACCEPTED', target: 1 }
  },
  
  // Engagement Achievements
  {
    id: 'regular_visitor',
    name: 'Regular Visitor',
    description: 'Login for 7 consecutive days',
    icon: '📅',
    xpReward: 200,
    category: 'engagement',
    rarity: 'uncommon',
    requirements: { type: 'streak', action: 'DAILY_LOGIN', target: 7 }
  },
  {
    id: 'dedication',
    name: 'Dedication',
    description: 'Login for 30 consecutive days',
    icon: '💪',
    xpReward: 750,
    category: 'engagement',
    rarity: 'epic',
    requirements: { type: 'streak', action: 'DAILY_LOGIN', target: 30 }
  },
  
  // Social Achievements
  {
    id: 'networker',
    name: 'Networker',
    description: 'Refer 5 friends to Bidaaya',
    icon: '🤝',
    xpReward: 500,
    category: 'social',
    rarity: 'rare',
    requirements: { type: 'count', action: 'REFERRAL_SIGNUP', target: 5 }
  },
  
  // Milestone Achievements
  {
    id: 'xp_1000',
    name: 'Rising Star',
    description: 'Earn 1,000 XP',
    icon: '⭐',
    xpReward: 100,
    category: 'milestone',
    rarity: 'uncommon',
    requirements: { type: 'count', target: 1000, condition: 'total_xp' }
  },
  {
    id: 'xp_5000',
    name: 'Elite Performer',
    description: 'Earn 5,000 XP',
    icon: '🌟',
    xpReward: 500,
    category: 'milestone',
    rarity: 'legendary',
    requirements: { type: 'count', target: 5000, condition: 'total_xp' }
  }
]

// User XP and Level Interface
export interface UserGameStats {
  totalXp: number
  currentLevel: number
  levelProgress: number // 0-100 percentage to next level
  xpToNextLevel: number
  achievements: string[] // Achievement IDs
  streak: {
    current: number
    longest: number
    lastActivity: Date
  }
  recentXpGains: XpGain[]
}

export interface XpGain {
  action: keyof typeof XP_ACTIONS
  xp: number
  timestamp: Date
  description: string
}

// Award XP to user (simplified for current schema)
export async function awardXP(
  userId: string, 
  action: keyof typeof XP_ACTIONS,
  metadata?: any
): Promise<{ xpGained: number; levelUp?: boolean; newLevel?: number; achievement?: Achievement }> {
  const xpReward = XP_ACTIONS[action]
  
  if (!xpReward) {
    throw new Error(`Invalid XP action: ${action}`)
  }

  // For now, store in bio field as JSON until we can add proper XP fields
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bio: true, // Using bio to store XP data temporarily
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Parse existing XP data from bio or start fresh
  let xpData = { totalXp: 0, achievements: [], level: 1 }
  try {
    if (user.bio && user.bio.startsWith('XP:')) {
      xpData = JSON.parse(user.bio.replace('XP:', ''))
    }
  } catch (e) {
    // Start fresh if bio isn't XP data
  }

  const currentTotalXp = xpData.totalXp || 0
  const newTotalXp = currentTotalXp + xpReward.xp

  // Calculate level progression
  const currentLevel = calculateLevel(currentTotalXp)
  const newLevel = calculateLevel(newTotalXp)
  const leveledUp = newLevel > currentLevel

  // Update XP data
  xpData.totalXp = newTotalXp
  xpData.level = newLevel

  // Store back in bio field temporarily
  await prisma.user.update({
    where: { id: userId },
    data: {
      bio: `XP:${JSON.stringify(xpData)}`, // Temporary storage
    }
  })

  return {
    xpGained: xpReward.xp,
    levelUp: leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    achievement: undefined // Simplified for now
  }
}

// Calculate user level from total XP
export function calculateLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i].minXp) {
      return LEVEL_THRESHOLDS[i].level
    }
  }
  return 1
}

// Get level info for given XP
export function getLevelInfo(totalXp: number) {
  const currentLevel = calculateLevel(totalXp)
  const currentLevelThreshold = LEVEL_THRESHOLDS.find(l => l.level === currentLevel)!
  const nextLevelThreshold = LEVEL_THRESHOLDS.find(l => l.level === currentLevel + 1)
  
  if (!nextLevelThreshold) {
    // Max level reached
    return {
      level: currentLevel,
      title: currentLevelThreshold.title,
      description: currentLevelThreshold.description,
      progress: 100,
      xpToNext: 0,
      isMaxLevel: true
    }
  }

  const xpInCurrentLevel = totalXp - currentLevelThreshold.minXp
  const xpNeededForNextLevel = nextLevelThreshold.minXp - currentLevelThreshold.minXp
  const progress = Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100)

  return {
    level: currentLevel,
    title: currentLevelThreshold.title,
    description: currentLevelThreshold.description,
    progress,
    xpToNext: nextLevelThreshold.minXp - totalXp,
    isMaxLevel: false
  }
}

// Simplified achievement checking (will be expanded when proper fields are added)
async function checkAndAwardAchievements(
  userId: string, 
  action: keyof typeof XP_ACTIONS,
  totalXp: number
): Promise<Achievement | undefined> {
  // Simplified for now - will implement when we have proper achievement storage
  return undefined
}

// Get user's complete gamification stats
export async function getUserGameStats(userId: string): Promise<UserGameStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bio: true,
      createdAt: true,
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Parse XP data from bio field
  let xpData = { totalXp: 0, achievements: [], level: 1 }
  try {
    if (user.bio && user.bio.startsWith('XP:')) {
      xpData = JSON.parse(user.bio.replace('XP:', ''))
    }
  } catch (e) {
    // Default values if no XP data
  }

  const totalXp = xpData.totalXp || 0
  const levelInfo = getLevelInfo(totalXp)

  return {
    totalXp,
    currentLevel: levelInfo.level,
    levelProgress: levelInfo.progress,
    xpToNextLevel: levelInfo.xpToNext,
    achievements: xpData.achievements || [],
    streak: {
      current: 0, // Simplified for now
      longest: 0,
      lastActivity: user.createdAt
    },
    recentXpGains: [] // Will implement when we have proper logging
  }
}

// Get leaderboard (simplified for current schema)
export async function getLeaderboard(limit: number = 10) {
  const users = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      bio: { startsWith: 'XP:' } // Only users with XP data
    },
    select: {
      id: true,
      name: true,
      bio: true,
      university: true,
    },
    take: 50 // Get more to sort by XP
  })

  // Parse XP data and sort
  const usersWithXp = users.map(user => {
    let xpData = { totalXp: 0, level: 1 }
    try {
      if (user.bio && user.bio.startsWith('XP:')) {
        xpData = JSON.parse(user.bio.replace('XP:', ''))
      }
    } catch (e) {
      // Skip users with invalid XP data
    }

    return {
      userId: user.id,
      name: user.name,
      totalXp: xpData.totalXp || 0,
      level: xpData.level || 1,
      university: user.university,
      levelInfo: getLevelInfo(xpData.totalXp || 0)
    }
  })
  .filter(user => user.totalXp > 0)
  .sort((a, b) => b.totalXp - a.totalXp)
  .slice(0, limit)

  return usersWithXp.map((user, index) => ({
    rank: index + 1,
    ...user
  }))
} 