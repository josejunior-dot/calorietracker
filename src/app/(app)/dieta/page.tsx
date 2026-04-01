"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Wand2, RefreshCw, CalendarDays, Check, ChevronRight,
  Flame, Beef, Wheat, Droplets, ArrowLeftRight, X, Search, Trash2,
  Pin, AlertTriangle, ChevronDown, Zap, Leaf, Target, Dumbbell, Trophy,
  Info, Layers,
} from "lucide-react"
import { toast } from "sonner"
import { toISODate, formatDateShort } from "@/lib/date"
import { MEAL_TYPES, ACTIVITY_LEVELS, GOALS } from "@/lib/constants"
import type { MealPlan, PlannedMeal, PlannedItem, NutritionStrategy, MacroTargets } from "@/lib/diet-builder"

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

// ============================================================
// Strategy definitions for the UI cards
// ============================================================

type StrategyCardDef = {
  key: NutritionStrategy
  name: string
  description: string
  proteinRange: string
  carbsIndicator: string
  suitableTags: string[]
  hasWarning: boolean
  icon: React.ComponentType<{ className?: string }>
}

const STRATEGIES: StrategyCardDef[] = [
  {
    key: "equilibrado",
    name: "Equilibrado",
    description: "Distribuicao balanceada entre macros. Ideal para saude geral.",
    proteinRange: "1.2-1.8 g/kg",
    carbsIndicator: "Moderado",
    suitableTags: ["Manutencao", "Saude Geral"],
    hasWarning: false,
    icon: Target,
  },
  {
    key: "high_protein",
    name: "High Protein",
    description: "Foco em proteina para massa muscular e saciedade.",
    proteinRange: "1.8-2.2 g/kg",
    carbsIndicator: "Moderado",
    suitableTags: ["Emagrecimento", "Hipertrofia"],
    hasWarning: false,
    icon: Dumbbell,
  },
  {
    key: "low_carb",
    name: "Low Carb",
    description: "Carboidrato reduzido sem ser cetogenico.",
    proteinRange: "1.4-2.0 g/kg",
    carbsIndicator: "100-130g/dia",
    suitableTags: ["Emagrecimento", "Resistencia Insulina"],
    hasWarning: false,
    icon: Leaf,
  },
  {
    key: "cetogenica",
    name: "Cetogenica",
    description: "Restricao forte de carboidrato. Exige acompanhamento.",
    proteinRange: "1.5-2.0 g/kg",
    carbsIndicator: "20-50g/dia",
    suitableTags: ["Emagrecimento", "Avancado"],
    hasWarning: true,
    icon: Zap,
  },
  {
    key: "high_carb",
    name: "High Carb",
    description: "Para treino intenso e endurance. Carbs elevado.",
    proteinRange: "1.0-1.4 g/kg",
    carbsIndicator: "Elevado (55-65%)",
    suitableTags: ["Endurance", "Treino Intenso"],
    hasWarning: false,
    icon: Trophy,
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Food = any

type UserProfile = {
  name: string
  weight: number
  height: number
  age: number
  activityLevel: string
  goal: string
  dailyCalTarget: number
  tdee: number
}

export default function DietaPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [macros, setMacros] = useState<MacroTargets | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()))

  // Strategy
  const [strategy, setStrategy] = useState<NutritionStrategy>("equilibrado")

  // Overrides (ajuste fino)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [proteinPerKg, setProteinPerKg] = useState<number | null>(null)
  const [carbsGrams, setCarbsGrams] = useState<number | null>(null)

  // Base alimentar count
  const [fixedCount, setFixedCount] = useState(0)

  // Preview macros (calculated on strategy change)
  const [previewMacros, setPreviewMacros] = useState<MacroTargets | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Swap modal
  const [swapTarget, setSwapTarget] = useState<{ mealIdx: number; itemIdx: number } | null>(null)
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<Food[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Fetch user profile on mount
  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setUserProfile({
            name: data.name,
            weight: data.weight,
            height: data.height,
            age: data.age,
            activityLevel: data.activityLevel,
            goal: data.goal,
            dailyCalTarget: data.dailyCalTarget ?? data.dailyTarget,
            tdee: data.tdee,
          })
        }
      })
      .catch(() => {})
  }, [])

  // Fetch base alimentar count
  useEffect(() => {
    fetch("/api/base-alimentar")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setFixedCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [])

  // Fetch macro preview when strategy or overrides change
  const fetchPreview = useCallback(async (s: NutritionStrategy, pPerKg: number | null, cGrams: number | null) => {
    setPreviewLoading(true)
    try {
      const params = new URLSearchParams({ strategy: s })
      if (pPerKg !== null) params.set("proteinPerKg", pPerKg.toString())
      if (cGrams !== null) params.set("carbsGrams", cGrams.toString())
      // We use the diet API to get the macros preview (it returns macros even without generating plan)
      const res = await fetch(`/api/dieta?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPreviewMacros(data.macros)
        // Also update user profile from the response if available
        if (data.user && !userProfile) {
          setUserProfile(data.user)
        }
      }
    } catch {
      // ignore
    } finally {
      setPreviewLoading(false)
    }
  }, [userProfile])

  // Load preview on mount and on strategy change
  useEffect(() => {
    fetchPreview(strategy, proteinPerKg, carbsGrams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy])

  const handleStrategyChange = (s: NutritionStrategy) => {
    setStrategy(s)
    // Reset overrides when changing strategy
    setProteinPerKg(null)
    setCarbsGrams(null)
  }

  const handleRecalculate = () => {
    fetchPreview(strategy, proteinPerKg, carbsGrams)
  }

  const generatePlan = useCallback(async () => {
    setLoading(true)
    setPlan(null)
    setMacros(null)
    setApplied(false)
    try {
      const params = new URLSearchParams({ strategy })
      if (proteinPerKg !== null) params.set("proteinPerKg", proteinPerKg.toString())
      if (carbsGrams !== null) params.set("carbsGrams", carbsGrams.toString())

      const res = await fetch(`/api/dieta?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Erro ao gerar dieta")
        return
      }
      const data = await res.json()
      setPlan(data.plan)
      setMacros(data.macros)
      if (data.user) setUserProfile(data.user)
    } catch {
      toast.error("Erro de conexao ao gerar dieta")
    } finally {
      setLoading(false)
    }
  }, [strategy, proteinPerKg, carbsGrams])

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

  // Load suggestions when swap modal opens
  useEffect(() => {
    if (!swapTarget || !plan) { setSuggestions([]); return }
    const item = plan.meals[swapTarget.mealIdx]?.items[swapTarget.itemIdx]
    if (!item) return
    setLoadingSuggestions(true)
    setSuggestions([])
    fetch(`/api/alimentos/sugestoes?foodId=${item.foodId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.suggestions) setSuggestions(data.suggestions) })
      .catch(() => {})
      .finally(() => setLoadingSuggestions(false))
  }, [swapTarget, plan])

  // Food search for swap
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

  // Swap food in plan
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

  // Remove item from plan
  const removeItem = (mealIdx: number, itemIdx: number) => {
    if (!plan) return
    const item = plan.meals[mealIdx]?.items[itemIdx]
    if (!item) return
    const newPlan = { ...plan, meals: plan.meals.map((m, mi) => {
      if (mi !== mealIdx) return m
      const newItems = m.items.filter((_, ii) => ii !== itemIdx)
      return {
        ...m,
        items: newItems,
        totalCalories: newItems.reduce((s, i) => s + i.calories, 0),
        totalProtein: newItems.reduce((s, i) => s + i.protein, 0),
        totalCarbs: newItems.reduce((s, i) => s + i.carbs, 0),
        totalFat: newItems.reduce((s, i) => s + i.fat, 0),
      }
    })}
    newPlan.totalCalories = newPlan.meals.reduce((s, m) => s + m.totalCalories, 0)
    newPlan.totalProtein = newPlan.meals.reduce((s, m) => s + m.totalProtein, 0)
    newPlan.totalCarbs = newPlan.meals.reduce((s, m) => s + m.totalCarbs, 0)
    newPlan.totalFat = newPlan.meals.reduce((s, m) => s + m.totalFat, 0)
    setPlan(newPlan)
    toast.success(`${item.name} removido`)
  }

  const goalLabel = GOALS.find((g) => g.key === userProfile?.goal)?.label || userProfile?.goal || ""
  const activityLabel = ACTIVITY_LEVELS.find((a) => a.key === userProfile?.activityLevel)?.label || userProfile?.activityLevel || ""
  const activeStrategy = STRATEGIES.find((s) => s.key === strategy)

  const displayMacros = macros || previewMacros

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Montador de Dieta</h1>
          <p className="text-xs text-muted-foreground">Inteligencia nutricional baseada no seu perfil</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Section 1: User Context Card */}
      {/* ============================================================ */}
      {userProfile && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Objetivo:</span>
              <span className="text-xs font-semibold text-foreground">{goalLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Peso:</span>
              <span className="text-xs font-semibold text-foreground">{userProfile.weight} kg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Atividade:</span>
              <span className="text-xs font-semibold text-foreground">{activityLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Altura:</span>
              <span className="text-xs font-semibold text-foreground">{userProfile.height} cm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Meta calorica:</span>
              <span className="text-xs font-semibold text-foreground">{userProfile.dailyCalTarget?.toLocaleString("pt-BR")} kcal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Idade:</span>
              <span className="text-xs font-semibold text-foreground">{userProfile.age} anos</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Section 2: Strategy Selector */}
      {/* ============================================================ */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Estrategia Nutricional</h3>
        <div className="space-y-2">
          {STRATEGIES.map((s) => {
            const isSelected = strategy === s.key
            const Icon = s.icon
            return (
              <button
                key={s.key}
                onClick={() => handleStrategyChange(s.key)}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                  isSelected
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-green-100 dark:bg-green-900/40" : "bg-muted"
                  }`}>
                    <Icon className={`w-4 h-4 ${isSelected ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{s.name}</span>
                      {s.hasWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      {isSelected && <Check className="w-4 h-4 text-green-600 ml-auto shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                        P: {s.proteinRange}
                      </span>
                      <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                        C: {s.carbsIndicator}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {s.suitableTags.map((tag) => (
                        <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Section 3: Calculated Macros Preview */}
      {/* ============================================================ */}
      {(previewLoading || displayMacros) && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Macros Calculados</h3>
          </div>

          {previewLoading && !displayMacros ? (
            <div className="p-4 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Calculando...</span>
            </div>
          ) : displayMacros ? (
            <div className="p-4 space-y-3">
              {/* Macro values */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Beef className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm text-foreground">Proteina</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground tabular-nums">{displayMacros.protein} g/dia</span>
                    <span className="text-xs text-muted-foreground ml-1.5">({displayMacros.proteinPerKg} g/kg)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-foreground">Carboidratos</span>
                  </div>
                  <span className="text-sm font-bold text-foreground tabular-nums">{displayMacros.carbs} g/dia</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-foreground">Gordura</span>
                  </div>
                  <span className="text-sm font-bold text-foreground tabular-nums">{displayMacros.fat} g/dia</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Calorias</span>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums">{displayMacros.calories.toLocaleString("pt-BR")} kcal</span>
                </div>
              </div>

              {/* Colored bar */}
              {displayMacros.calories > 0 && (
                <>
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 transition-all" style={{ width: `${Math.round((displayMacros.protein * 4 / displayMacros.calories) * 100)}%` }} />
                    <div className="bg-amber-500 transition-all" style={{ width: `${Math.round((displayMacros.carbs * 4 / displayMacros.calories) * 100)}%` }} />
                    <div className="bg-red-500 transition-all" style={{ width: `${Math.round((displayMacros.fat * 9 / displayMacros.calories) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="text-indigo-500 font-medium">P: {Math.round((displayMacros.protein * 4 / displayMacros.calories) * 100)}%</span>
                    <span className="text-amber-500 font-medium">C: {Math.round((displayMacros.carbs * 4 / displayMacros.calories) * 100)}%</span>
                    <span className="text-red-500 font-medium">G: {Math.round((displayMacros.fat * 9 / displayMacros.calories) * 100)}%</span>
                  </div>
                </>
              )}

              {/* Explanation */}
              {displayMacros.explanation && (
                <div className="flex gap-2 p-3 rounded-lg bg-muted/50">
                  <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{displayMacros.explanation}</p>
                </div>
              )}

              {/* Warnings */}
              {displayMacros.warnings && displayMacros.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {displayMacros.warnings.map((w, i) => (
                    <div key={i} className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">{w}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================ */}
      {/* Section 4: Advanced Override (collapsible) */}
      {/* ============================================================ */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
        >
          <span className="text-sm font-medium text-foreground">Ajuste Fino</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        </button>

        {showAdvanced && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
            {/* Protein per kg slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Proteina (g/kg)</label>
                <span className="text-sm font-bold text-indigo-500 tabular-nums">
                  {proteinPerKg !== null ? proteinPerKg.toFixed(1) : displayMacros?.proteinPerKg?.toFixed(1) || "—"}
                </span>
              </div>
              <input
                type="range"
                min={0.8}
                max={2.5}
                step={0.1}
                value={proteinPerKg ?? displayMacros?.proteinPerKg ?? 1.6}
                onChange={(e) => setProteinPerKg(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#6366f1" }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0.8</span>
                <span>1.5</span>
                <span>2.0</span>
                <span>2.5</span>
              </div>
            </div>

            {/* Carbs grams slider */}
            {strategy === "cetogenica" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Carboidratos (g/dia)</label>
                  <span className="text-sm font-bold text-amber-500 tabular-nums">
                    {carbsGrams !== null ? carbsGrams : displayMacros?.carbs || "—"}g
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={50}
                  step={5}
                  value={carbsGrams ?? displayMacros?.carbs ?? 30}
                  onChange={(e) => setCarbsGrams(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#f59e0b" }}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>20g</span>
                  <span>35g</span>
                  <span>50g</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Carboidratos (g/dia)</label>
                  <span className="text-sm font-bold text-amber-500 tabular-nums">
                    {carbsGrams !== null ? carbsGrams : displayMacros?.carbs || "—"}g
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={400}
                  step={10}
                  value={carbsGrams ?? displayMacros?.carbs ?? 150}
                  onChange={(e) => setCarbsGrams(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#f59e0b" }}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>50g</span>
                  <span>200g</span>
                  <span>400g</span>
                </div>
              </div>
            )}

            <button
              onClick={handleRecalculate}
              disabled={previewLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-muted text-foreground font-medium text-sm hover:bg-muted/80 transition-colors"
            >
              {previewLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Recalcular
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Section 5: Link to Base Alimentar */}
      {/* ============================================================ */}
      <Link
        href="/dieta/base"
        className="flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-foreground">Alimentos Obrigatorios do Plano</span>
          <span className="text-xs text-muted-foreground">({fixedCount} itens)</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Link>

      {/* Link to Combos */}
      <Link
        href="/combos"
        className="flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-medium text-foreground">Meus Combos</span>
          <span className="text-xs text-muted-foreground">Monte receitas personalizadas</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Link>

      {/* ============================================================ */}
      {/* Section 6: Generate Button */}
      {/* ============================================================ */}
      <button
        onClick={generatePlan}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {loading ? "Gerando..." : plan ? "Gerar Nova Sugestao" : "Gerar Sugestao de Dieta"}
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* Section 7: Generated Plan */}
      {/* ============================================================ */}
      {plan && !loading && (
        <>
          {/* Strategy context banner */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
            <Wand2 className="w-3.5 h-3.5 text-violet-500" />
            <p className="text-xs text-violet-700 dark:text-violet-300">
              Sugestao baseada em: <strong>{activeStrategy?.name}</strong> · {userProfile?.weight}kg · {goalLabel}
            </p>
          </div>

          {/* Macros explanation from the generated plan */}
          {macros?.explanation && (
            <div className="flex gap-2 p-3 rounded-lg bg-muted/50">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{macros.explanation}</p>
            </div>
          )}

          {/* Warnings from generated plan */}
          {macros?.warnings && macros.warnings.length > 0 && (
            <div className="space-y-1.5">
              {macros.warnings.map((w, i) => (
                <div key={i} className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Meal cards */}
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
                onRemoveItem={(itemIdx) => removeItem(mealIdx, itemIdx)}
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

          {/* ============================================================ */}
          {/* Section 8: Apply to Diary */}
          {/* ============================================================ */}
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

      {/* Empty state (only shown if no plan, not loading, and we have a profile) */}
      {!plan && !loading && userProfile && !previewLoading && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Wand2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Selecione uma estrategia acima e clique em &quot;Gerar Sugestao&quot; para criar seu plano alimentar.
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* Swap Modal */}
      {/* ============================================================ */}
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

            <div className="px-5 pt-2 space-y-4" style={{ paddingBottom: 'max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom)))' }}>
              <div>
                <h3 className="text-lg font-bold text-foreground">Substituir Alimento</h3>
                <p className="text-xs text-muted-foreground">
                  Substituindo: {plan?.meals[swapTarget.mealIdx]?.items[swapTarget.itemIdx]?.name}
                </p>
              </div>

              {/* Sugestões automáticas */}
              {(loadingSuggestions || (suggestions.length > 0 && searchQuery.length < 2)) && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Sugestoes similares
                  </p>
                  {loadingSuggestions ? (
                    <div className="flex justify-center py-4">
                      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-1">
                      {suggestions.map((food: Food) => (
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
                  )}
                </div>
              )}

              {/* Divider */}
              {suggestions.length > 0 && searchQuery.length < 2 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground uppercase">ou buscar</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchFoods(e.target.value)
                  }}
                  placeholder="Buscar outro alimento..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Resultados da busca manual */}
              {searchQuery.length >= 2 && (
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {searching && (
                    <div className="flex justify-center py-4">
                      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!searching && searchResults.length === 0 && (
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
              )}
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

function MealCard({ meal, onSwapItem, onRemoveItem }: { meal: PlannedMeal; onSwapItem: (idx: number) => void; onRemoveItem: (idx: number) => void }) {
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
          <FoodItemRow key={idx} item={item} onSwap={() => onSwapItem(idx)} onRemove={() => onRemoveItem(idx)} />
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

function FoodItemRow({ item, onSwap, onRemove }: { item: PlannedItem; onSwap: () => void; onRemove: () => void }) {
  const dotColor = NOOM_DOT_COLORS[item.noomColor] || "bg-gray-400"
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 group">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.servings}x {item.servingLabel}</p>
      </div>
      <span className="text-xs font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
        {item.calories} kcal
      </span>
      <button
        onClick={onSwap}
        className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        title="Substituir"
      >
        <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <button
        onClick={onRemove}
        className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors shrink-0"
        title="Remover"
      >
        <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-red-500" />
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
