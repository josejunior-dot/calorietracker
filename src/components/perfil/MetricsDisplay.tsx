"use client"

import { Flame, Activity, Target } from "lucide-react"

type MetricsDisplayProps = {
  bmr: number
  tdee: number
  dailyTarget: number
}

export function MetricsDisplay({ bmr, tdee, dailyTarget }: MetricsDisplayProps) {
  const metrics = [
    {
      icon: Flame,
      label: "TMB",
      value: Math.round(bmr),
      unit: "kcal",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200/50 dark:border-blue-800/30",
      description: "Taxa Metabólica Basal — calorias em repouso",
    },
    {
      icon: Activity,
      label: "TDEE",
      value: Math.round(tdee),
      unit: "kcal",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200/50 dark:border-green-800/30",
      description: "Gasto Total Diário — com atividade física",
    },
    {
      icon: Target,
      label: "Meta",
      value: Math.round(dailyTarget),
      unit: "kcal",
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200/50 dark:border-orange-800/30",
      description: "Meta diária ajustada ao seu objetivo",
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {metrics.map((m) => (
        <div
          key={m.label}
          className={`${m.bg} border ${m.border} rounded-2xl p-3 text-center space-y-1.5`}
        >
          <m.icon className={`w-5 h-5 ${m.color} mx-auto`} />
          <div>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {m.value}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {m.unit}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground/70 leading-tight">
            {m.label}
          </p>
        </div>
      ))}
    </div>
  )
}
