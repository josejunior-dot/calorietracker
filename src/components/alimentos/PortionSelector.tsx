"use client"

import { useState } from "react"
import { X, Minus, Plus } from "lucide-react"
import { getNoomColorHex, getNoomColorBg, getNoomColorText } from "@/lib/noom-color"
import type { NoomColor } from "@/lib/noom-color"
import { MEAL_TYPES } from "@/lib/constants"
import { toast } from "sonner"

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
  saturatedFat?: number
  transFat?: number
  fiber?: number
  sodium?: number
  noomColor: string
}

type PortionSelectorProps = {
  food: Food
  mealType: string
  date: string
  onConfirm: () => void
  onCancel: () => void
}

const QUICK_PORTIONS = [0.5, 1, 1.5, 2]

export function PortionSelector({
  food,
  mealType,
  date,
  onConfirm,
  onCancel,
}: PortionSelectorProps) {
  const [servings, setServings] = useState(1)
  const [saving, setSaving] = useState(false)

  const noomColor = food.noomColor as NoomColor
  const colorHex = getNoomColorHex(noomColor)
  const colorBg = getNoomColorBg(noomColor)
  const colorText = getNoomColorText(noomColor)

  const mealLabel = MEAL_TYPES.find((m) => m.key === mealType)?.label || mealType

  // Calculated nutritional values
  const calc = {
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings * 10) / 10,
    carbs: Math.round(food.carbs * servings * 10) / 10,
    fat: Math.round(food.fat * servings * 10) / 10,
    saturatedFat: Math.round((food.saturatedFat || 0) * servings * 10) / 10,
    transFat: Math.round((food.transFat || 0) * servings * 10) / 10,
    fiber: Math.round((food.fiber || 0) * servings * 10) / 10,
    sodium: Math.round((food.sodium || 0) * servings),
    grams: Math.round(food.servingSize * servings),
  }

  const adjustServings = (delta: number) => {
    setServings((prev) => {
      const next = Math.round((prev + delta) * 10) / 10
      return Math.max(0.1, Math.min(20, next))
    })
  }

  const saveMealEntry = async (skipDuplicateCheck = false) => {
    setSaving(true)
    try {
      const res = await fetch("/api/refeicoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId: food.id,
          date,
          mealType,
          servings,
          skipDuplicateCheck,
        }),
      })

      if (res.status === 409) {
        const data = await res.json()
        if (data.error === "similar_food") {
          setSaving(false)
          const confirmed = confirm(
            `Ja existe "${data.existingFood}" nessa refeicao.\n\nDeseja adicionar "${data.newFood}" mesmo assim?`
          )
          if (confirmed) {
            await saveMealEntry(true)
          }
          return
        }
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }

      toast.success(`${food.name} adicionado!`, {
        description: `${calc.calories} kcal no ${mealLabel}`,
      })

      onConfirm()
    } catch (error) {
      toast.error("Erro ao adicionar alimento", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = () => saveMealEntry(false)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="px-5 pb-8 pt-2 space-y-5" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          {/* Food header */}
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 mt-0.5 px-2.5 py-1 rounded-full ${colorBg} flex items-center gap-1.5`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: colorHex }}
              />
              <span className={`text-[10px] font-semibold ${colorText}`}>
                {noomColor === "green" ? "Baixa" : noomColor === "yellow" ? "Média" : "Alta"}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-foreground">{food.name}</h3>
              <p className="text-xs text-muted-foreground">
                {food.brand ? `${food.brand} · ` : ""}
                {food.servingLabel} por porção
              </p>
            </div>
          </div>

          {/* Portion selector */}
          <div className="bg-muted/50 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground text-center mb-3 font-medium">
              Quantidade de porções
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => adjustServings(-0.5)}
                disabled={servings <= 0.1}
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted active:scale-90 transition-all disabled:opacity-30"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="text-center min-w-[80px]">
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    if (!isNaN(v) && v >= 0.1 && v <= 20) setServings(v)
                  }}
                  className="w-20 text-center text-3xl font-bold bg-transparent text-foreground focus:outline-none"
                  step="0.1"
                  min="0.1"
                  max="20"
                />
                <p className="text-xs text-muted-foreground mt-0.5">
                  {calc.grams}g
                </p>
              </div>

              <button
                onClick={() => adjustServings(0.5)}
                disabled={servings >= 20}
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted active:scale-90 transition-all disabled:opacity-30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex justify-center gap-2 mt-3">
              {QUICK_PORTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setServings(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    servings === p
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {p}x
                </button>
              ))}
            </div>
          </div>

          {/* Nutritional preview */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Valores nutricionais
            </p>

            {/* Calories highlight */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 rounded-xl border border-primary/10">
              <span className="text-sm font-medium text-foreground">Calorias</span>
              <span className="text-xl font-bold text-primary tabular-nums">
                {calc.calories} kcal
              </span>
            </div>

            {/* Macros grid */}
            <div className="grid grid-cols-3 gap-2">
              <NutrientPill label="Proteína" value={`${calc.protein}g`} color="bg-indigo-500" />
              <NutrientPill label="Carboidratos" value={`${calc.carbs}g`} color="bg-amber-500" />
              <NutrientPill label="Gordura" value={`${calc.fat}g`} color="bg-red-500" />
            </div>

            {/* Secondary nutrients */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">G. Saturada</span>
                <span className="text-xs font-semibold text-foreground tabular-nums">{calc.saturatedFat}g</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">G. Trans</span>
                <span className="text-xs font-semibold text-foreground tabular-nums">{calc.transFat}g</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Fibra</span>
                <span className="text-xs font-semibold text-foreground tabular-nums">{calc.fiber}g</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Sódio</span>
                <span className="text-xs font-semibold text-foreground tabular-nums">{calc.sodium}mg</span>
              </div>
            </div>
          </div>

          {/* Meal type badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl">
            <span className="text-xs text-muted-foreground">Refeição:</span>
            <span className="text-xs font-semibold text-foreground">{mealLabel}</span>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? "Adicionando..." : `Adicionar ${calc.calories} kcal`}
          </button>
        </div>
      </div>
    </div>
  )
}

function NutrientPill({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-muted/50 rounded-xl">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
    </div>
  )
}
