// ============================================================
// Diet Builder — Montador de Dieta com Ciencia Nutricional Real
// Calculo baseado em g/kg para proteina, gramas absolutas para
// carboidratos e gordura como variavel de fechamento calorico.
// ============================================================

// ==================== TIPOS ====================

export type NutritionStrategy =
  | 'equilibrado'
  | 'high_protein'
  | 'low_carb'
  | 'cetogenica'
  | 'high_carb'

export type UserContext = {
  weight: number          // kg
  height: number          // cm
  age: number
  gender: string          // masculino | feminino
  activityLevel: string   // sedentario | leve | moderado | ativo | muito_ativo
  goal: string            // perder | manter | ganhar
  bodyFatPercent?: number
  dailyCalTarget: number
  tdee: number
}

export type MacroTargets = {
  protein: number         // g/dia
  proteinPerKg: number    // g/kg utilizado
  carbs: number           // g/dia
  fat: number             // g/dia
  calories: number        // kcal/dia (pode divergir levemente do target por arredondamento)
  strategy: NutritionStrategy
  warnings: string[]      // avisos de coerencia
  explanation: string     // texto pt-BR explicando o racional
}

export type MealPlan = {
  date: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  meals: PlannedMeal[]
}

export type PlannedMeal = {
  mealType: 'cafe_da_manha' | 'almoco' | 'jantar' | 'lanche'
  label: string
  items: PlannedItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export type PlannedItem = {
  foodId: string
  name: string
  servings: number
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  noomColor: string
}

export type DietPreferences = {
  dailyCalTarget: number
  proteinTarget: number // g
  carbsTarget: number // g
  fatTarget: number // g
  goal: 'perder' | 'manter' | 'ganhar'
  excludeFoodIds?: string[]
  preferHighProtein?: boolean
}

type FoodRow = {
  id: string
  name: string
  category: string
  servingSize: number
  servingLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  noomColor: string
  isCustom: boolean
}

export type FixedFoodEntry = {
  foodId: string
  mealType: string
  servings: number
  food: {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    servingLabel: string
    noomColor: string
    servingSize: number
    category: string
  }
}

// ==================== TABELAS DE PROTEINA (g/kg) ====================

const PROTEIN_TABLE: Record<NutritionStrategy, Record<string, number>> = {
  equilibrado:  { perder: 1.6, manter: 1.2, ganhar: 1.8 },
  high_protein: { perder: 2.0, manter: 1.8, ganhar: 2.2 },
  low_carb:     { perder: 1.8, manter: 1.4, ganhar: 2.0 }, // equilibrado + 0.2
  cetogenica:   { perder: 1.8, manter: 1.5, ganhar: 2.0 },
  high_carb:    { perder: 1.2, manter: 1.0, ganhar: 1.4 },
}

// ==================== CALCULO DE MACROS ====================

export function calculateMacroTargets(
  user: UserContext,
  strategy: NutritionStrategy,
  customOverrides?: { proteinPerKg?: number; carbsGrams?: number }
): MacroTargets {
  const warnings: string[] = []
  const { weight, goal, activityLevel, bodyFatPercent, dailyCalTarget } = user

  // --- 1. Peso de referencia para proteina ---
  let refWeight = weight
  if (bodyFatPercent != null && bodyFatPercent > 30) {
    // Usar massa magra estimada
    refWeight = weight * (1 - bodyFatPercent / 100)
  }

  // --- 2. Proteina (g/kg) ---
  let proteinPerKg = PROTEIN_TABLE[strategy]?.[goal] ?? 1.4

  // Bonus para atividade intensa em high_protein
  if (strategy === 'high_protein' && (activityLevel === 'ativo' || activityLevel === 'muito_ativo')) {
    proteinPerKg += 0.2
  }

  // Override manual
  if (customOverrides?.proteinPerKg != null) {
    proteinPerKg = customOverrides.proteinPerKg
  }

  const proteinGrams = Math.round(proteinPerKg * refWeight)
  const proteinCals = proteinGrams * 4

  // --- 3. Carboidratos ---
  let carbsGrams: number

  if (customOverrides?.carbsGrams != null) {
    carbsGrams = customOverrides.carbsGrams
  } else {
    const remainingAfterProtein = dailyCalTarget - proteinCals

    switch (strategy) {
      case 'cetogenica': {
        // Hard limit: 20-50g (usar 30g como padrao)
        carbsGrams = 30
        break
      }
      case 'low_carb': {
        // Max 100-130g independente das calorias
        const calcCarbs = Math.round((remainingAfterProtein * 0.40) / 4)
        carbsGrams = Math.min(130, Math.max(100, calcCarbs))
        break
      }
      case 'high_carb': {
        carbsGrams = Math.round((remainingAfterProtein * 0.60) / 4)
        // Minimo 250g para ganho
        if (goal === 'ganhar' && carbsGrams < 250) {
          carbsGrams = 250
        }
        break
      }
      case 'high_protein': {
        carbsGrams = Math.round((remainingAfterProtein * 0.45) / 4)
        break
      }
      default: {
        // equilibrado
        carbsGrams = Math.round((remainingAfterProtein * 0.55) / 4)
        break
      }
    }
  }

  const carbsCals = carbsGrams * 4

  // --- 4. Gordura (variavel de fechamento) ---
  let fatGrams = Math.round((dailyCalTarget - proteinCals - carbsCals) / 9)
  const minFat = Math.round(0.8 * refWeight)

  // Se gordura ficou abaixo do minimo essencial, reduzir carbs
  if (fatGrams < minFat) {
    const deficit = (minFat - fatGrams) * 9 // calorias que faltam
    const carbsReduction = Math.ceil(deficit / 4)
    carbsGrams = Math.max(strategy === 'cetogenica' ? 20 : 50, carbsGrams - carbsReduction)
    fatGrams = Math.round((dailyCalTarget - proteinGrams * 4 - carbsGrams * 4) / 9)

    // Se ainda insuficiente, forcar o minimo
    if (fatGrams < minFat) {
      fatGrams = minFat
    }
  }

  // Garantir que fat nao seja negativo
  if (fatGrams < 0) fatGrams = minFat

  const actualCalories = proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9

  // --- 5. Validacoes ---
  if (proteinPerKg < 1.0 && goal === 'ganhar') {
    warnings.push('Proteina muito baixa para ganho muscular')
  }
  if (proteinPerKg > 2.5) {
    warnings.push('Proteina muito alta, considere reduzir')
  }
  if (fatGrams / refWeight < 0.6) {
    warnings.push('Gordura muito baixa, pode afetar hormonios')
  }
  if (carbsGrams < 50 && strategy !== 'cetogenica') {
    warnings.push('Carboidrato muito baixo para esta estrategia')
  }
  if (actualCalories < 1200) {
    warnings.push('Calorias abaixo do minimo seguro (1200 kcal)')
  }
  if (Math.abs(actualCalories - dailyCalTarget) / dailyCalTarget > 0.10) {
    warnings.push('Meta calorica diverge do calculado')
  }

  // --- 6. Explicacao ---
  const explanation = buildExplanation(strategy, goal, proteinPerKg, carbsGrams, fatGrams, refWeight, weight)

  return {
    protein: proteinGrams,
    proteinPerKg: Math.round(proteinPerKg * 100) / 100,
    carbs: carbsGrams,
    fat: fatGrams,
    calories: actualCalories,
    strategy,
    warnings,
    explanation,
  }
}

function buildExplanation(
  strategy: NutritionStrategy,
  goal: string,
  proteinPerKg: number,
  carbsGrams: number,
  fatGrams: number,
  refWeight: number,
  totalWeight: number
): string {
  const parts: string[] = []
  const usedLeanMass = refWeight < totalWeight

  // Proteina
  const goalLabel = goal === 'perder' ? 'emagrecimento' : goal === 'ganhar' ? 'ganho muscular' : 'manutencao'
  const massNote = usedLeanMass ? ' (calculada sobre massa magra estimada)' : ''
  parts.push(`Proteina calculada em ${proteinPerKg.toFixed(1)} g/kg${massNote} para ${goalLabel}.`)

  // Carbs
  switch (strategy) {
    case 'cetogenica':
      parts.push(`Estrategia cetogenica com carboidrato limitado a ${carbsGrams}g/dia.`)
      break
    case 'low_carb':
      parts.push(`Carboidratos controlados em ${carbsGrams}g/dia para favorecer oxidacao de gordura.`)
      break
    case 'high_carb':
      parts.push(`Carboidratos elevados (${carbsGrams}g/dia) para performance e energia.`)
      break
    case 'high_protein':
      parts.push(`Carboidratos moderados (${carbsGrams}g/dia) com foco na proteina.`)
      break
    default:
      parts.push(`Carboidratos equilibrados (${carbsGrams}g/dia) para energia no dia a dia.`)
  }

  // Gordura
  if (strategy === 'cetogenica') {
    parts.push(`Gordura elevada (${fatGrams}g/dia) como principal fonte de energia.`)
  } else {
    parts.push(`Gordura completando a meta calorica com ${fatGrams}g/dia.`)
  }

  return parts.join(' ')
}

// ==================== INFO DA ESTRATEGIA ====================

export function getStrategyInfo(strategy: NutritionStrategy): {
  name: string
  description: string
  proteinRange: string
  carbsRange: string
  suitable: string[]
  caution: string[]
} {
  switch (strategy) {
    case 'equilibrado':
      return {
        name: 'Equilibrado',
        description: 'Distribuicao balanceada seguindo diretrizes nutricionais gerais.',
        proteinRange: '1.2-1.8 g/kg',
        carbsRange: '45-55% das calorias restantes',
        suitable: ['Manutencao de peso', 'Saude geral', 'Iniciantes'],
        caution: ['Pode nao ser otimo para objetivos especificos de performance'],
      }
    case 'high_protein':
      return {
        name: 'Alta Proteina',
        description: 'Proteina elevada para maximizar sintese muscular e saciedade.',
        proteinRange: '1.8-2.4 g/kg',
        carbsRange: '45% das calorias restantes',
        suitable: ['Ganho muscular', 'Emagrecimento com preservacao muscular', 'Definicao'],
        caution: ['Consultar nefrologista se houver historico renal', 'Pode ser mais cara (alimentos proteicos)'],
      }
    case 'low_carb':
      return {
        name: 'Low Carb',
        description: 'Reducao moderada de carboidratos para favorecer queima de gordura.',
        proteinRange: '1.4-2.0 g/kg',
        carbsRange: '100-130g/dia',
        suitable: ['Emagrecimento', 'Resistencia insulinica', 'Controle glicemico'],
        caution: ['Pode reduzir performance em exercicios de alta intensidade', 'Periodo de adaptacao de 1-2 semanas'],
      }
    case 'cetogenica':
      return {
        name: 'Cetogenica',
        description: 'Carboidrato muito baixo para induzir cetose e usar gordura como combustivel.',
        proteinRange: '1.5-2.0 g/kg',
        carbsRange: '20-50g/dia',
        suitable: ['Emagrecimento agressivo', 'Epilepsia', 'Resistencia insulinica severa'],
        caution: [
          'Nao recomendado para diabeticos tipo 1 sem acompanhamento medico',
          'Pode causar "gripe cetogenica" nas primeiras semanas',
          'Dificil de manter a longo prazo',
          'Contraindicado para gestantes e lactantes',
        ],
      }
    case 'high_carb':
      return {
        name: 'Alto Carboidrato',
        description: 'Carboidratos elevados para atletas e alta demanda energetica.',
        proteinRange: '1.0-1.4 g/kg',
        carbsRange: '60% das calorias restantes (min 250g p/ ganho)',
        suitable: ['Atletas de endurance', 'Ganho de peso', 'Alta atividade fisica'],
        caution: ['Nao ideal para sedentarios', 'Monitorar indice glicemico se houver sensibilidade'],
      }
  }
}

// ==================== CONSTANTES DO BUILDER ====================

const MEAL_DISTRIBUTION = {
  cafe_da_manha: 0.25,
  almoco: 0.35,
  jantar: 0.30,
  lanche: 0.10,
} as const

const MEAL_LABELS: Record<string, string> = {
  cafe_da_manha: 'Cafe da Manha',
  almoco: 'Almoco',
  jantar: 'Jantar',
  lanche: 'Lanche',
}

type SlotDef = {
  role: string
  categories: string[]
  optional?: boolean
}

const MEAL_TEMPLATES: Record<string, SlotDef[]> = {
  cafe_da_manha: [
    { role: 'carboidrato', categories: ['paes', 'graos'] },
    { role: 'proteina', categories: ['carnes', 'laticinios'] },
    { role: 'fruta', categories: ['frutas'] },
    { role: 'bebida', categories: ['bebidas', 'laticinios'], optional: true },
  ],
  almoco: [
    { role: 'arroz', categories: ['graos'] },
    { role: 'feijao', categories: ['graos', 'legumes'] },
    { role: 'proteina', categories: ['carnes'] },
    { role: 'salada', categories: ['legumes'] },
    { role: 'salada2', categories: ['legumes'], optional: true },
  ],
  jantar: [
    { role: 'proteina', categories: ['carnes'] },
    { role: 'carboidrato', categories: ['graos', 'paes'] },
    { role: 'legume', categories: ['legumes'] },
  ],
  lanche: [
    { role: 'item', categories: ['frutas', 'laticinios', 'industrializados'] },
  ],
}

// Categorias consideradas "alto carb" para filtragem
const HIGH_CARB_CATEGORIES = new Set(['paes', 'graos', 'frutas'])

// ==================== FUNCOES AUXILIARES ====================

/** Embaralha array in-place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Filtra alimentos por cor Noom de acordo com o objetivo */
function filterByGoal(foods: FoodRow[], goal: string): FoodRow[] {
  if (goal === 'perder') {
    return foods.filter((f) => f.noomColor !== 'orange' || Math.random() < 0.2)
  }
  if (goal === 'ganhar') {
    return foods.sort((a, b) => b.calories - a.calories)
  }
  return foods
}

/** Filtra/prioriza alimentos com base na estrategia nutricional */
function filterByStrategy(foods: FoodRow[], strategy: NutritionStrategy): FoodRow[] {
  switch (strategy) {
    case 'cetogenica': {
      // Excluir alimentos com mais de 15g de carbs por porcao
      return foods.filter((f) => f.carbs <= 15)
    }
    case 'low_carb': {
      // Deprioritizar alimentos alto carb (empurrar pro final)
      return [...foods].sort((a, b) => a.carbs - b.carbs)
    }
    case 'high_protein': {
      // Priorizar alimentos ricos em proteina
      return [...foods].sort((a, b) => {
        const ratioA = a.protein / Math.max(1, a.calories)
        const ratioB = b.protein / Math.max(1, b.calories)
        return ratioB - ratioA
      })
    }
    case 'high_carb': {
      // Priorizar graos, frutas, amidos
      return [...foods].sort((a, b) => {
        const aIsCarb = HIGH_CARB_CATEGORIES.has(a.category) ? 1 : 0
        const bIsCarb = HIGH_CARB_CATEGORIES.has(b.category) ? 1 : 0
        return bIsCarb - aIsCarb
      })
    }
    default:
      return foods
  }
}

/** Ajusta numero de porcoes para atingir meta calorica do slot */
function adjustServings(food: FoodRow, targetCalories: number): number {
  if (food.calories <= 0) return 1
  const raw = targetCalories / food.calories
  const clamped = Math.max(0.5, Math.min(3, raw))
  return Math.round(clamped * 2) / 2
}

/** Converte um FixedFoodEntry em PlannedItem */
function fixedFoodToPlannedItem(entry: FixedFoodEntry): PlannedItem {
  const { food, servings } = entry
  return {
    foodId: food.id,
    name: food.name,
    servings,
    servingLabel: food.servingLabel,
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings * 10) / 10,
    carbs: Math.round(food.carbs * servings * 10) / 10,
    fat: Math.round(food.fat * servings * 10) / 10,
    noomColor: food.noomColor,
  }
}

// ==================== BUILDER PRINCIPAL ====================

export function buildMealPlan(
  foods: FoodRow[],
  macros: MacroTargets,
  dailyCalTarget: number,
  goal: string,
  date: string,
  fixedFoods?: FixedFoodEntry[]
): MealPlan {
  const usedFoodIds = new Set<string>()
  const nonCustomFoods = foods.filter((f) => !f.isCustom)

  // Aplicar filtros: primeiro por objetivo, depois por estrategia
  const goalFiltered = filterByGoal(nonCustomFoods, goal)
  const strategyFiltered = filterByStrategy(goalFiltered, macros.strategy)

  // Indexar alimentos por categoria
  const byCategory = new Map<string, FoodRow[]>()
  for (const f of strategyFiltered) {
    const list = byCategory.get(f.category) || []
    list.push(f)
    byCategory.set(f.category, list)
  }

  // ---------- Pre-popular refeicoes com alimentos fixos ----------
  const fixedByMeal = new Map<string, PlannedItem[]>()
  const fixedCalsByMeal = new Map<string, number>()
  const fixedMacrosByMeal = new Map<string, { protein: number; carbs: number; fat: number }>()
  const qualquerFoods: FixedFoodEntry[] = []

  for (const mealType of Object.keys(MEAL_DISTRIBUTION)) {
    fixedByMeal.set(mealType, [])
    fixedCalsByMeal.set(mealType, 0)
    fixedMacrosByMeal.set(mealType, { protein: 0, carbs: 0, fat: 0 })
  }

  if (fixedFoods && fixedFoods.length > 0) {
    for (const ff of fixedFoods) {
      if (ff.mealType === 'qualquer') {
        qualquerFoods.push(ff)
      } else if (fixedByMeal.has(ff.mealType)) {
        const item = fixedFoodToPlannedItem(ff)
        fixedByMeal.get(ff.mealType)!.push(item)
        fixedCalsByMeal.set(ff.mealType, (fixedCalsByMeal.get(ff.mealType) || 0) + item.calories)
        const m = fixedMacrosByMeal.get(ff.mealType)!
        m.protein += item.protein
        m.carbs += item.carbs
        m.fat += item.fat
        usedFoodIds.add(ff.foodId)
      }
    }

    // Alocar alimentos "qualquer" na refeicao com mais calorias restantes
    for (const ff of qualquerFoods) {
      let bestMeal = 'almoco'
      let bestRemaining = -Infinity
      for (const [mealType, fraction] of Object.entries(MEAL_DISTRIBUTION)) {
        const mealCalTarget = dailyCalTarget * fraction
        const used = fixedCalsByMeal.get(mealType) || 0
        const remaining = mealCalTarget - used
        if (remaining > bestRemaining) {
          bestRemaining = remaining
          bestMeal = mealType
        }
      }
      const item = fixedFoodToPlannedItem(ff)
      fixedByMeal.get(bestMeal)!.push(item)
      fixedCalsByMeal.set(bestMeal, (fixedCalsByMeal.get(bestMeal) || 0) + item.calories)
      const m = fixedMacrosByMeal.get(bestMeal)!
      m.protein += item.protein
      m.carbs += item.carbs
      m.fat += item.fat
      usedFoodIds.add(ff.foodId)
    }
  }

  // ---------- Distribuir metas de macro por refeicao ----------
  const mealProteinTargets = new Map<string, number>()
  const mealCarbsTargets = new Map<string, number>()
  const mealFatTargets = new Map<string, number>()

  for (const [mealType, fraction] of Object.entries(MEAL_DISTRIBUTION)) {
    mealProteinTargets.set(mealType, macros.protein * fraction)
    mealCarbsTargets.set(mealType, macros.carbs * fraction)
    mealFatTargets.set(mealType, macros.fat * fraction)
  }

  const meals: PlannedMeal[] = []

  for (const [mealType, fraction] of Object.entries(MEAL_DISTRIBUTION)) {
    const mealCalTarget = dailyCalTarget * fraction
    const template = MEAL_TEMPLATES[mealType]

    const items: PlannedItem[] = [...(fixedByMeal.get(mealType) || [])]
    let mealCalUsed = fixedCalsByMeal.get(mealType) || 0

    if (mealCalUsed < mealCalTarget) {
      const allSlots = template.length

      for (let si = 0; si < allSlots; si++) {
        const slot = template[si]
        const remainingSlots = allSlots - si
        const slotCalTarget = (mealCalTarget - mealCalUsed) / remainingSlots

        if (slot.optional && mealCalUsed >= mealCalTarget * 0.85) {
          continue
        }

        // Buscar candidatos das categorias do slot
        let candidates: FoodRow[] = []
        for (const cat of slot.categories) {
          const catFoods = byCategory.get(cat) || []
          candidates.push(...catFoods.filter((f) => !usedFoodIds.has(f.id)))
        }

        if (candidates.length === 0) {
          candidates = strategyFiltered.filter((f) => !usedFoodIds.has(f.id))
        }

        if (candidates.length === 0) continue

        // Para estrategias focadas em proteina, priorizar alimentos proteicos em todos os slots
        if (macros.strategy === 'high_protein' || macros.strategy === 'cetogenica') {
          candidates.sort((a, b) => {
            const ratioA = a.protein / Math.max(1, a.calories)
            const ratioB = b.protein / Math.max(1, b.calories)
            return ratioB - ratioA
          })
        } else {
          shuffle(candidates)
        }

        // Escolher o melhor candidato (mais proximo da caloria do slot)
        candidates.sort((a, b) => {
          const diffA = Math.abs(a.calories - slotCalTarget)
          const diffB = Math.abs(b.calories - slotCalTarget)
          return diffA - diffB
        })

        const pick = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))]
        const servings = adjustServings(pick, slotCalTarget)
        const itemCals = pick.calories * servings

        items.push({
          foodId: pick.id,
          name: pick.name,
          servings,
          servingLabel: pick.servingLabel,
          calories: Math.round(itemCals),
          protein: Math.round(pick.protein * servings * 10) / 10,
          carbs: Math.round(pick.carbs * servings * 10) / 10,
          fat: Math.round(pick.fat * servings * 10) / 10,
          noomColor: pick.noomColor,
        })

        usedFoodIds.add(pick.id)
        mealCalUsed += itemCals
      }
    }

    const totalCalories = items.reduce((s, i) => s + i.calories, 0)
    const totalProtein = items.reduce((s, i) => s + i.protein, 0)
    const totalCarbs = items.reduce((s, i) => s + i.carbs, 0)
    const totalFat = items.reduce((s, i) => s + i.fat, 0)

    meals.push({
      mealType: mealType as PlannedMeal['mealType'],
      label: MEAL_LABELS[mealType],
      items,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFat: Math.round(totalFat * 10) / 10,
    })
  }

  const totalCalories = meals.reduce((s, m) => s + m.totalCalories, 0)
  const totalProtein = meals.reduce((s, m) => s + m.totalProtein, 0)
  const totalCarbs = meals.reduce((s, m) => s + m.totalCarbs, 0)
  const totalFat = meals.reduce((s, m) => s + m.totalFat, 0)

  return {
    date,
    totalCalories,
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    meals,
  }
}
