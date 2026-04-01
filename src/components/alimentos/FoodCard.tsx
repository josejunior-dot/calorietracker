"use client"

import { Clock } from "lucide-react"
import { getNoomColorHex, getNoomColorText, getNoomColorBg } from "@/lib/noom-color"
import type { NoomColor } from "@/lib/noom-color"
import { FOOD_CATEGORIES } from "@/lib/constants"

type Food = {
  id: string
  name: string
  brand: string | null
  category: string
  servingSize: number
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  noomColor: string
}

type FoodCardProps = {
  food: Food
  isRecent?: boolean
  onClick: () => void
}

const NOOM_SHORT_LABEL: Record<string, string> = {
  green: "Baixa",
  yellow: "Média",
  orange: "Alta",
}

export function FoodCard({ food, isRecent, onClick }: FoodCardProps) {
  const noomColor = food.noomColor as NoomColor
  const colorHex = getNoomColorHex(noomColor)
  const colorBg = getNoomColorBg(noomColor)
  const colorText = getNoomColorText(noomColor)
  const categoryEmoji = FOOD_CATEGORIES.find((c) => c.key === food.category)?.emoji || ""

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/60 active:scale-[0.98] transition-all text-left"
    >
      {/* Noom color badge */}
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${colorBg} shrink-0`}>
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: colorHex }}
        />
        <span className={`text-[10px] font-semibold ${colorText}`}>
          {NOOM_SHORT_LABEL[food.noomColor] || ""}
        </span>
      </div>

      {/* Food info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground truncate">
            {food.name}
          </p>
          {isRecent && (
            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {food.brand ? `${food.brand} · ` : ""}
          {food.servingLabel}
        </p>
      </div>

      {/* Calories + category */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="text-sm font-bold text-foreground tabular-nums">
            {Math.round(food.calories)}
          </p>
          <p className="text-[10px] text-muted-foreground">kcal</p>
        </div>
        {categoryEmoji && (
          <span className="text-base">{categoryEmoji}</span>
        )}
      </div>
    </button>
  )
}
