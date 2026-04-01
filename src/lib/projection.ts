/**
 * Weight Projection Calculation Service
 * Calcula projecoes de peso baseadas em deficit/superavit calorico
 */

import { calculateBMR, calculateTDEE } from '@/lib/bmr'
import { toISODate } from '@/lib/date'

const KCAL_PER_KG_FAT = 7700

export type WeightProjection = {
  weeks: ProjectionWeek[]
  totalWeeks: number
  projectedLoss: number // kg (negativo = perda, positivo = ganho)
  projectedWeight: number // kg ao final
  dailyDeficit: number // kcal
  weeklyLoss: number // kg por semana
}

export type ProjectionWeek = {
  week: number
  date: string // ISO date
  projectedWeight: number
  cumulativeLoss: number
  dailyCalories: number
}

/**
 * Calcula projecao de peso ao longo de N semanas
 * Considera TDEE adaptativo: recalcula a cada 4 semanas com peso atualizado (Mifflin-St Jeor)
 */
export function calculateProjection(params: {
  currentWeight: number
  goalWeight?: number
  dailyCalTarget: number
  tdee: number
  weeks?: number
  height?: number
  age?: number
  gender?: string
  activityLevel?: string
}): WeightProjection {
  const {
    currentWeight,
    goalWeight,
    dailyCalTarget,
    tdee,
    weeks: totalWeeks = 12,
    height,
    age,
    gender,
    activityLevel,
  } = params

  const canAdapt = height !== undefined && age !== undefined && gender !== undefined && activityLevel !== undefined

  const projectionWeeks: ProjectionWeek[] = []
  let weight = currentWeight
  let currentTDEE = tdee

  for (let w = 1; w <= totalWeeks; w++) {
    // Recalcula TDEE a cada 4 semanas (adaptativo)
    if (canAdapt && w > 1 && (w - 1) % 4 === 0) {
      const bmr = calculateBMR(weight, height!, age!, gender!)
      currentTDEE = calculateTDEE(bmr, activityLevel!)
    }

    const dailyDeficit = currentTDEE - dailyCalTarget
    const weeklyLoss = (dailyDeficit * 7) / KCAL_PER_KG_FAT
    weight = weight - weeklyLoss

    // Se tem meta, nao projeta alem dela
    if (goalWeight !== undefined) {
      if (dailyDeficit > 0 && weight < goalWeight) {
        weight = goalWeight
      } else if (dailyDeficit < 0 && weight > goalWeight) {
        weight = goalWeight
      }
    }

    const weekDate = new Date()
    weekDate.setDate(weekDate.getDate() + w * 7)

    projectionWeeks.push({
      week: w,
      date: toISODate(weekDate),
      projectedWeight: Math.round(weight * 10) / 10,
      cumulativeLoss: Math.round((currentWeight - weight) * 10) / 10,
      dailyCalories: dailyCalTarget,
    })
  }

  const finalWeight = projectionWeeks[projectionWeeks.length - 1]?.projectedWeight ?? currentWeight
  const overallDailyDeficit = tdee - dailyCalTarget
  const overallWeeklyLoss = (overallDailyDeficit * 7) / KCAL_PER_KG_FAT

  return {
    weeks: projectionWeeks,
    totalWeeks,
    projectedLoss: Math.round((finalWeight - currentWeight) * 10) / 10,
    projectedWeight: finalWeight,
    dailyDeficit: Math.round(overallDailyDeficit),
    weeklyLoss: Math.round(overallWeeklyLoss * 100) / 100,
  }
}

/**
 * Calcula quantas semanas faltam para atingir o peso meta
 */
export function weeksToGoal(params: {
  currentWeight: number
  goalWeight: number
  dailyDeficit: number
}): number {
  const { currentWeight, goalWeight, dailyDeficit } = params

  if (dailyDeficit === 0) return Infinity

  const totalKgToLose = currentWeight - goalWeight
  const weeklyLoss = (dailyDeficit * 7) / KCAL_PER_KG_FAT

  if (weeklyLoss === 0) return Infinity

  // Se o deficit esta na direcao errada
  if ((totalKgToLose > 0 && weeklyLoss < 0) || (totalKgToLose < 0 && weeklyLoss > 0)) {
    return Infinity
  }

  return Math.ceil(Math.abs(totalKgToLose / weeklyLoss))
}

/**
 * Calcula deficit diario baseado em consumo, exercicio e TDEE
 */
export function calculateDailyDeficit(
  consumed: number,
  burned: number,
  tdee: number
): number {
  // Deficit = TDEE + exercicio queimado - calorias consumidas
  return Math.round(tdee + burned - consumed)
}

/**
 * Formata resumo da projecao em pt-BR
 */
export function formatProjectionSummary(projection: WeightProjection): string {
  const { projectedLoss, totalWeeks, projectedWeight, weeklyLoss } = projection

  if (Math.abs(projectedLoss) < 0.1) {
    return `Voce devera manter seu peso em torno de ${projectedWeight}kg nas proximas ${totalWeeks} semanas.`
  }

  const direction = projectedLoss < 0 ? 'perder' : 'ganhar'
  const absLoss = Math.abs(projectedLoss)
  const absWeekly = Math.abs(weeklyLoss)

  return `No ritmo atual, voce devera ${direction} ${absLoss.toFixed(1)}kg em ${totalWeeks} semanas (${absWeekly.toFixed(2)}kg/semana), chegando a ${projectedWeight}kg.`
}
