import { z } from 'zod'

// User profile schema for onboarding
export const userProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  gender: z.enum(['masculino', 'feminino']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  height: z.number().min(100, 'Altura mínima: 100cm').max(250, 'Altura máxima: 250cm'),
  weight: z.number().min(30, 'Peso mínimo: 30kg').max(300, 'Peso máximo: 300kg'),
  bodyFatPercent: z.number().min(3).max(60).optional(),
  activityLevel: z.enum(['sedentario', 'leve', 'moderado', 'ativo', 'muito_ativo']),
  goal: z.enum(['perder', 'manter', 'ganhar']),
  goalKgPerWeek: z.number().min(0.25).max(1.5).default(0.5),
})
export type UserProfile = z.infer<typeof userProfileSchema>

// Meal entry schema
export const mealEntrySchema = z.object({
  foodId: z.string(),
  date: z.string(),
  mealType: z.enum(['cafe_da_manha', 'almoco', 'jantar', 'lanche']),
  servings: z.number().min(0.1).max(20).default(1),
})
export type MealEntryInput = z.infer<typeof mealEntrySchema>

// Exercise entry schema
export const exerciseEntrySchema = z.object({
  exerciseId: z.string(),
  date: z.string(),
  durationMin: z.number().min(1).max(480),
})
export type ExerciseEntryInput = z.infer<typeof exerciseEntrySchema>

// Weight log schema
export const weightLogSchema = z.object({
  date: z.string(),
  weight: z.number().min(30).max(300),
  bodyFatPercent: z.number().min(3).max(60).optional(),
  note: z.string().max(200).optional(),
})
export type WeightLogInput = z.infer<typeof weightLogSchema>

// Dashboard response type
export type DashboardData = {
  user: { name: string; dailyCalTarget: number }
  date: string
  calories: { target: number; consumed: number; burned: number; remaining: number }
  macros: {
    protein: number
    carbs: number
    fat: number
    proteinTarget: number
    carbsTarget: number
    fatTarget: number
  }
  meals: { type: string; label: string; totalCalories: number; itemCount: number }[]
  streak: { current: number; longest: number }
}
