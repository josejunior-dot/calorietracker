"use client"

import { useState } from "react"
import { X, Flame, Clock } from "lucide-react"

type Exercise = {
  id: string
  name: string
  category: string
  caloriesPerMinBase: number
  icon?: string | null
}

type DurationInputProps = {
  exercise: Exercise
  date: string
  onConfirm: () => void
  onCancel: () => void
}

const QUICK_MINUTES = [15, 30, 45, 60]

export function DurationInput({ exercise, date, onConfirm, onCancel }: DurationInputProps) {
  const [duration, setDuration] = useState(30)
  const [loading, setLoading] = useState(false)

  const estimatedCalories = Math.round(exercise.caloriesPerMinBase * duration)

  const handleSubmit = async () => {
    if (duration <= 0) return
    setLoading(true)

    try {
      // Fetch userId
      const perfilRes = await fetch("/api/perfil")
      if (!perfilRes.ok) return
      const perfil = await perfilRes.json()

      const res = await fetch("/api/exercicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: perfil.id,
          exerciseId: exercise.id,
          date,
          durationMin: duration,
        }),
      })

      if (res.ok) {
        onConfirm()
      }
    } catch {
      // handled by parent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-xl p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-300">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Exercise name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-muted text-xl">
            {exercise.icon || "🏃"}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{exercise.name}</h3>
            <p className="text-xs text-muted-foreground">{exercise.category}</p>
          </div>
        </div>

        {/* Duration input */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Duração (minutos)
          </label>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setDuration(Math.max(1, duration - 5))}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-foreground font-bold text-lg active:scale-95 transition-all"
            >
              -
            </button>

            <input
              type="number"
              min={1}
              max={300}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Math.min(300, Number(e.target.value) || 1)))}
              className="w-24 text-center text-4xl font-bold text-foreground bg-transparent border-b-2 border-primary/30 focus:border-primary focus:outline-none transition-colors tabular-nums"
            />

            <button
              onClick={() => setDuration(Math.min(300, duration + 5))}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-foreground font-bold text-lg active:scale-95 transition-all"
            >
              +
            </button>
          </div>

          {/* Quick buttons */}
          <div className="flex gap-2 justify-center">
            {QUICK_MINUTES.map((min) => (
              <button
                key={min}
                onClick={() => setDuration(min)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  duration === min
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>

        {/* Calories preview */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-2xl p-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-3xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
              {estimatedCalories}
            </span>
            <span className="text-sm text-orange-600/70 dark:text-orange-400/70">kcal</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Estimativa baseada em 70kg. Valor será ajustado ao seu peso.
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || duration <= 0}
          className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            "Registrar"
          )}
        </button>
      </div>
    </div>
  )
}
