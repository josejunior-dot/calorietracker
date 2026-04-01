"use client"

import { useState } from "react"
import { PlusCircle, ChevronDown } from "lucide-react"
import { FoodEntryCard } from "./FoodEntryCard"

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

type MealSectionProps = {
  mealType: string
  label: string
  emoji: string
  entries: MealEntryWithFood[]
  onDelete: (id: string) => void
  onAddClick: () => void
}

export function MealSection({
  mealType,
  label,
  emoji,
  entries,
  onDelete,
  onAddClick,
}: MealSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0)
  const hasEntries = entries.length > 0

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden transition-all">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
      >
        <span className="text-xl">{emoji}</span>
        <span className="text-sm font-semibold text-foreground flex-1 text-left">
          {label}
        </span>
        {hasEntries && (
          <span className="text-sm font-bold text-foreground tabular-nums">
            {Math.round(totalCalories)} kcal
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            expanded ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {/* Content */}
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-2 pb-2">
          {hasEntries ? (
            <div className="space-y-0.5">
              {entries.map((entry) => (
                <FoodEntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : null}

          {/* Add button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddClick()
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 mt-1 rounded-xl text-primary hover:bg-primary/5 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {hasEntries ? "Adicionar mais" : "Adicionar alimento"}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
