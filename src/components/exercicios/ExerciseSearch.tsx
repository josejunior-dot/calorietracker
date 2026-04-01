"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X } from "lucide-react"
import { ExerciseCard } from "./ExerciseCard"

type Exercise = {
  id: string
  name: string
  category: string
  caloriesPerMinBase: number
  icon?: string | null
}

type ExerciseSearchProps = {
  onSelect: (exercise: Exercise) => void
}

const CATEGORIES = [
  { key: "Todos", label: "Todos" },
  { key: "Cardio", label: "Cardio" },
  { key: "Musculação", label: "Musculação" },
  { key: "Esportes", label: "Esportes" },
  { key: "Flexibilidade", label: "Flexibilidade" },
  { key: "Funcional", label: "Funcional" },
]

export function ExerciseSearch({ onSelect }: ExerciseSearchProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Todos")
  const [results, setResults] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchExercises = useCallback(async (search: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/exercicios?search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data: Exercise[] = await res.json()
        setResults(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
      setHasSearched(true)
    }
  }, [])

  // Initial fetch (empty search = all exercises)
  useEffect(() => {
    fetchExercises("")
  }, [fetchExercises])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchExercises(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchExercises])

  // Filter by category client-side
  const filtered = category === "Todos"
    ? results
    : results.filter((e) => e.category === category)

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar exercício..."
          className="w-full pl-10 pr-9 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              category === cat.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
        {loading ? (
          // Skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border animate-pulse"
            >
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-3.5 bg-muted rounded" />
                <div className="w-16 h-3 bg-muted rounded" />
              </div>
              <div className="w-12 h-3 bg-muted rounded" />
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => onSelect(exercise)}
            />
          ))
        ) : hasSearched ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhum exercício encontrado
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Tente outro termo ou categoria
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
