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
    return {
      success: false,
      message: 'Apply to at least one opportunity today to grow your streak.',
      streak: user.currentStreak,
    } satisfies StreakFailureResult
  }

  const lastStreakDate = user.lastStreakDate ? new Date(user.lastStreakDate) : null
  lastStreakDate?.setHours(0, 0, 0, 0)

  let newStreak = user.currentStreak || 0
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (!lastStreakDate || lastStreakDate.getTime() === yesterday.getTime()) {
    // Continue streak
    newStreak += 1
  } else if (lastStreakDate.getTime() < yesterday.getTime()) {
    // Streak broken, start over
    newStreak = 1
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

