// ============================================================
// Diet Builder — Montador de Dieta Automatico
// Gera planos alimentares baseados na cultura brasileira
// ============================================================

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

// ---------- Distribuicao de calorias por refeicao ----------
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

// ---------- Templates de refeicao brasileira ----------
// Cada template define slots com categorias de alimento aceitas e um papel
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

// ---------- Funcoes auxiliares ----------

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
    // Priorizar green e yellow, excluir orange com peso menor
    return foods.filter((f) => f.noomColor !== 'orange' || Math.random() < 0.2)
  }
  if (goal === 'ganhar') {
    // Incluir tudo, com preferencia por calorias mais altas
    return foods.sort((a, b) => b.calories - a.calories)
  }
  return foods
}

/** Ajusta numero de porcoes para atingir meta calorica do slot */
function adjustServings(food: FoodRow, targetCalories: number): number {
  if (food.calories <= 0) return 1
  const raw = targetCalories / food.calories
  // Limitar entre 0.5 e 3 porcoes para manter realismo
  const clamped = Math.max(0.5, Math.min(3, raw))
  // Arredondar para 0.5 mais proximo
  return Math.round(clamped * 2) / 2
}

// ---------- Tipo para alimentos fixos (Base Alimentar) ----------

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

// ---------- Builder principal ----------

export function buildMealPlan(
  foods: FoodRow[],
  prefs: DietPreferences,
  date: string,
  fixedFoods?: FixedFoodEntry[]
): MealPlan {
  const usedFoodIds = new Set<string>()
  const nonCustomFoods = foods.filter((f) => !f.isCustom)
  const goalFiltered = filterByGoal(nonCustomFoods, prefs.goal)

  // Indexar alimentos por categoria
  const byCategory = new Map<string, FoodRow[]>()
  for (const f of goalFiltered) {
    const list = byCategory.get(f.category) || []
    list.push(f)
    byCategory.set(f.category, list)
  }

  // ---------- Pre-popular refeicoes com alimentos fixos ----------
  const fixedByMeal = new Map<string, PlannedItem[]>()
  const fixedCalsByMeal = new Map<string, number>()
  const qualquerFoods: FixedFoodEntry[] = []

  // Inicializar maps
  for (const mealType of Object.keys(MEAL_DISTRIBUTION)) {
    fixedByMeal.set(mealType, [])
    fixedCalsByMeal.set(mealType, 0)
  }

  if (fixedFoods && fixedFoods.length > 0) {
    for (const ff of fixedFoods) {
      if (ff.mealType === 'qualquer') {
        qualquerFoods.push(ff)
      } else if (fixedByMeal.has(ff.mealType)) {
        const item = fixedFoodToPlannedItem(ff)
        fixedByMeal.get(ff.mealType)!.push(item)
        fixedCalsByMeal.set(ff.mealType, (fixedCalsByMeal.get(ff.mealType) || 0) + item.calories)
        usedFoodIds.add(ff.foodId)
      }
    }

    // Alocar alimentos "qualquer" na refeicao com mais calorias restantes
    for (const ff of qualquerFoods) {
      let bestMeal = 'almoco'
      let bestRemaining = -Infinity
      for (const [mealType, fraction] of Object.entries(MEAL_DISTRIBUTION)) {
        const mealCalTarget = prefs.dailyCalTarget * fraction
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
      usedFoodIds.add(ff.foodId)
    }
  }

  const meals: PlannedMeal[] = []

  for (const [mealType, fraction] of Object.entries(MEAL_DISTRIBUTION)) {
    const mealCalTarget = prefs.dailyCalTarget * fraction
    const template = MEAL_TEMPLATES[mealType]

    // Comecar com itens fixos ja alocados
    const items: PlannedItem[] = [...(fixedByMeal.get(mealType) || [])]
    let mealCalUsed = fixedCalsByMeal.get(mealType) || 0

    // Se as calorias fixas ja excedem o budget, pular preenchimento
    if (mealCalUsed < mealCalTarget) {
      const allSlots = template.length

      for (let si = 0; si < allSlots; si++) {
        const slot = template[si]

        // Quanto de caloria alocar para este slot
        const remainingSlots = allSlots - si
        const slotCalTarget = (mealCalTarget - mealCalUsed) / remainingSlots

        // Se o slot e opcional e ja estamos perto da meta, pular
        if (slot.optional && mealCalUsed >= mealCalTarget * 0.85) {
          continue
        }

        // Buscar candidatos das categorias do slot (excluir alimentos fixos ja usados)
        let candidates: FoodRow[] = []
        for (const cat of slot.categories) {
          const catFoods = byCategory.get(cat) || []
          candidates.push(...catFoods.filter((f) => !usedFoodIds.has(f.id)))
        }

        if (candidates.length === 0) {
          // Fallback: tentar qualquer alimento nao usado
          candidates = goalFiltered.filter((f) => !usedFoodIds.has(f.id))
        }

        if (candidates.length === 0) continue

        // Embaralhar para variedade
        shuffle(candidates)

        // Escolher o melhor candidato (mais proximo da caloria do slot)
        candidates.sort((a, b) => {
          const diffA = Math.abs(a.calories - slotCalTarget)
          const diffB = Math.abs(b.calories - slotCalTarget)
          return diffA - diffB
        })

        // Pegar um dos 3 primeiros para manter variedade
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
