"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Wand2, RefreshCw, CalendarDays, Check, ChevronRight, Flame, Beef, Wheat, Droplets } from "lucide-react"
import { toast } from "sonner"
import { toISODate, formatDateShort } from "@/lib/date"
import { MEAL_TYPES } from "@/lib/constants"
import type { MealPlan, PlannedMeal, PlannedItem } from "@/lib/diet-builder"

const NOOM_DOT_COLORS: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  orange: "bg-orange-500",
}

const MEAL_EMOJIS: Record<string, string> = {
  cafe_da_manha: "\u2615",
  almoco: "\uD83C\uDF7D\uFE0F",
  jantar: "\uD83C\uDF19",
  lanche: "\uD83C\uDF6A",
}

export default function DietaPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()))

  const generatePlan = useCallback(async () => {
    setLoading(true)
    setPlan(null)
    setApplied(false)
    try {
      const res = await fetch("/api/dieta")
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Erro ao gerar dieta")
        return
      }
      const data = await res.json()
      setPlan(data.plan)
    } catch {
      toast.error("Erro de conexao ao gerar dieta")
    } finally {
      setLoading(false)
    }
  }, [])

  const applyPlan = useCallback(async () => {
    if (!plan) return
    setApplying(true)
    try {
      const res = await fetch("/api/dieta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          meals: plan.meals,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Erro ao aplicar dieta")
        return
      }
      const data = await res.json()
      setApplied(true)
      toast.success(`Dieta adicionada ao diario de ${formatDateShort(selectedDate)}! (${data.entriesCreated} itens)`)
    } catch {
      toast.error("Erro de conexao ao aplicar dieta")
    } finally {
      setApplying(false)
    }
  }, [plan, selectedDate])

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Montador de Dieta</h1>
            <p className="text-xs text-muted-foreground">Sugestao automatica de refeicoes</p>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generatePlan}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {loading ? "Gerando sugestao..." : plan ? "Gerar Outra Sugestao" : "Gerar Nova Sugestao"}
      </button>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="w-28 h-4 bg-muted rounded" />
                <div className="ml-auto w-16 h-4 bg-muted rounded" />
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-muted rounded" />
                <div className="w-3/4 h-3 bg-muted rounded" />
                <div className="w-5/6 h-3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meal plan cards */}
      {plan && !loading && (
        <>
          <div className="space-y-3">
            {plan.meals.map((meal) => (
              <MealCard key={meal.mealType} meal={meal} />
            ))}
          </div>

          {/* Daily totals */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Total do Dia</h3>
            <div className="grid grid-cols-4 gap-2">
              <MacroBox icon={Flame} label="Calorias" value={plan.totalCalories} unit="kcal" color="text-primary" />
              <MacroBox icon={Beef} label="Proteina" value={plan.totalProtein} unit="g" color="text-indigo-500" />
              <MacroBox icon={Wheat} label="Carbs" value={plan.totalCarbs} unit="g" color="text-amber-500" />
              <MacroBox icon={Droplets} label="Gordura" value={plan.totalFat} unit="g" color="text-red-500" />
            </div>
          </div>

          {/* Date picker + Apply */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              Aplicar para o dia:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            {applied ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center py-3 px-4 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold text-sm">
                  <Check className="w-4 h-4" />
                  Dieta aplicada com sucesso!
                </div>
                <button
                  onClick={() => router.push(`/diario?date=${selectedDate}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border text-foreground font-medium text-sm transition-colors hover:bg-muted"
                >
                  Ver no Diario
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={applyPlan}
                disabled={applying}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 text-white font-semibold text-sm shadow-md shadow-green-600/20 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {applying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {applying ? "Aplicando..." : "Aplicar ao Diario"}
              </button>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!plan && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Wand2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Nenhuma sugestao gerada</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Toque no botao acima para gerar um plano alimentar automatico baseado nas suas metas.
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Subcomponentes
// ============================================================

function MealCard({ meal }: { meal: PlannedMeal }) {
  const emoji = MEAL_EMOJIS[meal.mealType] || ""
  const mealTypeInfo = MEAL_TYPES.find((m) => m.key === meal.mealType)
  const label = mealTypeInfo?.label || meal.label

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        <span className="text-sm font-bold text-primary tabular-nums">
          {meal.totalCalories} kcal
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-border">
        {meal.items.map((item, idx) => (
          <FoodItemRow key={idx} item={item} />
        ))}
      </div>

      {/* Macros footer */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/20 border-t border-border">
        <MiniMacro label="P" value={meal.totalProtein} color="text-indigo-500" />
        <MiniMacro label="C" value={meal.totalCarbs} color="text-amber-500" />
        <MiniMacro label="G" value={meal.totalFat} color="text-red-500" />
      </div>
    </div>
  )
}

function FoodItemRow({ item }: { item: PlannedItem }) {
  const dotColor = NOOM_DOT_COLORS[item.noomColor] || "bg-gray-400"

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.servings}x {item.servingLabel}
        </p>
      </div>
      <span className="text-xs font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
        {item.calories} kcal
      </span>
    </div>
  )
}

function MiniMacro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`text-[10px] font-bold ${color}`}>{label}</span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {Math.round(value * 10) / 10}g
      </span>
    </div>
  )
}

function MacroBox({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  unit: string
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-base font-bold text-foreground tabular-nums">
        {Math.round(value)}
      </span>
      <span className="text-[10px] text-muted-foreground">{unit}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}
