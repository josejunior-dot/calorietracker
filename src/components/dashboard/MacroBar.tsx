"use client"

interface MacroBarProps {
  label: string
  current: number
  target: number
  color: string
  unit?: string
}

export function MacroBar({ label, current, target, color, unit = "g" }: MacroBarProps) {
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const isOver = current > target

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          <span className={isOver ? "text-red-500 font-semibold" : "font-semibold text-foreground"}>
            {Math.round(current)}
          </span>
          {" / "}
          {Math.round(target)} {unit}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
