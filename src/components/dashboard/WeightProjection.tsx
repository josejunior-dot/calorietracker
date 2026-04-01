"use client"

import { useEffect, useState } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import type { WeightProjection as WeightProjectionType } from "@/lib/projection"

type ProjectionData = {
  user: {
    currentWeight: number
    goalWeight: number | null
    tdee: number
    dailyCalTarget: number
  }
  basedOnTarget: WeightProjectionType
  basedOnActual: WeightProjectionType | null
  avgDailyConsumed: number
  avgDailyBurned: number
  insight: string
}

function ProjectionSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 shadow-sm border border-border/50 animate-pulse">
      <div className="h-5 w-40 rounded bg-muted/60 mb-4" />
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-20 rounded bg-muted/60" />
        <div className="h-4 w-16 rounded bg-muted/60" />
        <div className="h-10 w-20 rounded bg-muted/60" />
      </div>
      <div className="h-[180px] w-full rounded bg-muted/60 mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded bg-muted/60" />
        ))}
      </div>
      <div className="h-4 w-full rounded bg-muted/60" />
    </div>
  )
}

export function WeightProjection() {
  const [data, setData] = useState<ProjectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjection() {
      try {
        const res = await fetch("/api/projecao?weeks=12")
        if (!res.ok) throw new Error("Erro ao carregar projecao")
        const json: ProjectionData = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }
    fetchProjection()
  }, [])

  if (loading) return <ProjectionSkeleton />

  if (error || !data) {
    return (
      <div className="rounded-xl bg-card p-4 shadow-sm border border-border/50">
        <p className="text-sm text-muted-foreground">
          {error ?? "Sem dados de projecao"}
        </p>
      </div>
    )
  }

  const { user, basedOnTarget, basedOnActual, insight } = data
  const projection = basedOnActual ?? basedOnTarget
  const finalWeight = projection.projectedWeight

  // Preparar dados do grafico
  const chartData = basedOnTarget.weeks.map((week, i) => ({
    name: `S${week.week}`,
    meta: week.projectedWeight,
    atual: basedOnActual?.weeks[i]?.projectedWeight ?? undefined,
  }))

  // Inserir ponto inicial (semana 0)
  chartData.unshift({
    name: "Hoje",
    meta: user.currentWeight,
    atual: basedOnActual ? user.currentWeight : undefined,
  })

  // Calcular dominio Y com margem
  const allWeights = chartData.flatMap((d) =>
    [d.meta, d.atual].filter((v): v is number => v !== undefined)
  )
  const minWeight = Math.floor(Math.min(...allWeights) - 1)
  const maxWeight = Math.ceil(Math.max(...allWeights) + 1)

  const isLosing = projection.dailyDeficit > 0

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm border border-border/50">
      {/* Titulo */}
      <h2 className="text-base font-semibold text-foreground mb-3">
        Projecao de Peso
      </h2>

      {/* Peso atual -> Peso projetado */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">
            {user.currentWeight.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground ml-0.5">
              kg
            </span>
          </p>
          <p className="text-xs text-muted-foreground">Atual</p>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
          <span className="text-xs">
            {basedOnTarget.totalWeeks} sem.
          </span>
        </div>

        <div className="text-center">
          <p
            className={`text-2xl font-bold ${
              isLosing ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
            }`}
          >
            {finalWeight.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground ml-0.5">
              kg
            </span>
          </p>
          <p className="text-xs text-muted-foreground">Projetado</p>
        </div>
      </div>

      {/* Grafico */}
      <div className="h-[180px] w-full my-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isLosing ? "#10b981" : "#6366f1"}
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor={isLosing ? "#10b981" : "#6366f1"}
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              domain={[minWeight, maxWeight]}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}kg`}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [
                `${Number(value ?? 0).toFixed(1)}kg`,
                name === "meta" ? "Meta" : "Ritmo atual",
              ]}
            />

            {/* Linha da meta (tracejada) */}
            <Area
              type="monotone"
              dataKey="meta"
              stroke={isLosing ? "#10b981" : "#6366f1"}
              strokeWidth={2}
              strokeDasharray={basedOnActual ? "6 3" : undefined}
              fill="url(#colorMeta)"
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* Linha do ritmo atual (solida) */}
            {basedOnActual && (
              <Area
                type="monotone"
                dataKey="atual"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#colorAtual)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda se tem duas linhas */}
      {basedOnActual && (
        <div className="flex items-center justify-center gap-4 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-4 h-0.5 border-t-2 border-dashed"
              style={{ borderColor: isLosing ? "#10b981" : "#6366f1" }}
            />
            Meta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-amber-500" />
            Ritmo atual
          </span>
        </div>
      )}

      {/* Metricas */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-lg bg-muted/40 p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Deficit diario</p>
          <p className="text-sm font-semibold text-foreground">
            {Math.abs(projection.dailyDeficit)} kcal
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Perda semanal</p>
          <p className="text-sm font-semibold text-foreground">
            {(Math.abs(projection.weeklyLoss) * 1000).toFixed(0)}g
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Tempo p/ meta</p>
          <p className="text-sm font-semibold text-foreground">
            {user.goalWeight
              ? `${Math.ceil(
                  Math.abs(user.currentWeight - user.goalWeight) /
                    (Math.abs(projection.weeklyLoss) || 0.01)
                )} sem.`
              : "--"}
          </p>
        </div>
      </div>

      {/* Insight */}
      <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
    </div>
  )
}
