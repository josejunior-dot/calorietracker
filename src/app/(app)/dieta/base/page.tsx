"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Pin, X, Plus, Minus, Search, RefreshCw, ArrowLeft, ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const NOOM_DOT_COLORS: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  orange: "bg-orange-500",
}

const MEAL_TYPE_OPTIONS = [
  { key: "cafe_da_manha", label: "Cafe" },
  { key: "almoco", label: "Almoco" },
  { key: "jantar", label: "Jantar" },
  { key: "lanche", label: "Lanche" },
  { key: "qualquer", label: "Qualquer" },
]

const MEAL_BADGE_COLORS: Record<string, string> = {
  cafe_da_manha: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  almoco: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  jantar: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  lanche: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  qualquer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
}

const MEAL_BADGE_LABELS: Record<string, string> = {
  cafe_da_manha: "Cafe",
  almoco: "Almoco",
  jantar: "Jantar",
  lanche: "Lanche",
  qualquer: "Qualquer",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Food = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FixedFoodRecord = any

export default function BaseAlimentarPage() {
  const [fixedFoods, setFixedFoods] = useState<FixedFoodRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add form state
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [servings, setServings] = useState(1)
  const [mealType, setMealType] = useState("qualquer")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [searching, setSearching] = useState(false)

  const fetchFixedFoods = useCallback(async () => {
    try {
      const res = await fetch("/api/base-alimentar")
      if (res.ok) {
        const data = await res.json()
        setFixedFoods(data)
      }
    } catch {
      toast.error("Erro ao carregar alimentos fixos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFixedFoods()
  }, [fetchFixedFoods])

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

  const handleAdd = async () => {
    if (!selectedFood) return
    setSaving(true)
    try {
      const res = await fetch("/api/base-alimentar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId: selectedFood.id,
          mealType,
          servings,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Erro ao adicionar")
        return
      }
      toast.success(`${selectedFood.name} adicionado a base alimentar`)
      resetForm()
      fetchFixedFoods()
    } catch {
      toast.error("Erro de conexao")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/base-alimentar?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setFixedFoods((prev) => prev.filter((f: FixedFoodRecord) => f.id !== id))
        toast.success(`${name} removido da base alimentar`)
      }
    } catch {
      toast.error("Erro ao remover")
    }
  }

  const resetForm = () => {
    setAdding(false)
    setSelectedFood(null)
    setServings(1)
    setMealType("qualquer")
    setSearchQuery("")
    setSearchResults([])
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dieta"
          className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Pin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Base Alimentar</h1>
            <p className="text-xs text-muted-foreground">Alimentos que voce nao abre mao</p>
          </div>
        </div>
      </div>

      {/* Fixed foods list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-muted rounded" />
                  <div className="w-20 h-3 bg-muted rounded" />
                </div>
                <div className="w-16 h-4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : fixedFoods.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Pin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Nenhum alimento fixo</h2>
          <p className="text-sm text-muted-foreground max-w-xs mb-4">
            Adicione alimentos que voce consome todos os dias.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fixedFoods.map((ff: FixedFoodRecord) => (
            <div
              key={ff.id}
              className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border"
            >
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${NOOM_DOT_COLORS[ff.food?.noomColor] || "bg-gray-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{ff.food?.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${MEAL_BADGE_COLORS[ff.mealType] || MEAL_BADGE_COLORS.qualquer}`}>
                    {MEAL_BADGE_LABELS[ff.mealType] || ff.mealType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ff.servings} {ff.servings === 1 ? "porcao" : "porcoes"}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary tabular-nums whitespace-nowrap">
                {Math.round(ff.food?.calories * ff.servings)} kcal
              </span>
              <button
                onClick={() => handleDelete(ff.id, ff.food?.name)}
                className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shrink-0"
                title="Remover"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4 animate-fade-in">
          {!selectedFood ? (
            <>
              <h3 className="text-sm font-semibold text-foreground">Buscar Alimento</h3>
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
                    onClick={() => setSelectedFood(food)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${NOOM_DOT_COLORS[food.noomColor] || "bg-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{food.name}</p>
                      <p className="text-xs text-muted-foreground">{food.servingLabel}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary tabular-nums">{food.calories} kcal</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shrink-0 ${NOOM_DOT_COLORS[selectedFood.noomColor] || "bg-gray-400"}`} />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{selectedFood.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedFood.servingLabel} · {selectedFood.calories} kcal</p>
                </div>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-xs text-primary font-medium"
                >
                  Trocar
                </button>
              </div>

              {/* Servings */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Porcoes</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                    className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                  >
                    <Minus className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="text-lg font-bold text-foreground tabular-nums w-12 text-center">{servings}</span>
                  <button
                    onClick={() => setServings(Math.min(5, servings + 0.5))}
                    className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                  >
                    <Plus className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="text-xs text-muted-foreground ml-2">
                    = {Math.round(selectedFood.calories * servings)} kcal
                  </span>
                </div>
              </div>

              {/* Meal type */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Refeicao</label>
                <div className="flex flex-wrap gap-2">
                  {MEAL_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setMealType(opt.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        mealType === opt.key
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm */}
              <button
                onClick={handleAdd}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Pin className="w-4 h-4" />}
                {saving ? "Adicionando..." : "Adicionar"}
              </button>
            </>
          )}

          {/* Cancel */}
          <button
            onClick={resetForm}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Add button */}
      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
        >
          <Plus className="w-4 h-4" />
          Adicionar Alimento Fixo
        </button>
      )}
    </div>
  )
}
