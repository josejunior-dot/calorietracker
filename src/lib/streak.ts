import { prisma } from '@/lib/prisma'

/**
 * Update the streak for a user based on a logged date.
 * - If lastLogDate is yesterday: increment currentStreak
 * - If lastLogDate is today: no change
 * - If lastLogDate is older or null: reset currentStreak to 1
 * - Update longestStreak if current > longest
 */
export async function updateStreak(userId: string, date: string) {
  const streak = await prisma.streak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastLogDate: date,
    },
    update: {},
  })

  const today = new Date(date)
  const lastLog = streak.lastLogDate ? new Date(streak.lastLogDate) : null

  let newCurrent = streak.currentStreak

  if (lastLog) {
    const diffMs = today.getTime() - lastLog.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Same day, no change
      return streak
    } else if (diffDays === 1) {
      // Consecutive day
      newCurrent = streak.currentStreak + 1
    } else {
      // Gap — reset
      newCurrent = 1
    }
  } else {
    newCurrent = 1
  }

  const newLongest = Math.max(newCurrent, streak.longestStreak)

  const updated = await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastLogDate: date,
    },
  })

  return updated
}
