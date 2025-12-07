import type { PrismaClient } from '@prisma/client'

type StreakSuccessResult = {
  success: true
  message: string
  streak: number
  longestStreak: number
  isNewRecord: boolean
}

type StreakFailureResult = {
  success: false
  message: string
  streak?: number | null
}

type StreakErrorResult = {
  success: false
  error: string
  status?: number
}

/**
 * Validate and get the ACTUAL streak (resets to 0 if broken)
 * Checks if the streak is still valid - if yesterday was missed, streak breaks and resets to 0
 */
export async function getActualStreak(prisma: PrismaClient, userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      lastStreakDate: true,
    },
  })

  if (!user || !user.lastStreakDate) {
    return 0
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const lastStreakDate = new Date(user.lastStreakDate)
  lastStreakDate.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // If last application was today, streak is still valid
  if (lastStreakDate.getTime() === today.getTime()) {
    return user.currentStreak || 0
  }

  // If last application was yesterday, streak is still valid (they maintained it yesterday)
  if (lastStreakDate.getTime() === yesterday.getTime()) {
    return user.currentStreak || 0
  }

  // If last application was before yesterday, there's a gap - streak is broken, reset to 0
  // This means they didn't apply yesterday, so the streak breaks
  if (lastStreakDate.getTime() < yesterday.getTime()) {
    // Update the database to reflect the broken streak
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: 0,
      },
    })
    return 0
  }

  return user.currentStreak || 0
}

/**
 * Get the VISUAL streak for display (decays gradually instead of resetting immediately)
 * This provides a "momentum" effect where missing days doesn't instantly kill all progress
 * Used for the visibility meter - separate from actual streak
 */
export async function getVisualStreak(prisma: PrismaClient, userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      lastStreakDate: true,
    },
  })

  if (!user || !user.lastStreakDate) {
    return 0
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const lastStreakDate = new Date(user.lastStreakDate)
  lastStreakDate.setHours(0, 0, 0, 0)

  // Calculate days since last application
  const daysDiff = Math.floor((today.getTime() - lastStreakDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff === 0) {
    // Applied today - show current streak
    return user.currentStreak || 0
  }

  // For each day missed, halve the visual streak (decay effect)
  // Day 1 missed: streak * 0.5
  // Day 2 missed: streak * 0.25
  // Day 3 missed: streak * 0.125, etc.
  const decayFactor = Math.pow(0.5, daysDiff)
  const visualStreak = Math.floor((user.currentStreak || 0) * decayFactor)

  // If visual streak drops below 1 after decay, reset to 0
  if (visualStreak < 1) {
    return 0
  }

  return visualStreak
}

export async function updateUserStreak(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastStreakDate: true,
    },
  })

  if (!user) {
    return { success: false, error: 'User not found', status: 404 } satisfies StreakErrorResult
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startOfToday = new Date(today)
  const endOfToday = new Date(today)
  endOfToday.setDate(endOfToday.getDate() + 1)

  // Count all applications made today across both tracking systems
  const [trackedBoardApplications, manualExternalApplications] = await Promise.all([
    prisma.externalOpportunityApplication.count({
      where: {
        userId,
        appliedAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
    }),
    prisma.externalApplication.count({
      where: {
        userId,
        appliedDate: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
    }),
  ])

  const hasAppliedToday = trackedBoardApplications + manualExternalApplications > 0

  if (!hasAppliedToday) {
    // Return current visual streak (which decays over time)
    const visualStreak = await getVisualStreak(prisma, userId)
    return {
      success: false,
      message: 'Apply to at least one opportunity today to grow your streak.',
      streak: visualStreak,
    } satisfies StreakFailureResult
  }

  const lastStreakDate = user.lastStreakDate ? new Date(user.lastStreakDate) : null
  lastStreakDate?.setHours(0, 0, 0, 0)

  let newStreak = user.currentStreak || 0
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (!lastStreakDate || lastStreakDate.getTime() === yesterday.getTime()) {
    // Continue streak - they applied yesterday, so increment
    newStreak += 1
  } else if (lastStreakDate.getTime() < yesterday.getTime()) {
    // Streak was broken (yesterday was missed), but they're applying today
    // Start a new streak at 1 (not 0, since they're applying today)
    newStreak = 1
    console.log(`❌ Streak was broken (missed yesterday), starting new streak: ${user.currentStreak} → 1`)
  } else if (lastStreakDate.getTime() === today.getTime()) {
    // They already applied today - don't increment again
    // This shouldn't normally happen, but handle it gracefully
    newStreak = user.currentStreak || 0
  }

  const newLongest = Math.max(newStreak, user.longestStreak || 0)

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastStreakDate: today,
    },
  })

  return {
    success: true,
    message: `🔥 ${newStreak} day streak!`,
    streak: newStreak,
    longestStreak: newLongest,
    isNewRecord: newStreak === newLongest && newStreak > 1,
  } satisfies StreakSuccessResult
}

