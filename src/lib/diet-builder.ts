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
// Logica: proteina PRIMEIRO, depois carbs, depois gordura.
// Cada refeicao recebe sua cota de macros e o algoritmo seleciona
// alimentos para bater cada macro, nao apenas calorias.
// ============================================================

/** Classifica alimentos por predominancia de macro */
function classifyFood(f: FoodRow): 'protein' | 'carb' | 'fat' | 'mixed' {
  const totalMacroG = f.protein + f.carbs + f.fat
  if (totalMacroG === 0) return 'mixed'
  const pPct = f.protein / totalMacroG
  const cPct = f.carbs / totalMacroG
  const fPct = f.fat / totalMacroG
  if (pPct >= 0.45) return 'protein'
  if (cPct >= 0.55) return 'carb'
  if (fPct >= 0.50) return 'fat'
  return 'mixed'
}

/** Seleciona um alimento de uma lista, priorizando os primeiros, com leve aleatoriedade */
function pickFrom(candidates: FoodRow[], usedIds: Set<string>): FoodRow | null {
  const available = candidates.filter(f => !usedIds.has(f.id))
  if (available.length === 0) return null
  // Escolhe entre os top 3 para variedade
  const idx = Math.floor(Math.random() * Math.min(3, available.length))
  return available[idx]
}

/** Cria PlannedItem a partir de FoodRow com porcoes ajustadas */
function makePlannedItem(food: FoodRow, servings: number): PlannedItem {
  const s = Math.round(servings * 2) / 2 // Arredonda para 0.5
  const clampedS = Math.max(0.5, Math.min(3, s))
  return {
    foodId: food.id,
    name: food.name,
    servings: clampedS,
    servingLabel: food.servingLabel,
    calories: Math.round(food.calories * clampedS),
    protein: Math.round(food.protein * clampedS * 10) / 10,
    carbs: Math.round(food.carbs * clampedS * 10) / 10,
    fat: Math.round(food.fat * clampedS * 10) / 10,
    noomColor: food.noomColor,
  }
}

/** Categorias tipicas para cada papel na refeicao */
const PROTEIN_CATEGORIES = new Set(['carnes'])
const CARB_CATEGORIES = new Set(['graos', 'paes', 'frutas'])
const VEG_CATEGORIES = new Set(['legumes'])
const DAIRY_CATEGORIES = new Set(['laticinios'])

/** Templates de estrutura por refeicao (papel do alimento na refeicao) */
type MealRole = 'protein' | 'carb' | 'carb2' | 'vegetable' | 'vegetable2' | 'fruit' | 'dairy' | 'fat_source' | 'snack'

const MEAL_STRUCTURE: Record<string, MealRole[]> = {
  cafe_da_manha: ['dairy', 'protein', 'carb', 'fruit'],
  almoco: ['protein', 'carb', 'carb2', 'vegetable', 'fat_source'],
  jantar: ['protein', 'carb', 'vegetable', 'vegetable2'],
  lanche: ['dairy', 'fruit'],
}

/** Alimentos fontes de gordura saudavel */
const FAT_SOURCE_CATEGORIES = new Set(['oleos', 'industrializados'])

// ==================== BUILDER PRINCIPAL ====================
// Abordagem: orcamento rigido de macros com tracking contínuo.
// Cada item adicionado eh validado contra o orcamento restante.
// Tolerancias: proteina ±10g, carbs ±10g, gordura ±8g, calorias ±5%.
// ============================================================

/** Pontuacao de compatibilidade do alimento com a estrategia */
function strategyScore(food: FoodRow, strategy: NutritionStrategy): number {
  const carbDensity = food.carbs / Math.max(1, food.servingSize) // g carb per g serving
  const protRatio = food.protein / Math.max(1, food.calories)

  switch (strategy) {
    case 'cetogenica':
      if (food.carbs > 8) return -100 // Elimina
      return protRatio * 50 + (food.fat / Math.max(1, food.calories)) * 30
    case 'low_carb':
      if (food.carbs > 25) return -50 // Penaliza fortemente
      if (carbDensity > 0.3) return -20
      return protRatio * 40 - carbDensity * 30
    case 'high_protein':
      return protRatio * 60 - carbDensity * 10
    case 'high_carb':
      return carbDensity * 30 + protRatio * 20
    default: // equilibrado
      return protRatio * 30 + 10 // Leve preferencia por proteina
  }
}

/** Seleciona melhor alimento para um papel, respeitando orcamento restante */
function selectBestFood(
  candidates: FoodRow[],
  usedIds: Set<string>,
  budget: { protein: number; carbs: number; fat: number; calories: number },
  macroRole: 'protein' | 'carbs' | 'fat' | 'volume',
  strategy: NutritionStrategy,
): { food: FoodRow; servings: number } | null {
  const available = candidates.filter(f => !usedIds.has(f.id) && strategyScore(f, strategy) > -100)
  if (available.length === 0) return null

  // Ordenar por compatibilidade com estrategia
  available.sort((a, b) => strategyScore(b, strategy) - strategyScore(a, strategy))

  // Pegar entre os top 5 para variedade
  const pool = available.slice(0, Math.min(5, available.length))
  const food = pool[Math.floor(Math.random() * pool.length)]

  // Calcular porcoes baseadas no macro alvo
  let servings: number
  if (macroRole === 'protein' && food.protein > 0 && budget.protein > 0) {
    servings = budget.protein / food.protein
  } else if (macroRole === 'carbs' && food.carbs > 0 && budget.carbs > 0) {
    servings = budget.carbs / food.carbs
  } else if (macroRole === 'fat' && food.fat > 0 && budget.fat > 0) {
    servings = budget.fat / food.fat
  } else {
    // Volume (legumes): porcao fixa de 1
    servings = 1
  }

  // Limitar a range realista
  servings = Math.max(0.5, Math.min(2.5, servings))
  servings = Math.round(servings * 2) / 2

  // CHECKPOINT: esse item estouraria o orcamento de calorias?
  const itemCals = food.calories * servings
  if (itemCals > budget.calories + 30) {
    // Reduzir porcao para caber no orcamento
    servings = Math.max(0.5, Math.round((budget.calories / food.calories) * 2) / 2)
  }

  // CHECKPOINT: esse item estouraria o carb restante? (critico para low carb/ceto)
  const itemCarbs = food.carbs * servings
  if (macroRole !== 'carbs' && itemCarbs > budget.carbs + 5 && budget.carbs >= 0) {
    // Reduzir porcao para nao estourar carbs
    if (food.carbs > 0) {
      servings = Math.max(0.5, Math.round((budget.carbs / food.carbs) * 2) / 2)
    }
  }

  if (servings < 0.5) return null

  return { food, servings }
}

/** Recalcula totais de uma refeicao */
function recalcMeal(meal: PlannedMeal) {
  meal.totalCalories = Math.round(meal.items.reduce((s, i) => s + i.calories, 0))
  meal.totalProtein = Math.round(meal.items.reduce((s, i) => s + i.protein, 0) * 10) / 10
  meal.totalCarbs = Math.round(meal.items.reduce((s, i) => s + i.carbs, 0) * 10) / 10
  meal.totalFat = Math.round(meal.items.reduce((s, i) => s + i.fat, 0) * 10) / 10
}

/** Estrutura por refeicao: [papel, macro_alvo] */
type RoleDef = { role: string; macro: 'protein' | 'carbs' | 'fat' | 'volume'; cats: Set<string>; portionFrac: number }

const CAFE_ROLES: RoleDef[] = [
  { role: 'proteina', macro: 'protein', cats: DAIRY_CATEGORIES, portionFrac: 0.3 },
  { role: 'proteina2', macro: 'protein', cats: PROTEIN_CATEGORIES, portionFrac: 0.7 },
  { role: 'carboidrato', macro: 'carbs', cats: CARB_CATEGORIES, portionFrac: 0.7 },
  { role: 'fruta', macro: 'carbs', cats: new Set(['frutas']), portionFrac: 0.3 },
]
const ALMOCO_ROLES: RoleDef[] = [
  { role: 'proteina', macro: 'protein', cats: PROTEIN_CATEGORIES, portionFrac: 1.0 },
  { role: 'arroz/carb', macro: 'carbs', cats: new Set(['graos']), portionFrac: 0.5 },
  { role: 'feijao/carb2', macro: 'carbs', cats: new Set(['graos']), portionFrac: 0.3 },
  { role: 'salada', macro: 'volume', cats: VEG_CATEGORIES, portionFrac: 0 },
  { role: 'gordura', macro: 'fat', cats: FAT_SOURCE_CATEGORIES, portionFrac: 0.5 },
]
const JANTAR_ROLES: RoleDef[] = [
  { role: 'proteina', macro: 'protein', cats: PROTEIN_CATEGORIES, portionFrac: 1.0 },
  { role: 'carboidrato', macro: 'carbs', cats: CARB_CATEGORIES, portionFrac: 0.7 },
  { role: 'legume', macro: 'volume', cats: VEG_CATEGORIES, portionFrac: 0 },
  { role: 'gordura', macro: 'fat', cats: FAT_SOURCE_CATEGORIES, portionFrac: 0.5 },
]
const LANCHE_ROLES: RoleDef[] = [
  { role: 'proteina', macro: 'protein', cats: new Set([...DAIRY_CATEGORIES, ...PROTEIN_CATEGORIES]), portionFrac: 0.5 },
  { role: 'fruta', macro: 'carbs', cats: new Set(['frutas']), portionFrac: 0.5 },
]

const ROLES_BY_MEAL: Record<string, RoleDef[]> = {
  cafe_da_manha: CAFE_ROLES,
  almoco: ALMOCO_ROLES,
  jantar: JANTAR_ROLES,
  lanche: LANCHE_ROLES,
}

// Proteinas leves para cafe (nao carnes pesadas)
const LIGHT_PROTEIN_NAMES = new Set(['Ovo cozido', 'Peito de peru', 'Presunto', 'Queijo minas frescal', 'Iogurte grego'])

export function buildMealPlan(
  foods: FoodRow[],
  macros: MacroTargets,
  dailyCalTarget: number,
  goal: string,
  date: string,
  fixedFoods?: FixedFoodEntry[]
): MealPlan {
  const usedFoodIds = new Set<string>()
  const nonCustom = foods.filter(f => !f.isCustom)

  // Indexar por categoria
  const byCat = new Map<string, FoodRow[]>()
  for (const f of nonCustom) {
    if (!byCat.has(f.category)) byCat.set(f.category, [])
    byCat.get(f.category)!.push(f)
  }

  // ---------- Alimentos fixos ----------
  const fixedByMeal = new Map<string, PlannedItem[]>()
  const fixedMacros = new Map<string, { protein: number; carbs: number; fat: number; calories: number }>()

  for (const mt of Object.keys(MEAL_DISTRIBUTION)) {
    fixedByMeal.set(mt, [])
    fixedMacros.set(mt, { protein: 0, carbs: 0, fat: 0, calories: 0 })
  }

  if (fixedFoods && fixedFoods.length > 0) {
    const qualquer: FixedFoodEntry[] = []
    for (const ff of fixedFoods) {
      if (ff.mealType === 'qualquer') { qualquer.push(ff); continue }
      if (!fixedByMeal.has(ff.mealType)) continue
      const item = fixedFoodToPlannedItem(ff)
      fixedByMeal.get(ff.mealType)!.push(item)
      const m = fixedMacros.get(ff.mealType)!
      m.protein += item.protein; m.carbs += item.carbs; m.fat += item.fat; m.calories += item.calories
      usedFoodIds.add(ff.foodId)
    }
    for (const ff of qualquer) {
      let best = 'almoco'; let bestR = -Infinity
      for (const [mt, frac] of Object.entries(MEAL_DISTRIBUTION)) {
        const r = dailyCalTarget * frac - (fixedMacros.get(mt)?.calories || 0)
        if (r > bestR) { bestR = r; best = mt }
      }
      const item = fixedFoodToPlannedItem(ff)
      fixedByMeal.get(best)!.push(item)
      const m = fixedMacros.get(best)!
      m.protein += item.protein; m.carbs += item.carbs; m.fat += item.fat; m.calories += item.calories
      usedFoodIds.add(ff.foodId)
    }
  }

  // ---------- Tracking global de macros ----------
  let globalProteinUsed = 0, globalCarbsUsed = 0, globalFatUsed = 0, globalCalUsed = 0
  // Contabilizar fixos
  for (const fm of fixedMacros.values()) {
    globalProteinUsed += fm.protein; globalCarbsUsed += fm.carbs
    globalFatUsed += fm.fat; globalCalUsed += fm.calories
  }

  const meals: PlannedMeal[] = []

  for (const [mealType, fraction] of Object.entries(MEAL_DISTRIBUTION)) {
    const roles = ROLES_BY_MEAL[mealType] || []
    const mealBudget = {
      protein: macros.protein * fraction,
      carbs: macros.carbs * fraction,
      fat: macros.fat * fraction,
      calories: dailyCalTarget * fraction,
    }

    // Subtrair fixos do orcamento
    const fm = fixedMacros.get(mealType)!
    mealBudget.protein -= fm.protein; mealBudget.carbs -= fm.carbs
    mealBudget.fat -= fm.fat; mealBudget.calories -= fm.calories

    const items: PlannedItem[] = [...(fixedByMeal.get(mealType) || [])]

    for (const roleDef of roles) {
      if (mealBudget.calories <= 15) break

      // Verificar se o orcamento GLOBAL ainda precisa deste macro
      const globalProteinLeft = macros.protein - globalProteinUsed
      const globalCarbsLeft = macros.carbs - globalCarbsUsed
      const globalFatLeft = macros.fat - globalFatUsed

      // Ajustar target baseado no que falta globalmente
      let adjustedBudget = { ...mealBudget }
      if (roleDef.macro === 'protein') {
        adjustedBudget.protein = Math.min(mealBudget.protein, Math.max(0, globalProteinLeft * roleDef.portionFrac))
        if (adjustedBudget.protein < 3 && globalProteinLeft <= 5) continue // Proteina ja batida
      }
      if (roleDef.macro === 'carbs') {
        adjustedBudget.carbs = Math.min(mealBudget.carbs, Math.max(0, globalCarbsLeft * roleDef.portionFrac))
        if (globalCarbsLeft <= 5 && roleDef.macro === 'carbs') continue // Carbs ja batido
      }

      // Montar lista de candidatos das categorias do role
      let candidates: FoodRow[] = []
      for (const cat of roleDef.cats) {
        candidates.push(...(byCat.get(cat) || []))
      }

      // Para cafe, filtrar proteinas pesadas
      if (mealType === 'cafe_da_manha' && roleDef.macro === 'protein') {
        const light = candidates.filter(f =>
          DAIRY_CATEGORIES.has(f.category) || LIGHT_PROTEIN_NAMES.has(f.name) ||
          (f.calories <= 100 && f.protein >= 5)
        )
        if (light.length > 0) candidates = light
      }

      const result = selectBestFood(candidates, usedFoodIds, adjustedBudget, roleDef.macro, macros.strategy)
      if (!result) continue

      const item = makePlannedItem(result.food, result.servings)
      items.push(item)
      usedFoodIds.add(result.food.id)

      // Atualizar orcamentos
      mealBudget.protein -= item.protein
      mealBudget.carbs -= item.carbs
      mealBudget.fat -= item.fat
      mealBudget.calories -= item.calories

      globalProteinUsed += item.protein
      globalCarbsUsed += item.carbs
      globalFatUsed += item.fat
      globalCalUsed += item.calories
    }

    const meal: PlannedMeal = {
      mealType: mealType as PlannedMeal['mealType'],
      label: MEAL_LABELS[mealType],
      items,
      totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
    }
    recalcMeal(meal)
    meals.push(meal)
  }

  // ---------- Validacao final e ajustes ----------
  let tP = meals.reduce((s, m) => s + m.totalProtein, 0)
  let tC = meals.reduce((s, m) => s + m.totalCarbs, 0)
  let tF = meals.reduce((s, m) => s + m.totalFat, 0)
  let tCal = meals.reduce((s, m) => s + m.totalCalories, 0)

  // Se calorias estouraram mais de 5%, reduzir porcoes de itens nao-fixos com mais calorias
  if (tCal > dailyCalTarget * 1.05) {
    const excess = tCal - dailyCalTarget
    let reduced = 0
    for (const meal of meals) {
      const fixedCount = fixedByMeal.get(meal.mealType)?.length || 0
      for (let i = meal.items.length - 1; i >= fixedCount; i--) {
        if (reduced >= excess) break
        const item = meal.items[i]
        if (item.servings > 0.5 && item.calories > 80) {
          const foodRow = nonCustom.find(f => f.id === item.foodId)
          if (foodRow) {
            const newServings = Math.max(0.5, item.servings - 0.5)
            meal.items[i] = makePlannedItem(foodRow, newServings)
            reduced += item.calories - meal.items[i].calories
          }
        }
      }
      recalcMeal(meal)
    }
  }

  // Se proteina ficou >10g abaixo, substituir item mais fraco por carne
  tP = meals.reduce((s, m) => s + m.totalProtein, 0)
  if (tP < macros.protein - 10) {
    for (const meal of meals) {
      if (meal.mealType === 'lanche') continue
      const fixedCount = fixedByMeal.get(meal.mealType)?.length || 0
      let worstIdx = -1; let worstP = Infinity
      for (let i = fixedCount; i < meal.items.length; i++) {
        if (meal.items[i].protein < worstP) { worstP = meal.items[i].protein; worstIdx = i }
      }
      if (worstIdx >= 0) {
        const allProteins = (byCat.get('carnes') || [])
        const rep = pickFrom(allProteins, usedFoodIds)
        if (rep) {
          const old = meal.items[worstIdx]
          const s = Math.max(0.5, Math.min(2, Math.round((old.calories / rep.calories) * 2) / 2))
          meal.items[worstIdx] = makePlannedItem(rep, s)
          usedFoodIds.add(rep.id)
          recalcMeal(meal)
          break // Uma substituicao por vez
        }
      }
    }
  }

  // Totais finais
  const finalCal = meals.reduce((s, m) => s + m.totalCalories, 0)
  const finalP = meals.reduce((s, m) => s + m.totalProtein, 0)
  const finalC = meals.reduce((s, m) => s + m.totalCarbs, 0)
  const finalF = meals.reduce((s, m) => s + m.totalFat, 0)

  return {
    date,
    totalCalories: finalCal,
    totalProtein: Math.round(finalP * 10) / 10,
    totalCarbs: Math.round(finalC * 10) / 10,
    totalFat: Math.round(finalF * 10) / 10,
    meals,
  }
}
