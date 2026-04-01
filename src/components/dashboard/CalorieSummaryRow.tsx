"use client"

import { UtensilsCrossed, Flame, TrendingDown } from "lucide-react"

interface CalorieSummaryRowProps {
  consumed: number
  burned: number
  net: number
}

export function CalorieSummaryRow({ consumed, burned, net }: CalorieSummaryRowProps) {
  const items = [
    {
      icon: UtensilsCrossed,
      label: "Consumido",
      value: consumed,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      icon: Flame,
      label: "Queimado",
      value: burned,
      iconColor: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      icon: TrendingDown,
      label: "Liquido",
      value: net,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-card p-3 shadow-sm border border-border/50"
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${item.bgColor}`}>
            <item.icon className={`h-4.5 w-4.5 ${item.iconColor}`} />
          </div>
          <span className="text-lg font-bold tabular-nums text-card-foreground">
            {Math.round(item.value)}
          </span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
