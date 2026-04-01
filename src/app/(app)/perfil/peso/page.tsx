"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { WeightChart } from "@/components/perfil/WeightChart"
import { WeightInput } from "@/components/perfil/WeightInput"
import { ArrowLeft, Trash2, Scale } from "lucide-react"
import { toast } from "sonner"
import { formatDateShort } from "@/lib/date"

type WeightEntry = {
  id: string
  date: string
  weight: number
}

export default function PesoPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [currentWeight, setCurrentWeight] = useState(70)
  const [loading, setLoading] = useState(true)

  const fetchWeight = useCallback(async () => {
    try {
      const res = await fetch("/api/peso?limit=365")
      if (res.ok) {
        const data: WeightEntry[] = await res.json()
        setEntries(data)
        if (data.length > 0) {
          // data comes sorted desc from API
          setCurrentWeight(data[0].weight)
        }
      }
    } catch {
      toast.error("Erro ao carregar histórico")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeight()
  }, [fetchWeight])

  const handleWeightSaved = (weight: number) => {
    setCurrentWeight(weight)
    fetchWeight()
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/peso/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Registro removido")
        fetchWeight()
      } else {
        toast.error("Erro ao remover registro")
      }
    } catch {
      toast.error("Erro ao remover registro")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">
          Histórico de Peso
        </h1>
      </div>

      {/* Weight Input */}
      <WeightInput currentWeight={currentWeight} onSave={handleWeightSaved} />

      {/* Chart */}
      <WeightChart
        data={entries.map((w) => ({ date: w.date, weight: w.weight }))}
      />

      {/* Entries list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground px-1">
          Registros
        </h2>

        {entries.length > 0 ? (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
            >
              <div className="w-9 h-9 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-green-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {entry.weight.toFixed(1)} kg
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(entry.date)}
                </p>
              </div>

              <button
                onClick={() => handleDelete(entry.id)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"
                aria-label="Remover registro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="py-10 text-center">
            <div className="w-14 h-14 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
              <Scale className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum registro de peso
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
