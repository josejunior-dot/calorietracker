"use client"

import { useState } from "react"
import { Scale, Minus, Plus } from "lucide-react"
import { toISODate } from "@/lib/date"
import { toast } from "sonner"

type WeightInputProps = {
  currentWeight: number
  onSave: (weight: number) => void
}

export function WeightInput({ currentWeight, onSave }: WeightInputProps) {
  const [weight, setWeight] = useState(currentWeight)
  const [loading, setLoading] = useState(false)

  const adjust = (delta: number) => {
    setWeight((prev) => Math.max(20, Math.round((prev + delta) * 10) / 10))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const today = toISODate(new Date())
      const res = await fetch("/api/peso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, weight }),
      })

      if (res.ok) {
        toast.success("Peso registrado!")
        onSave(weight)
      } else {
        toast.error("Erro ao registrar peso")
      }
    } catch {
      toast.error("Erro ao registrar peso")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Scale className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Registrar Peso de Hoje
        </h3>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => adjust(-0.1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 active:scale-95 transition-all"
          aria-label="Diminuir 0.1 kg"
        >
          <Minus className="w-4 h-4 text-foreground" />
        </button>

        <div className="text-center">
          <input
            type="number"
            step="0.1"
            min="20"
            max="300"
            value={weight}
            onChange={(e) => setWeight(Math.max(20, Number(e.target.value) || 20))}
            className="w-24 text-center text-3xl font-bold text-foreground bg-transparent border-b-2 border-primary/30 focus:border-primary focus:outline-none transition-colors tabular-nums"
          />
          <p className="text-xs text-muted-foreground mt-1">kg</p>
        </div>

        <button
          onClick={() => adjust(0.1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 active:scale-95 transition-all"
          aria-label="Aumentar 0.1 kg"
        >
          <Plus className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : (
          "Registrar Peso"
        )}
      </button>
    </div>
  )
}
