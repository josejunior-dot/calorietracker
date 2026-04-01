"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DayNavigator } from "@/components/diario/DayNavigator"
import { MealSection } from "@/components/diario/MealSection"
import { toISODate } from "@/lib/date"
import { MEAL_TYPES } from "@/lib/constants"
import { toast } from "sonner"

type Food = {
  id: string
  name: string
  brand: string | null
  servingSize: number
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  noomColor: string
}

type MealEntryWithFood = {
  id: string
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
  food: Food
}

type MealGroup = {
  type: string
  label: string
  totalCalories: number
  items: MealEntryWithFood[]
}

type MealsResponse = {
  meals: MealGroup[]
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

function DiarioContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [date, setDate] = useState(
    searchParams.get("date") || toISODate(new Date())
  )
  const [data, setData] = useState<MealsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [dailyTarget] = useState(2000) // TODO: from user profile

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/refeicoes?date=${date}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      toast.error("Erro ao carregar diário")
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    router.replace(`/diario?date=${newDate}`, { scroll: false })
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/refeicoes/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Alimento removido")
        fetchData()
      } else {
        toast.error("Erro ao remover alimento")
      }
    } catch {
      toast.error("Erro ao remover alimento")
    }
  }

  const handleAddClick = (mealType: string) => {
    router.push(`/adicionar?meal=${mealType}&date=${date}`)
  }

  const totalConsumed = data?.totals.calories || 0
  const remaining = dailyTarget - totalConsumed
  const progress = Math.min((totalConsumed / dailyTarget) * 100, 100)
  const isOver = totalConsumed > dailyTarget

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24 max-w-lg mx-auto">
      {/* Day navigator */}
      <DayNavigator date={date} onDateChange={handleDateChange} />

      {/* Daily summary bar */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Consumido</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {Math.round(totalConsumed)}
              <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">
              {isOver ? "Excesso" : "Restante"}
            </p>
            <p className={`text-2xl font-bold tabular-nums ${
              isOver ? "text-red-500" : "text-primary"
            }`}>
              {isOver ? "+" : ""}{Math.abs(Math.round(remaining))}
              <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isOver ? "bg-red-500" : "bg-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Macro summary */}
        {data && (
          <div className="grid grid-cols-3 gap-3 pt-1">
            <MacroSummary
              label="Proteína"
              value={data.totals.protein}
              unit="g"
              color="bg-indigo-500"
            />
            <MacroSummary
              label="Carbs"
              value={data.totals.carbs}
              unit="g"
              color="bg-amber-500"
            />
            <MacroSummary
              label="Gordura"
              value={data.totals.fat}
              unit="g"
              color="bg-red-500"
            />
          </div>
        )}
      </div>

      {/* Meal sections */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="w-24 h-4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {MEAL_TYPES.map((meal) => {
            const group = data?.meals.find((m) => m.type === meal.key)
            return (
              <MealSection
                key={meal.key}
                mealType={meal.key}
                label={meal.label}
                emoji={meal.emoji}
                entries={group?.items || []}
                onDelete={handleDelete}
                onAddClick={() => handleAddClick(meal.key)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function MacroSummary({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number
  unit: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground tabular-nums">
          {Math.round(value * 10) / 10}{unit}
        </p>
      </div>
    </div>
  )
}

export default function DiarioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DiarioContent />
    </Suspense>
  )
}
