"use client"

import { Flame } from "lucide-react"

interface StreakBadgeProps {
  current: number
  longest: number
}

export function StreakBadge({ current, longest }: StreakBadgeProps) {
  const isHotStreak = current >= 7

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold
          ${isHotStreak
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            : "bg-muted text-muted-foreground"
          }`}
      >
        {isHotStreak ? (
          <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
        ) : (
          <span className="text-base">🔥</span>
        )}
        <span>{current} {current === 1 ? "dia" : "dias"}</span>
        {isHotStreak && (
          <span className="ml-0.5 text-xs font-bold tracking-wide uppercase">
            Sequencia!
          </span>
        )}
      </div>
      {longest > 0 && (
        <span className="text-xs text-muted-foreground">
          Recorde: {longest} {longest === 1 ? "dia" : "dias"}
        </span>
      )}
    </div>
  )
}
