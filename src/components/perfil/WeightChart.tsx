"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts"
import { Scale } from "lucide-react"

type WeightChartProps = {
  data: { date: string; weight: number }[]
  goalWeight?: number
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

export function WeightChart({ data, goalWeight }: WeightChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center">
        <div className="w-14 h-14 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
          <Scale className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhum registro de peso ainda
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Registre seu peso para acompanhar a evolução
        </p>
      </div>
    )
  }

  // Sort ascending by date for the chart
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
  const chartData = sorted.map((d) => ({
    ...d,
    label: formatShortDate(d.date),
  }))

  // Calculate Y axis domain with some padding
  const weights = sorted.map((d) => d.weight)
  const allValues = goalWeight ? [...weights, goalWeight] : weights
  const minW = Math.min(...allValues)
  const maxW = Math.max(...allValues)
  const padding = Math.max((maxW - minW) * 0.15, 1)

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 px-1">
        Evolução do Peso
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" opacity={0.5} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #9ca3af)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[Math.floor(minW - padding), Math.ceil(maxW + padding)]}
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #9ca3af)" }}
            tickLine={false}
            axisLine={false}
            unit="kg"
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card, #fff)",
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: "12px",
              fontSize: "12px",
              padding: "8px 12px",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${Number(value).toFixed(1)} kg`, "Peso"]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            labelFormatter={(label: any) => String(label)}
          />
          {goalWeight && (
            <ReferenceLine
              y={goalWeight}
              stroke="#f59e0b"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Meta: ${goalWeight}kg`,
                position: "insideTopRight",
                fontSize: 10,
                fill: "#f59e0b",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
