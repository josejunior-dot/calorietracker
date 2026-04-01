/**
 * BMR/TDEE Calculation Service
 * Formulas: Mifflin-St Jeor and Katch-McArdle
 */

// Mifflin-St Jeor formula
export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === 'masculino') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  }
  return 10 * weight + 6.25 * height - 5 * age - 161
}

// Katch-McArdle formula (when body fat % available)
export function calculateBMRKatch(weight: number, bodyFatPercent: number): number {
  const leanMass = weight * (1 - bodyFatPercent / 100)
  return 370 + 21.6 * leanMass
}

// Auto-select best formula
export function calculateBestBMR(
  weight: number,
  height: number,
  age: number,
  gender: string,
  bodyFatPercent?: number
): number {
  if (bodyFatPercent !== undefined) {
    return calculateBMRKatch(weight, bodyFatPercent)
  }
  return calculateBMR(weight, height, age, gender)
}

// Activity multipliers
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  ativo: 1.725,
  muito_ativo: 1.9,
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2
  return Math.round(bmr * multiplier)
}

// Daily target: TDEE adjusted for goal
// 1kg fat ≈ 7700 kcal
export function calculateDailyTarget(tdee: number, goal: string, goalKgPerWeek: number): number {
  const dailyAdjustment = (goalKgPerWeek * 7700) / 7

  let target: number

  switch (goal) {
    case 'perder':
      target = tdee - dailyAdjustment
      break
    case 'ganhar':
      target = tdee + dailyAdjustment
      break
    case 'manter':
    default:
      target = tdee
      break
  }

  // Minimum daily target: 1200 kcal
  return Math.round(Math.max(target, 1200))
}

// Calculate age from birth date
export function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Calculate all metrics at once
export function calculateAllMetrics(user: {
  weight: number
  height: number
  birthDate: Date
  gender: string
  activityLevel: string
  goal: string
  goalKgPerWeek: number
  bodyFatPercent?: number
}): { bmr: number; tdee: number; dailyTarget: number; age: number } {
  const age = calculateAge(user.birthDate)
  const bmr = calculateBestBMR(user.weight, user.height, age, user.gender, user.bodyFatPercent)
  const tdee = calculateTDEE(bmr, user.activityLevel)
  const dailyTarget = calculateDailyTarget(tdee, user.goal, user.goalKgPerWeek)

  return {
    bmr: Math.round(bmr),
    tdee,
    dailyTarget,
    age,
  }
}
