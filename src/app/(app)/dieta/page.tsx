"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Wand2, RefreshCw, CalendarDays, Check, ChevronRight,
  Flame, Beef, Wheat, Droplets, ArrowLeftRight, X, Search,
  SlidersHorizontal, Pin,
} from "lucide-react"
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

const MACRO_PRESETS = [
  { name: "Equilibrado", protein: 25, carbs: 50, fat: 25 },
  { name: "Low Carb", protein: 35, carbs: 25, fat: 40 },
  { name: "High Protein", protein: 40, carbs: 35, fat: 25 },
  { name: "Cetogenica", protein: 25, carbs: 10, fat: 65 },
  { name: "High Carb", protein: 20, carbs: 60, fat: 20 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Food = any

export default function DietaPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()))
  const [showConfig, setShowConfig] = useState(true)

  // Macro sliders
  const [proteinPct, setProteinPct] = useState(25)
  const [carbsPct, setCarbsPct] = useState(50)
  const [fatPct, setFatPct] = useState(25)

  // Base alimentar count
  const [fixedCount, setFixedCount] = useState(0)

  useEffect(() => {
    fetch("/api/base-alimentar")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setFixedCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [])

  // Substituição
  const [swapTarget, setSwapTarget] = useState<{ mealIdx: number; itemIdx: number } | null>(null)
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)

  const totalPct = proteinPct + carbsPct + fatPct

  const applyPreset = (preset: typeof MACRO_PRESETS[0]) => {
    setProteinPct(preset.protein)
    setCarbsPct(preset.carbs)
    setFatPct(preset.fat)
  }

  const generatePlan = useCallback(async () => {
    setLoading(true)
    setPlan(null)
    setApplied(false)
    setShowConfig(false)
    try {
      const res = await fetch(
        `/api/dieta?proteinPct=${proteinPct}&carbsPct=${carbsPct}&fatPct=${fatPct}`
      )
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
  }, [proteinPct, carbsPct, fatPct])

  const applyPlan = useCallback(async () => {
    if (!plan) return
    setApplying(true)
    try {
      const res = await fetch("/api/dieta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, meals: plan.meals }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Erro ao aplicar dieta")
        return
      }
      const data = await res.json()
      setApplied(true)
      toast.success(`Dieta aplicada para ${formatDateShort(selectedDate)}! (${data.entriesCreated} itens)`)
    } catch {
      toast.error("Erro de conexao")
    } finally {
      setApplying(false)
    }
  }, [plan, selectedDate])

  // Buscar alimentos para substituição
  const searchFoods = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/alimentos?q=${encodeURIComponent(q)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
      }
    } catch { /* ignore */ }
    finally { setSearching(false) }
  }, [])

  // Substituir alimento no plano
  const swapFood = (food: Food) => {
    if (!plan || !swapTarget) return
    const { mealIdx, itemIdx } = swapTarget
    const newPlan = { ...plan, meals: plan.meals.map((m, mi) => {
      if (mi !== mealIdx) return m
      const newItems = m.items.map((item, ii) => {
        if (ii !== itemIdx) return item
        const servings = Math.max(0.5, Math.round((item.calories / food.calories) * 10) / 10)
        const newItem: PlannedItem = {
          foodId: food.id,
          name: food.name,
          servings,
          servingLabel: food.servingLabel,
          calories: Math.round(food.calories * servings),
          protein: Math.round(food.protein * servings * 10) / 10,
          carbs: Math.round(food.carbs * servings * 10) / 10,
          fat: Math.round(food.fat * servings * 10) / 10,
          noomColor: food.noomColor,
        }
        return newItem
      })
      const totalCalories = newItems.reduce((s, i) => s + i.calories, 0)
      const totalProtein = newItems.reduce((s, i) => s + i.protein, 0)
      const totalCarbs = newItems.reduce((s, i) => s + i.carbs, 0)
      const totalFat = newItems.reduce((s, i) => s + i.fat, 0)
      return { ...m, items: newItems, totalCalories, totalProtein, totalCarbs, totalFat }
    })}
    newPlan.totalCalories = newPlan.meals.reduce((s, m) => s + m.totalCalories, 0)
    newPlan.totalProtein = newPlan.meals.reduce((s, m) => s + m.totalProtein, 0)
    newPlan.totalCarbs = newPlan.meals.reduce((s, m) => s + m.totalCarbs, 0)
    newPlan.totalFat = newPlan.meals.reduce((s, m) => s + m.totalFat, 0)
    setPlan(newPlan)
    setSwapTarget(null)
    setSearchQuery("")
    setSearchResults([])
    toast.success(`Substituido por ${food.name}`)
  }

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
            <p className="text-xs text-muted-foreground">Configure suas proporcoes de macros</p>
          </div>
        </div>
        {plan && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"
          >
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Link Base Alimentar */}
      <Link
        href="/dieta/base"
        className="flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-foreground">Base Alimentar</span>
          <span className="text-xs text-muted-foreground">({fixedCount} itens fixos)</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Link>

      {/* Macro Config */}
      {showConfig && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground">Proporcao de Macronutrientes</h3>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {MACRO_PRESETS.map((preset) => {
              const isActive = preset.protein === proteinPct && preset.carbs === carbsPct && preset.fat === fatPct
              return (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {preset.name}
                </button>
              )
            })}
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            <MacroSlider
              label="Proteina"
              value={proteinPct}
              onChange={setProteinPct}
              color="bg-indigo-500"
              icon={Beef}
            />
            <MacroSlider
              label="Carboidratos"
              value={carbsPct}
              onChange={setCarbsPct}
              color="bg-amber-500"
              icon={Wheat}
            />
            <MacroSlider
              label="Gordura"
              value={fatPct}
              onChange={setFatPct}
              color="bg-red-500"
              icon={Droplets}
            />
          </div>

          {/* Total indicator */}
          <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
            totalPct === 100 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
          }`}>
            <span className="text-xs font-medium text-muted-foreground">Total</span>
            <span className={`text-sm font-bold ${
              totalPct === 100 ? "text-green-600" : "text-red-500"
            }`}>
              {totalPct}%
              {totalPct !== 100 && (
                <span className="text-xs font-normal ml-1">
                  (deve ser 100%)
                </span>
              )}
            </span>
          </div>

          {/* Visual bar */}
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="bg-indigo-500 transition-all" style={{ width: `${proteinPct}%` }} />
            <div className="bg-amber-500 transition-all" style={{ width: `${carbsPct}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${fatPct}%` }} />
          </div>

          {/* Generate button */}
          <button
            onClick={generatePlan}
            disabled={loading || totalPct !== 100}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {loading ? "Gerando..." : plan ? "Gerar Nova Sugestao" : "Gerar Sugestao de Dieta"}
          </button>
        </div>
      )}

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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meal plan cards */}
      {plan && !loading && (
        <>
          <div className="space-y-3">
            {plan.meals.map((meal, mealIdx) => (
              <MealCard
                key={meal.mealType}
                meal={meal}
                onSwapItem={(itemIdx) => {
                  setSwapTarget({ mealIdx, itemIdx })
                  setSearchQuery("")
                  setSearchResults([])
                }}
              />
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
            {/* Macro distribution bar */}
            <div className="flex h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500" style={{ width: `${Math.round((plan.totalProtein * 4 / plan.totalCalories) * 100)}%` }} />
              <div className="bg-amber-500" style={{ width: `${Math.round((plan.totalCarbs * 4 / plan.totalCalories) * 100)}%` }} />
              <div className="bg-red-500" style={{ width: `${Math.round((plan.totalFat * 9 / plan.totalCalories) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>P: {Math.round((plan.totalProtein * 4 / plan.totalCalories) * 100)}%</span>
              <span>C: {Math.round((plan.totalCarbs * 4 / plan.totalCalories) * 100)}%</span>
              <span>G: {Math.round((plan.totalFat * 9 / plan.totalCalories) * 100)}%</span>
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted"
                >
                  Ver no Diario
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={applyPlan}
                disabled={applying}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 text-white font-semibold text-sm shadow-md shadow-green-600/20 active:scale-[0.98] disabled:opacity-60"
              >
                {applying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {applying ? "Aplicando..." : "Aplicar ao Diario"}
              </button>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!plan && !loading && !showConfig && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Wand2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Nenhuma sugestao gerada</h2>
          <p className="text-sm text-muted-foreground max-w-xs mb-4">
            Configure as proporcoes de macros e gere uma sugestao.
          </p>
          <button
            onClick={() => setShowConfig(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            Configurar Macros
          </button>
        </div>
      )}

      {/* Swap modal */}
      {swapTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSwapTarget(null)} />
          <div className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-xl animate-slide-up">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <button
              onClick={() => setSwapTarget(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="px-5 pb-8 pt-2 space-y-4" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
              <div>
                <h3 className="text-lg font-bold text-foreground">Substituir Alimento</h3>
                <p className="text-xs text-muted-foreground">
                  Substituindo: {plan?.meals[swapTarget.mealIdx]?.items[swapTarget.itemIdx]?.name}
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchFoods(e.target.value)
                  }}
                  placeholder="Buscar alimento..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>

              {/* Results */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {searching && (
                  <div className="flex justify-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Nenhum resultado</p>
                )}
                {searchResults.map((food: Food) => (
                  <button
                    key={food.id}
                    onClick={() => swapFood(food)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${NOOM_DOT_COLORS[food.noomColor] || "bg-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{food.name}</p>
                      <p className="text-xs text-muted-foreground">{food.servingLabel} · P:{food.protein}g C:{food.carbs}g G:{food.fat}g</p>
                    </div>
                    <span className="text-xs font-semibold text-primary tabular-nums">{food.calories} kcal</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Subcomponentes
// ============================================================

function MacroSlider({
  label, value, onChange, color, icon: Icon,
}: {
  label: string; value: number; onChange: (v: number) => void; color: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm font-bold text-foreground tabular-nums">{value}%</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={5}
          max={70}
          step={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-current"
          style={{ accentColor: color === "bg-indigo-500" ? "#6366f1" : color === "bg-amber-500" ? "#f59e0b" : "#ef4444" }}
        />
      </div>
    </div>
  )
}

function MealCard({ meal, onSwapItem }: { meal: PlannedMeal; onSwapItem: (idx: number) => void }) {
  const emoji = MEAL_EMOJIS[meal.mealType] || ""
  const mealTypeInfo = MEAL_TYPES.find((m) => m.key === meal.mealType)
  const label = mealTypeInfo?.label || meal.label

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        <span className="text-sm font-bold text-primary tabular-nums">{meal.totalCalories} kcal</span>
      </div>
      <div className="divide-y divide-border">
        {meal.items.map((item, idx) => (
          <FoodItemRow key={idx} item={item} onSwap={() => onSwapItem(idx)} />
        ))}
      </div>
      <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/20 border-t border-border">
        <MiniMacro label="P" value={meal.totalProtein} color="text-indigo-500" />
        <MiniMacro label="C" value={meal.totalCarbs} color="text-amber-500" />
        <MiniMacro label="G" value={meal.totalFat} color="text-red-500" />
      </div>
    </div>
  )
}

function FoodItemRow({ item, onSwap }: { item: PlannedItem; onSwap: () => void }) {
  const dotColor = NOOM_DOT_COLORS[item.noomColor] || "bg-gray-400"
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 group">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.servings}x {item.servingLabel}</p>
      </div>
      <span className="text-xs font-semibold text-muted-foreground tabular-nums whitespace-nowrap mr-1">
        {item.calories} kcal
      </span>
      <button
        onClick={onSwap}
        className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        title="Substituir"
      >
        <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}

function MiniMacro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`text-[10px] font-bold ${color}`}>{label}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{Math.round(value * 10) / 10}g</span>
    </div>
  )
}

function MacroBox({
  icon: Icon, label, value, unit, color,
}: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number; unit: string; color: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-base font-bold text-foreground tabular-nums">{Math.round(value)}</span>
      <span className="text-[10px] text-muted-foreground">{unit}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}
