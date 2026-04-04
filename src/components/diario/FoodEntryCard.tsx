"use client"

import { useState, useRef, useEffect } from "react"
import { Trash2, Minus, Plus, Check, X } from "lucide-react"
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
  onEdit: (id: string, servings: number) => void
}

export function FoodEntryCard({ entry, onDelete, onEdit }: FoodEntryCardProps) {
  const { food, servings } = entry
  const [editing, setEditing] = useState(false)
  const [editServings, setEditServings] = useState(servings)
  const inputRef = useRef<HTMLInputElement>(null)

  const gramsTotal = Math.round(food.servingSize * (editing ? editServings : servings))
  const displayCalories = Math.round(food.calories * (editing ? editServings : servings))
  const colorHex = getNoomColorHex(food.noomColor as NoomColor)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.select()
    }
  }, [editing])

  const handleStartEdit = () => {
    setEditServings(servings)
    setEditing(true)
  }

  const handleConfirm = () => {
    if (editServings !== servings && editServings >= 0.1 && editServings <= 20) {
      onEdit(entry.id, editServings)
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setEditServings(servings)
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm()
    if (e.key === "Escape") handleCancel()
  }

  const adjustServings = (delta: number) => {
    setEditServings((prev) => {
      const next = Math.round((prev + delta) * 10) / 10
      return Math.max(0.1, Math.min(20, next))
    })
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 px-3 py-3 rounded-xl bg-primary/5 border border-primary/20 transition-all">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card"
            style={{ backgroundColor: colorHex, boxShadow: `0 0 6px ${colorHex}40` }}
          />
          <p className="text-sm font-medium text-foreground truncate flex-1">{food.name}</p>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {displayCalories}
            <span className="text-xs text-muted-foreground ml-0.5">kcal</span>
          </span>
        </div>

        <div className="flex items-center gap-2 pl-6">
          <button
            onClick={() => adjustServings(-0.5)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 active:scale-90 transition-all"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            ref={inputRef}
            type="number"
            step="0.1"
            min="0.1"
            max="20"
            value={editServings}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) setEditServings(v)
            }}
            onKeyDown={handleKeyDown}
            className="w-16 h-8 text-center text-sm font-semibold rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />

          <button
            onClick={() => adjustServings(0.5)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 active:scale-90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs text-muted-foreground">
            porções · {gramsTotal}g
          </span>

          <div className="flex-1" />

          <button
            onClick={handleCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted active:scale-90 transition-all"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={handleConfirm}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 active:scale-90 transition-all"
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleStartEdit}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
    >
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
