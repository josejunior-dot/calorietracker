"use client"

type Exercise = {
  id: string
  name: string
  category: string
  caloriesPerMinBase: number
  icon?: string | null
}

type ExerciseCardProps = {
  exercise: Exercise
  onClick: () => void
}

const categoryColors: Record<string, string> = {
  Cardio: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "Musculação": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Esportes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Flexibilidade: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Funcional: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const colorClass = categoryColors[exercise.category] || "bg-muted text-muted-foreground"

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm active:scale-[0.98] transition-all text-left"
    >
      {/* Icon */}
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-lg shrink-0">
        {exercise.icon || "🏃"}
      </div>

      {/* Name + category */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {exercise.name}
        </p>
        <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full ${colorClass}`}>
          {exercise.category}
        </span>
      </div>

      {/* Calories per minute */}
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">
          ~{exercise.caloriesPerMinBase.toFixed(1)}
        </p>
        <p className="text-[10px] text-muted-foreground">kcal/min</p>
      </div>
    </button>
  )
}
