"use client"

import { ChevronRight } from "lucide-react"

interface MealSummaryCardProps {
  type: string
  label: string
  emoji: string
  totalCalories: number
  itemCount: number
  onClick?: () => void
}

export function MealSummaryCard({
  type,
  label,
  emoji,
  totalCalories,
  itemCount,
  onClick,
}: MealSummaryCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-card p-4 shadow-sm
        border border-border/50 transition-all duration-200 active:scale-[0.98]
        hover:shadow-md hover:border-primary/20 text-left"
    >
      {/* Emoji */}
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-xl shrink-0">
        {emoji}
      </div>

      {/* Label + item count */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-card-foreground truncate">{label}</p>
        <p className="text-xs text-muted-foreground">
          {itemCount > 0
            ? `${itemCount} ${itemCount === 1 ? "item" : "itens"}`
            : "Nenhum item"}
        </p>
      </div>

      {/* Calories */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-sm font-bold text-card-foreground tabular-nums">
          {totalCalories > 0 ? `${Math.round(totalCalories)} kcal` : "—"}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  )
}
