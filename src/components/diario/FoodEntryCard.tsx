"use client"

import { Trash2 } from "lucide-react"
import { getNoomColorHex } from "@/lib/noom-color"
import type { NoomColor } from "@/lib/noom-color"

type Food = {
  id: string
  name: string
  brand: string | null
  servingSize: number
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  noomColor: string
}

type MealEntryWithFood = {
  id: string
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
  food: Food
}

type FoodEntryCardProps = {
  entry: MealEntryWithFood
  onDelete: (id: string) => void
}

export function FoodEntryCard({ entry, onDelete }: FoodEntryCardProps) {
  const { food, servings } = entry
  const gramsTotal = Math.round(food.servingSize * servings)
  const colorHex = getNoomColorHex(food.noomColor as NoomColor)

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors">
      {/* Noom color dot */}
      <div
        className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card"
        style={{ backgroundColor: colorHex, boxShadow: `0 0 6px ${colorHex}40` }}
      />

      {/* Food info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {food.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {servings !== 1 ? `${servings} porções` : "1 porção"} · {gramsTotal}g
        </p>
      </div>

      {/* Calories */}
      <div className="text-right shrink-0">
        <span className="text-sm font-semibold text-foreground">
          {Math.round(entry.calories)}
        </span>
        <span className="text-xs text-muted-foreground ml-0.5">kcal</span>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(entry.id)
        }}
        className="w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-90 transition-all shrink-0"
        aria-label={`Remover ${food.name}`}
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>
    </div>
  )
}
