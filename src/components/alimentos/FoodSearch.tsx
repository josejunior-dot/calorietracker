"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X } from "lucide-react"
import { FoodCard } from "./FoodCard"
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
  isRecent?: boolean
}

type FoodSearchProps = {
  onSelect: (food: Food) => void
  userId?: string
}

export function FoodSearch({ onSelect, userId }: FoodSearchProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [results, setResults] = useState<Food[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchFoods = useCallback(async (q: string, cat: string | null) => {
    setLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (cat) params.set("category", cat)
      if (userId) params.set("recent", userId)
      params.set("limit", "25")

      const res = await fetch(`/api/alimentos?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch {
      console.error("Erro ao buscar alimentos")
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Initial load: show recents
  useEffect(() => {
    fetchFoods("", null)
  }, [fetchFoods])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchFoods(query, category)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, category, fetchFoods])

  // Split results into recent and regular
  const recentItems = results.filter((f) => f.isRecent)
  const regularItems = results.filter((f) => !f.isRecent)

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar alimento..."
          className="w-full pl-10 pr-10 py-3 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        <button
          onClick={() => setCategory(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            category === null
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Todos
        </button>
        {FOOD_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(category === cat.key ? null : cat.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              category === cat.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          /* Loading skeletons */
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-14 h-6 bg-muted rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-2/3 h-3.5 bg-muted rounded" />
                  <div className="w-1/3 h-3 bg-muted rounded" />
                </div>
                <div className="w-10 h-6 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Recentes */}
            {recentItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">
                  Recentes
                </p>
                <div className="space-y-0.5">
                  {recentItems.map((food) => (
                    <FoodCard
                      key={`recent-${food.id}`}
                      food={food}
                      isRecent
                      onClick={() => onSelect(food)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Resultados */}
            {regularItems.length > 0 && (
              <div>
                {recentItems.length > 0 && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 mt-2">
                    Resultados
                  </p>
                )}
                <div className="space-y-0.5">
                  {regularItems.map((food) => (
                    <FoodCard
                      key={food.id}
                      food={food}
                      onClick={() => onSelect(food)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {hasSearched && results.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Search className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Nenhum resultado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tente buscar com outro termo ou categoria
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
