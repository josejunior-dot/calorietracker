"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Layers, Plus, Trash2, ArrowLeft, Search, X, Check,
  ChevronDown, Flame, Beef, Wheat, Droplets,
} from "lucide-react"
import { toast } from "sonner"
import { FoodCard } from "@/components/alimentos/FoodCard"
import { FOOD_CATEGORIES } from "@/lib/constants"

// ============================================================
// Types
// ============================================================

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
  fiber?: number
  sodium?: number
  noomColor: string
  isRecent?: boolean
}

type ComboIngredient = {
  foodId: string
  foodName: string
  quantity: number
  unit: string
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

type Combo = {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  noomColor: string
  items: Array<{
    id: string
    foodId: string
    foodName: string
    quantity: number
    unit: string
    servings: number
    calories: number
    protein: number
    carbs: number
    fat: number
  }>
}

// ============================================================
// Helpers
// ============================================================

const UNITS = [
  { key: "g", label: "g" },
  { key: "ml", label: "ml" },
  { key: "unidade", label: "unidade" },
  { key: "fatia", label: "fatia" },
  { key: "colher", label: "colher (sopa)" },
  { key: "pitada", label: "pitada" },
  { key: "scoop", label: "scoop" },
]

function calculateServings(quantity: number, unit: string, foodServingSize: number): number {
  switch (unit) {
    case "g":
    case "ml":
      return quantity / foodServingSize
    case "unidade":
    case "fatia":
      return quantity // 1 unidade = 1 serving
    case "colher":
      return (quantity * 15) / foodServingSize // 1 colher ~ 15g
    case "pitada":
      return 0 // negligible
    case "scoop":
      return quantity // 1 scoop = 1 serving
    default:
      return quantity / foodServingSize
  }
}

function formatUnit(quantity: number, unit: string): string {
  if (unit === "g" || unit === "ml") return `${quantity}${unit}`
  if (unit === "unidade") return quantity === 1 ? "1 unidade" : `${quantity} unidades`
  if (unit === "fatia") return quantity === 1 ? "1 fatia" : `${quantity} fatias`
  if (unit === "colher") return quantity === 1 ? "1 colher" : `${quantity} colheres`
  if (unit === "pitada") return quantity === 1 ? "1 pitada" : `${quantity} pitadas`
  if (unit === "scoop") return quantity === 1 ? "1 scoop" : `${quantity} scoops`
  return `${quantity} ${unit}`
}

const NOOM_COLORS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  green: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Baixa densidade" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400", label: "Media densidade" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", label: "Alta densidade" },
}

// ============================================================
// Main Page
// ============================================================

export default function CombosPage() {
  const router = useRouter()
  const [combos, setCombos] = useState<Combo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Creation flow
  const [showCreate, setShowCreate] = useState(false)
  const [step, setStep] = useState<"name" | "ingredients" | "preview">("name")
  const [comboName, setComboName] = useState("")
  const [ingredients, setIngredients] = useState<ComboIngredient[]>([])

  // Ingredient search
  const [searchQuery, setSearchQuery] = useState("")
  const [searchCategory, setSearchCategory] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Adding ingredient form
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [addQuantity, setAddQuantity] = useState(100)
  const [addUnit, setAddUnit] = useState("g")

  // ----------------------------------------------------------
  // Fetch combos
  // ----------------------------------------------------------
  const fetchCombos = useCallback(async () => {
    try {
      const res = await fetch("/api/combos")
      if (res.ok) {
        setCombos(await res.json())
      }
    } catch {
      console.error("Erro ao buscar combos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCombos()
  }, [fetchCombos])

  // ----------------------------------------------------------
  // Food search (debounced)
  // ----------------------------------------------------------
  const fetchFoods = useCallback(async (q: string, cat: string | null) => {
    setSearchLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (cat) params.set("category", cat)
      params.set("limit", "25")
      const res = await fetch(`/api/alimentos?${params}`)
      if (res.ok) {
        const data = await res.json()
        // Filter out combos from search results to avoid nesting
        setSearchResults(data.filter((f: Food & { isCombo?: boolean }) => !f.isCombo))
      }
    } catch {
      console.error("Erro ao buscar alimentos")
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!showCreate || step !== "ingredients") return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchFoods(searchQuery, searchCategory)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, searchCategory, showCreate, step, fetchFoods])

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  const handleSelectFood = (food: Food) => {
    setSelectedFood(food)
    setAddQuantity(food.servingSize)
    setAddUnit("g")
  }

  const handleAddIngredient = () => {
    if (!selectedFood) return
    const servings = calculateServings(addQuantity, addUnit, selectedFood.servingSize)
    const ingredient: ComboIngredient = {
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      quantity: addQuantity,
      unit: addUnit,
      servings,
      calories: selectedFood.calories * servings,
      protein: selectedFood.protein * servings,
      carbs: selectedFood.carbs * servings,
      fat: selectedFood.fat * servings,
    }
    setIngredients((prev) => [...prev, ingredient])
    setSelectedFood(null)
    setSearchQuery("")
    // Focus back on search
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  const handleRemoveIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx))
  }

  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const handleSaveCombo = async () => {
    if (!comboName.trim() || ingredients.length === 0) return
    setCreating(true)
    try {
      const res = await fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: comboName.trim(),
          items: ingredients.map((i) => ({
            foodId: i.foodId,
            quantity: i.quantity,
            unit: i.unit,
            servings: i.servings,
          })),
        }),
      })
      if (res.ok) {
        toast.success("Combo criado com sucesso!")
        resetCreateFlow()
        fetchCombos()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao criar combo")
      }
    } catch {
      toast.error("Erro ao criar combo")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteCombo = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/combos?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Combo excluido!")
        setCombos((prev) => prev.filter((c) => c.id !== id))
      } else {
        toast.error("Erro ao excluir combo")
      }
    } catch {
      toast.error("Erro ao excluir combo")
    } finally {
      setDeleting(null)
    }
  }

  const resetCreateFlow = () => {
    setShowCreate(false)
    setStep("name")
    setComboName("")
    setIngredients([])
    setSelectedFood(null)
    setSearchQuery("")
    setSearchCategory(null)
    setSearchResults([])
    setHasSearched(false)
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-500" />
            Meus Combos
          </h1>
          <p className="text-xs text-muted-foreground">
            Monte combinacoes de alimentos para usar no dia a dia
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-24 mt-2">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                <div className="h-5 w-40 bg-muted rounded mb-3" />
                <div className="h-4 w-56 bg-muted rounded mb-2" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Combo list */}
            {combos.length === 0 && !showCreate && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mb-4">
                  <Layers className="w-9 h-9 text-violet-400" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Nenhum combo criado
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                  Combine alimentos para criar receitas personalizadas que podem ser usadas no diario e na dieta
                </p>
              </div>
            )}

            <div className="space-y-3">
              {combos.map((combo) => {
                const noom = NOOM_COLORS[combo.noomColor] || NOOM_COLORS.green
                return (
                  <div
                    key={combo.id}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                  >
                    {/* Combo header */}
                    <div className="px-4 pt-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {combo.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Flame className="w-3 h-3 text-orange-500" />
                              {Math.round(combo.calories)} kcal
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Beef className="w-3 h-3 text-indigo-500" />
                              {Math.round(combo.protein)}g P
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Wheat className="w-3 h-3 text-amber-500" />
                              {Math.round(combo.carbs)}g C
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Droplets className="w-3 h-3 text-red-500" />
                              {Math.round(combo.fat)}g G
                            </span>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${noom.bg}`}>
                          <div className={`w-2 h-2 rounded-full ${noom.dot}`} />
                          <span className={`text-[10px] font-semibold ${noom.text}`}>
                            {noom.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ingredients list */}
                    <div className="px-4 pb-3">
                      <div className="mt-2 space-y-1">
                        {combo.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                            <span>
                              {formatUnit(item.quantity, item.unit)}{" "}
                              <span className="text-foreground font-medium">{item.foodName}</span>
                            </span>
                            {item.servings > 0 && (
                              <span className="text-muted-foreground/60">
                                ({Math.round(item.calories)} kcal)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex border-t border-border">
                      <button
                        onClick={() => handleDeleteCombo(combo.id)}
                        disabled={deleting === combo.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting === combo.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Create button */}
            {!showCreate && (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-violet-600 text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all active:scale-[0.98] hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Criar Novo Combo
              </button>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* Creation Sheet (overlay) */}
      {/* ============================================================ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Sheet header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2 border-b border-border">
            <button
              onClick={() => {
                if (step === "ingredients" && ingredients.length > 0) {
                  if (!confirm("Descartar ingredientes adicionados?")) return
                }
                resetCreateFlow()
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-90 transition-all"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="text-base font-bold text-foreground flex-1">
              {step === "name" && "Novo Combo"}
              {step === "ingredients" && "Ingredientes"}
              {step === "preview" && "Revisar Combo"}
            </h2>
            {step === "ingredients" && ingredients.length > 0 && (
              <button
                onClick={() => setStep("preview")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
              >
                <Check className="w-3.5 h-3.5" />
                Revisar
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-24">
            {/* ========== STEP 1: Name ========== */}
            {step === "name" && (
              <div className="mt-6">
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Nome do combo
                </label>
                <input
                  type="text"
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                  placeholder="Ex: Meu Acai Diario"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Escolha um nome que facilite encontrar o combo depois
                </p>
                <button
                  onClick={() => setStep("ingredients")}
                  disabled={!comboName.trim()}
                  className="w-full mt-6 py-3.5 rounded-xl bg-violet-600 text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all active:scale-[0.98] hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Proximo: Adicionar Ingredientes
                </button>
              </div>
            )}

            {/* ========== STEP 2: Ingredients ========== */}
            {step === "ingredients" && (
              <div className="mt-4 space-y-4">
                {/* Selected food - add form */}
                {selectedFood ? (
                  <div className="bg-violet-50 dark:bg-violet-500/10 rounded-xl p-4 border border-violet-200 dark:border-violet-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-foreground">{selectedFood.name}</p>
                      <button
                        onClick={() => setSelectedFood(null)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Porcao base: {selectedFood.servingLabel} = {Math.round(selectedFood.calories)} kcal
                    </p>

                    <div className="flex gap-2 items-end">
                      {/* Quantity */}
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                          Qtd
                        </label>
                        <input
                          type="number"
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(Number(e.target.value) || 0)}
                          min={0}
                          step={1}
                          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                        />
                      </div>

                      {/* Unit */}
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                          Unidade
                        </label>
                        <div className="relative">
                          <select
                            value={addUnit}
                            onChange={(e) => setAddUnit(e.target.value)}
                            className="w-full appearance-none px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all pr-8"
                          >
                            {UNITS.map((u) => (
                              <option key={u.key} value={u.key}>{u.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {/* Add button */}
                      <button
                        onClick={handleAddIngredient}
                        disabled={addQuantity <= 0}
                        className="px-4 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preview nutrition for this ingredient */}
                    {addQuantity > 0 && (
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        {(() => {
                          const s = calculateServings(addQuantity, addUnit, selectedFood.servingSize)
                          return (
                            <>
                              <span>{Math.round(selectedFood.calories * s)} kcal</span>
                              <span>{Math.round(selectedFood.protein * s)}g P</span>
                              <span>{Math.round(selectedFood.carbs * s)}g C</span>
                              <span>{Math.round(selectedFood.fat * s)}g G</span>
                              {addUnit === "pitada" && (
                                <span className="italic">(nutricao desprezivel)</span>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar ingrediente..."
                        className="w-full pl-10 pr-10 py-3 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>

                    {/* Category chips */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                      <button
                        onClick={() => setSearchCategory(null)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          searchCategory === null
                            ? "bg-violet-600 text-white shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        Todos
                      </button>
                      {FOOD_CATEGORIES.map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => setSearchCategory(searchCategory === cat.key ? null : cat.key)}
                          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                            searchCategory === cat.key
                              ? "bg-violet-600 text-white shadow-sm"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Search results */}
                    <div className="max-h-[300px] overflow-y-auto -mx-4">
                      {searchLoading ? (
                        <div className="space-y-2 px-4">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                              <div className="w-14 h-6 bg-muted rounded-full" />
                              <div className="flex-1 space-y-1.5">
                                <div className="w-2/3 h-3.5 bg-muted rounded" />
                                <div className="w-1/3 h-3 bg-muted rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-0.5">
                          {searchResults.map((food) => (
                            <FoodCard
                              key={food.id}
                              food={food}
                              onClick={() => handleSelectFood(food)}
                            />
                          ))}
                        </div>
                      ) : hasSearched ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Search className="w-6 h-6 text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">Nenhum resultado</p>
                        </div>
                      ) : null}
                    </div>
                  </>
                )}

                {/* Added ingredients */}
                {ingredients.length > 0 && (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Ingredientes adicionados ({ingredients.length})
                      </p>
                    </div>
                    <div className="divide-y divide-border">
                      {ingredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {ing.foodName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatUnit(ing.quantity, ing.unit)}
                              {ing.servings > 0 && ` · ${Math.round(ing.calories)} kcal`}
                              {ing.unit === "pitada" && " (desprezivel)"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveIngredient(idx)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Running total */}
                    <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center gap-4">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {Math.round(totals.calories)} kcal
                      </span>
                      <span className="text-xs text-muted-foreground">{Math.round(totals.protein)}g P</span>
                      <span className="text-xs text-muted-foreground">{Math.round(totals.carbs)}g C</span>
                      <span className="text-xs text-muted-foreground">{Math.round(totals.fat)}g G</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========== STEP 3: Preview ========== */}
            {step === "preview" && (
              <div className="mt-4 space-y-4">
                {/* Combo name */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Combo
                  </p>
                  <h3 className="text-lg font-bold text-foreground">{comboName}</h3>
                </div>

                {/* Ingredients */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Ingredientes ({ingredients.length})
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-violet-500" />
                          <span className="text-sm text-foreground">{ing.foodName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatUnit(ing.quantity, ing.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nutritional summary */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Informacao Nutricional Total
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-lg font-bold text-foreground tabular-nums">
                          {Math.round(totals.calories)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">kcal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                      <Beef className="w-5 h-5 text-indigo-500" />
                      <div>
                        <p className="text-lg font-bold text-foreground tabular-nums">
                          {Math.round(totals.protein)}g
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Proteina</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                      <Wheat className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-lg font-bold text-foreground tabular-nums">
                          {Math.round(totals.carbs)}g
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Carboidratos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
                      <Droplets className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-lg font-bold text-foreground tabular-nums">
                          {Math.round(totals.fat)}g
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Gorduras</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("ingredients")}
                    className="flex-1 py-3.5 rounded-xl border border-border text-foreground font-semibold text-sm transition-all active:scale-[0.98] hover:bg-muted"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleSaveCombo}
                    disabled={creating}
                    className="flex-[2] py-3.5 rounded-xl bg-violet-600 text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all active:scale-[0.98] hover:bg-violet-700 disabled:opacity-60"
                  >
                    {creating ? "Salvando..." : "Salvar Combo"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
