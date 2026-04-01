"use client"

import { useState } from "react"
import { toast } from "sonner"

type UserData = {
  name: string
  gender: string
  birthDate: string
  height: number
  weight: number
  bodyFatPercent?: number | null
  activityLevel: string
  goal: string
  goalKgPerWeek: number
}

type ProfileFormProps = {
  user: UserData
  onSave: (data: UserData) => void
}

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentário — pouco ou nenhum exercício" },
  { value: "light", label: "Levemente ativo — 1 a 3x/semana" },
  { value: "moderate", label: "Moderadamente ativo — 3 a 5x/semana" },
  { value: "active", label: "Muito ativo — 6 a 7x/semana" },
  { value: "extra", label: "Extremamente ativo — atleta" },
]

const GOALS = [
  { value: "lose", label: "Perder peso" },
  { value: "maintain", label: "Manter peso" },
  { value: "gain", label: "Ganhar peso" },
]

const GOAL_RATES = [
  { value: 0.25, label: "0.25 kg/sem — leve" },
  { value: 0.5, label: "0.5 kg/sem — moderado" },
  { value: 0.75, label: "0.75 kg/sem — acelerado" },
  { value: 1.0, label: "1.0 kg/sem — intenso" },
]

export function ProfileForm({ user, onSave }: ProfileFormProps) {
  const [form, setForm] = useState<UserData>({
    ...user,
    birthDate: typeof user.birthDate === "string" && user.birthDate.includes("T")
      ? user.birthDate.split("T")[0]
      : user.birthDate,
  })
  const [loading, setLoading] = useState(false)

  const update = <K extends keyof UserData>(key: K, value: UserData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        toast.success("Perfil atualizado!")
        const data = await res.json()
        onSave(data)
      } else {
        const err = await res.json()
        toast.error(err.error || "Erro ao salvar perfil")
      }
    } catch {
      toast.error("Erro ao salvar perfil")
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados Pessoais */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">
          Dados Pessoais
        </h3>

        <div>
          <label className={labelClass}>Nome</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Sexo</label>
            <select
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
              className={inputClass}
            >
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Data de Nascimento</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => update("birthDate", e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>
      </section>

      {/* Medidas */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">
          Medidas
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Altura (cm)</label>
            <input
              type="number"
              min={100}
              max={250}
              value={form.height}
              onChange={(e) => update("height", Number(e.target.value))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Peso (kg)</label>
            <input
              type="number"
              min={30}
              max={300}
              step="0.1"
              value={form.weight}
              onChange={(e) => update("weight", Number(e.target.value))}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Gordura Corporal (%) — opcional</label>
          <input
            type="number"
            min={3}
            max={60}
            step="0.1"
            value={form.bodyFatPercent ?? ""}
            onChange={(e) =>
              update("bodyFatPercent", e.target.value ? Number(e.target.value) : null)
            }
            className={inputClass}
            placeholder="Ex: 20"
          />
        </div>
      </section>

      {/* Atividade e Objetivo */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">
          Atividade e Objetivo
        </h3>

        <div>
          <label className={labelClass}>Nível de Atividade</label>
          <select
            value={form.activityLevel}
            onChange={(e) => update("activityLevel", e.target.value)}
            className={inputClass}
          >
            {ACTIVITY_LEVELS.map((al) => (
              <option key={al.value} value={al.value}>
                {al.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Objetivo</label>
            <select
              value={form.goal}
              onChange={(e) => update("goal", e.target.value)}
              className={inputClass}
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Ritmo</label>
            <select
              value={form.goalKgPerWeek}
              onChange={(e) => update("goalKgPerWeek", Number(e.target.value))}
              className={inputClass}
              disabled={form.goal === "maintain"}
            >
              {GOAL_RATES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : (
          "Salvar Alterações"
        )}
      </button>
    </form>
  )
}
