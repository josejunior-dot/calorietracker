"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FoodSearch } from "@/components/alimentos/FoodSearch"
import { PortionSelector } from "@/components/alimentos/PortionSelector"
import { Utensils, Dumbbell, ArrowLeft } from "lucide-react"
import { toISODate } from "@/lib/date"
import { MEAL_TYPES } from "@/lib/constants"

type Food = {
  id: string
  name: string
  brand: string | null
  category: string
  servingSize: number
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sodium?: number
  noomColor: string
}

const TABS = [
  { key: "alimento", label: "Alimento", icon: Utensils },
  { key: "exercicio", label: "Exercício", icon: Dumbbell },
] as const

function AdicionarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialTab = searchParams.get("tab") === "exercicio" ? "exercicio" : "alimento"
  const initialMeal = searchParams.get("meal") || ""
  const dateParam = searchParams.get("date") || toISODate(new Date())

  const [activeTab, setActiveTab] = useState<"alimento" | "exercicio">(initialTab)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [mealType, setMealType] = useState(initialMeal)
  const [showMealPicker, setShowMealPicker] = useState(!initialMeal)

  const handleFoodSelect = (food: Food) => {
    if (!mealType) {
      setSelectedFood(food)
      setShowMealPicker(true)
      return
    }
    setSelectedFood(food)
  }

  const handleMealSelect = (type: string) => {
    setMealType(type)
    setShowMealPicker(false)
  }

  const handlePortionConfirm = () => {
    setSelectedFood(null)
    // Stay on page to add more
  }

  const handlePortionCancel = () => {
    setSelectedFood(null)
  }

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Adicionar</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mx-4 mb-3 p-1 bg-muted rounded-xl">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Selected meal indicator */}
      {mealType && activeTab === "alimento" && (
        <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/10 rounded-xl">
          <span className="text-sm">
            {MEAL_TYPES.find((m) => m.key === mealType)?.emoji}
          </span>
          <span className="text-xs font-medium text-foreground flex-1">
            {MEAL_TYPES.find((m) => m.key === mealType)?.label}
          </span>
          <button
            onClick={() => { setMealType(""); setShowMealPicker(true) }}
            className="text-xs text-primary font-medium hover:underline"
          >
            Alterar
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-4 pb-24">
        {activeTab === "alimento" ? (
          <>
            {/* Meal picker modal */}
            {showMealPicker && !mealType && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Selecione a refeição
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_TYPES.map((meal) => (
                    <button
                      key={meal.key}
                      onClick={() => handleMealSelect(meal.key)}
                      className="flex items-center gap-3 px-4 py-3.5 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97] transition-all"
                    >
                      <span className="text-xl">{meal.emoji}</span>
                      <span className="text-sm font-medium text-foreground">
                        {meal.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Food search */}
            {(mealType || !showMealPicker) && (
              <FoodSearch onSelect={handleFoodSelect} />
            )}
          </>
        ) : (
          /* Exercise tab placeholder */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Dumbbell className="w-9 h-9 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Exercícios
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Em breve...
            </p>
          </div>
        )}
      </div>

      {/* Portion selector sheet */}
      {selectedFood && mealType && (
        <PortionSelector
          food={selectedFood}
          mealType={mealType}
          date={dateParam}
          onConfirm={handlePortionConfirm}
          onCancel={handlePortionCancel}
        />
      )}
    </div>
  )
}

export default function AdicionarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdicionarContent />
    </Suspense>
  )
}
