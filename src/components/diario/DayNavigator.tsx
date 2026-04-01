"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatDate, formatWeekday, addDays, isToday, toISODate } from "@/lib/date"

type DayNavigatorProps = {
  date: string
  onDateChange: (date: string) => void
}

export function DayNavigator({ date, onDateChange }: DayNavigatorProps) {
  const today = isToday(date)
  const isFuture = date > toISODate(new Date())

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card rounded-2xl shadow-sm border border-border">
      {/* Left arrow */}
      <button
        onClick={() => onDateChange(addDays(date, -1))}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all"
        aria-label="Dia anterior"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      {/* Center date */}
      <div className="flex flex-col items-center gap-0.5 min-w-0">
        {today ? (
          <>
            <span className="text-lg font-bold text-foreground">Hoje</span>
            <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
          </>
        ) : (
          <>
            <span className="text-lg font-bold text-foreground">{formatWeekday(date)}</span>
            <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
          </>
        )}
      </div>

      {/* Right side: arrow or "Hoje" button */}
      <div className="flex items-center gap-1">
        {!today && (
          <button
            onClick={() => onDateChange(toISODate(new Date()))}
            className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full hover:bg-primary/20 active:scale-95 transition-all mr-1"
          >
            Hoje
          </button>
        )}
        <button
          onClick={() => onDateChange(addDays(date, 1))}
          disabled={isFuture}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Pr&oacute;ximo dia"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </div>
  )
}
