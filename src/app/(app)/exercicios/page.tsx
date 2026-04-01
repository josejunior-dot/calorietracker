"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DayNavigator } from "@/components/diario/DayNavigator"
import { ExerciseSearch } from "@/components/exercicios/ExerciseSearch"
import { DurationInput } from "@/components/exercicios/DurationInput"
import { toISODate } from "@/lib/date"
import { Plus, Flame, Trash2, Clock, X } from "lucide-react"
import { toast } from "sonner"

type Exercise = {
  id: string
  name: string
  category: string
  caloriesPerMinBase: number
  icon?: string | null
}

type ExerciseEntry = {
  id: string
  durationMin: number
  caloriesBurned: number
  exercise: Exercise
}

function ExerciciosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [date, setDate] = useState(searchParams.get("date") || toISODate(new Date()))
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [totalBurned, setTotalBurned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Add flow states
  const [showSearch, setShowSearch] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  // Fetch userId once
  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.id) setUserId(data.id)
      })
      .catch(() => {})
  }, [])

  const fetchEntries = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/exercicios?date=${date}&userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
        setTotalBurned(data.totalBurned || 0)
      }
    } catch {
      toast.error("Erro ao carregar exercícios")
    } finally {
      setLoading(false)
    }
  }, [date, userId])

  useEffect(() => {
    if (userId) fetchEntries()
  }, [fetchEntries, userId])

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    router.replace(`/exercicios?date=${newDate}`, { scroll: false })
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/exercicios/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Exercício removido")
        fetchEntries()
      } else {
        toast.error("Erro ao remover exercício")
      }
    } catch {
      toast.error("Erro ao remover exercício")
    }
  }

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setShowSearch(false)
  }

  const handleDurationConfirm = () => {
    setSelectedExercise(null)
    toast.success("Exercício registrado!")
    fetchEntries()
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24 max-w-lg mx-auto">
      {/* Day navigator */}
      <DayNavigator date={date} onDateChange={handleDateChange} />

      {/* Summary card */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-2xl shadow-sm border border-orange-200/50 dark:border-orange-800/30 p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Calorias Queimadas Hoje
            </p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
              {Math.round(totalBurned)}
              <span className="text-sm font-normal text-orange-600/60 dark:text-orange-400/60 ml-1">
                kcal
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Exercise entries list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground px-1">
          Exercícios do dia
        </h2>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border animate-pulse"
            >
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="w-28 h-3.5 bg-muted rounded" />
                <div className="w-20 h-3 bg-muted rounded" />
              </div>
            </div>
          ))
        ) : entries.length > 0 ? (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
            >
              {/* Icon */}
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-lg shrink-0">
                {entry.exercise.icon || "🏃"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {entry.exercise.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {entry.durationMin} min
                  </span>
                  <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                    <Flame className="w-3 h-3" />
                    {Math.round(entry.caloriesBurned)} kcal
                  </span>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(entry.id)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"
                aria-label="Remover exercício"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="py-10 text-center">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3 text-2xl">
              🏋️
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum exercício registrado
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Adicione sua atividade física do dia
            </p>
          </div>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowSearch(true)}
        className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <Plus className="w-5 h-5" />
        Adicionar Exercício
      </button>

      {/* Search overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSearch(false)}
          />
          <div className="relative mt-auto w-full max-w-lg mx-auto bg-background rounded-t-3xl border border-border shadow-xl p-5 pb-8 max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Buscar Exercício
              </h2>
              <button
                onClick={() => setShowSearch(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <ExerciseSearch onSelect={handleExerciseSelect} />
          </div>
        </div>
      )}

      {/* Duration input modal */}
      {selectedExercise && (
        <DurationInput
          exercise={selectedExercise}
          date={date}
          onConfirm={handleDurationConfirm}
          onCancel={() => setSelectedExercise(null)}
        />
      )}
    </div>
  )
}

export default function ExerciciosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ExerciciosContent />
    </Suspense>
  )
}
