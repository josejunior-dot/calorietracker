"use client"

import { useEffect, useState, useCallback } from "react"
import { MetricsDisplay } from "@/components/perfil/MetricsDisplay"
import { WeightInput } from "@/components/perfil/WeightInput"
import { WeightChart } from "@/components/perfil/WeightChart"
import { ProfileForm } from "@/components/perfil/ProfileForm"
import { ChevronRight, Moon, Sun, Pencil, X } from "lucide-react"
import Link from "next/link"

type UserProfile = {
  id: string
  name: string
  gender: string
  birthDate: string
  height: number
  weight: number
  bodyFatPercent?: number | null
  activityLevel: string
  goal: string
  goalKgPerWeek: number
  bmr: number
  tdee: number
  dailyTarget: number
}

type WeightEntry = {
  id: string
  date: string
  weight: number
}

export default function PerfilPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Detect initial theme
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/perfil")
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch {
      // silent
    }
  }, [])

  const fetchWeight = useCallback(async () => {
    try {
      const res = await fetch("/api/peso?limit=30")
      if (res.ok) {
        const data = await res.json()
        setWeightHistory(data)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchProfile(), fetchWeight()]).finally(() => setLoading(false))
  }, [fetchProfile, fetchWeight])

  const handleWeightSaved = () => {
    fetchWeight()
    fetchProfile()
  }

  const handleProfileSaved = () => {
    fetchProfile()
    setShowForm(false)
  }

  // Get initials for avatar
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4">
        <p className="text-muted-foreground">Perfil não encontrado.</p>
        <Link
          href="/onboarding"
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm"
        >
          Configurar Perfil
        </Link>
      </div>
    )
  }

  // Goal weight heuristic: not stored, but we can skip if maintain
  const goalWeight =
    user.goal === "lose"
      ? Math.round((user.weight - 5) * 10) / 10
      : user.goal === "gain"
        ? Math.round((user.weight + 3) * 10) / 10
        : undefined

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24 max-w-lg mx-auto">
      {/* Header: Avatar + Name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-primary">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">
            {user.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {user.height} cm &middot; {user.weight} kg
          </p>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
          aria-label="Alternar tema"
        >
          {isDark ? (
            <Sun className="w-4.5 h-4.5 text-yellow-500" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-foreground" />
          )}
        </button>
      </div>

      {/* Metrics */}
      <MetricsDisplay bmr={user.bmr} tdee={user.tdee} dailyTarget={user.dailyTarget} />

      {/* Weight Input */}
      <WeightInput currentWeight={user.weight} onSave={handleWeightSaved} />

      {/* Weight Chart */}
      <div>
        <WeightChart
          data={weightHistory.map((w) => ({ date: w.date, weight: w.weight }))}
          goalWeight={goalWeight}
        />
        {weightHistory.length > 0 && (
          <Link
            href="/perfil/peso"
            className="flex items-center justify-center gap-1 mt-2 text-xs text-primary font-medium hover:underline"
          >
            Ver histórico completo
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Edit Profile toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
          Editar Perfil
        </button>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Editar Perfil</h2>
            <button
              onClick={() => setShowForm(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <ProfileForm user={user} onSave={handleProfileSaved} />
        </div>
      )}
    </div>
  )
}
