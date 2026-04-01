"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CalorieRing } from "@/components/dashboard/CalorieRing"
import { MacroBar } from "@/components/dashboard/MacroBar"
import { MealSummaryCard } from "@/components/dashboard/MealSummaryCard"
import { StreakBadge } from "@/components/dashboard/StreakBadge"
import { CalorieSummaryRow } from "@/components/dashboard/CalorieSummaryRow"
import { getGreeting, toISODate, formatDate } from "@/lib/date"
import { MEAL_TYPES, MACRO_COLORS } from "@/lib/constants"
import type { DashboardData } from "@/types"

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-muted/60 ${className ?? ""}`} />
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-36" />
        </div>
        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>

      {/* Ring skeleton */}
      <div className="flex justify-center">
        <SkeletonBlock className="h-[200px] w-[200px] rounded-full" />
      </div>

      {/* Summary row skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>

      {/* Macros skeleton */}
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-5 w-28" />
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-10" />
        ))}
      </div>

      {/* Meals skeleton */}
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-5 w-32" />
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-16" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const today = toISODate(new Date())

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      const res = await fetch(`/api/dashboard?date=${today}`)
      if (!res.ok) throw new Error("Erro ao carregar dados")
      const json: DashboardData = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [today])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 pt-20">
        <p className="text-lg text-muted-foreground">{error}</p>
        <button
          onClick={() => {
            setLoading(true)
            fetchDashboard()
          }}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground
            active:scale-95 transition-transform"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data) return null

  const { user, calories, macros, meals, streak } = data

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold text-foreground">
            {getGreeting()}, {user.name}!
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {formatDate(today)}
          </p>
        </div>
        <StreakBadge current={streak.current} longest={streak.longest} />
      </div>

      {/* Calorie Ring */}
      <div className="flex justify-center py-2">
        <CalorieRing
          consumed={calories.consumed}
          burned={calories.burned}
          target={calories.target}
        />
      </div>

      {/* Calorie Summary Row */}
      <CalorieSummaryRow
        consumed={calories.consumed}
        burned={calories.burned}
        net={calories.consumed - calories.burned}
      />

      {/* Macros */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">Macronutrientes</h2>
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border/50 flex flex-col gap-4">
          <MacroBar
            label="Proteina"
            current={macros.protein}
            target={macros.proteinTarget}
            color={MACRO_COLORS.protein.bg}
          />
          <MacroBar
            label="Carboidratos"
            current={macros.carbs}
            target={macros.carbsTarget}
            color={MACRO_COLORS.carbs.bg}
          />
          <MacroBar
            label="Gordura"
            current={macros.fat}
            target={macros.fatTarget}
            color={MACRO_COLORS.fat.bg}
          />
        </div>
      </div>

      {/* Meals */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">Refeicoes</h2>
        <div className="flex flex-col gap-2">
          {MEAL_TYPES.map((mealType) => {
            const mealData = meals.find((m) => m.type === mealType.key)
            return (
              <MealSummaryCard
                key={mealType.key}
                type={mealType.key}
                label={mealType.label}
                emoji={mealType.emoji}
                totalCalories={mealData?.totalCalories ?? 0}
                itemCount={mealData?.itemCount ?? 0}
                onClick={() => router.push(`/adicionar?meal=${mealType.key}`)}
              />
            )
          })}
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={() => fetchDashboard(true)}
        disabled={refreshing}
        className="mx-auto flex items-center gap-2 rounded-full bg-muted/60 px-5 py-2 text-sm
          text-muted-foreground transition-all active:scale-95 disabled:opacity-50"
      >
        <svg
          className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 21h5v-5" />
        </svg>
        {refreshing ? "Atualizando..." : "Atualizar"}
      </button>
    </div>
  )
}
