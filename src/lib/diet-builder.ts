// ============================================================
// Diet Builder — Montador de Dieta com Ciencia Nutricional Real
// Calculo baseado em g/kg para proteina, gramas absolutas para
// carboidratos e gordura como variavel de fechamento calorico.
// ============================================================

import { isSuitableForMeal } from './meal-suitability'
import { TEMPLATES_BY_MEAL, type MealTemplate } from './meal-templates'

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

/** Fontes de gordura priorizadas por qualidade (tier 1 = melhor) */
const FAT_SOURCE_TIER1 = new Set([
  'Azeite de oliva', 'Abacate', 'Pasta de amendoim', 'Castanha de caju',
  'Mix de nuts', 'Castanha do Pará',
])
const FAT_SOURCE_TIER2 = new Set([
  'Manteiga', 'Cream cheese', 'Queijo prato', 'Queijo mussarela',
  'Requeijão cremoso',
])
const FAT_SOURCE_NAMES = new Set([...FAT_SOURCE_TIER1, ...FAT_SOURCE_TIER2])
const FAT_SOURCE_CATEGORIES = new Set(['oleos'])

/** Itens que NUNCA devem aparecer como item destacado na dieta */
const BLACKLISTED_FOODS = new Set([
  'Ketchup', 'Maionese', 'Mostarda', 'Sal', 'Açúcar',
  'Óleo de soja', 'Óleo de canola', 'Óleo de girassol',
  'Vinagre', 'Molho de soja', 'Molho shoyu',
])

/** Extrai tipo base do alimento para controle de repetição no dia */
function extractBaseType(name: string): string | null {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const TYPES: Record<string, string[]> = {
    feijao: ['feijao'],
    arroz: ['arroz'],
    carne_bovina: ['carne moida', 'patinho', 'acem', 'alcatra', 'maminha', 'picanha', 'contrafile', 'coxao', 'lagarto', 'musculo', 'file mignon'],
    frango: ['frango', 'peito de frango', 'coxa de frango', 'sobrecoxa'],
    peixe: ['peixe', 'merluza', 'tilapia', 'salmao', 'atum', 'sardinha', 'bacalhau', 'pescada'],
    acai: ['acai'],
    ovo: ['ovo cozido', 'ovo frito', 'ovo mexido', 'omelete'],
    pao: ['pao de forma', 'pao frances', 'pao integral'],
    iogurte: ['iogurte'],
    leite: ['leite integral', 'leite desnatado', 'leite semi'],
    batata: ['batata'],
    macarrao: ['macarrao', 'espaguete', 'penne'],
  }
  for (const [base, kws] of Object.entries(TYPES)) {
    for (const kw of kws.sort((a, b) => b.length - a.length)) {
      if (n.includes(kw)) return base
    }
  }
  return null
}

/** Máximo de vezes que um tipo base pode aparecer no dia inteiro */
const MAX_BASE_TYPE_PER_DAY: Record<string, number> = {
  acai: 1,
  feijao: 1,
  arroz: 2,
  ovo: 2,
  pao: 2,
  iogurte: 1,
  leite: 1,
}
const DEFAULT_MAX_BASE_TYPE = 2

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

/** Seleciona melhor alimento para um papel, respeitando orcamento restante e adequacao a refeicao */
function selectBestFood(
  candidates: FoodRow[],
  usedIds: Set<string>,
  budget: { protein: number; carbs: number; fat: number; calories: number },
  macroRole: 'protein' | 'carbs' | 'fat' | 'volume',
  strategy: NutritionStrategy,
  mealType?: string,
  usedBaseTypes?: Map<string, number>,
): { food: FoodRow; servings: number } | null {
  let available = candidates.filter(f =>
    !usedIds.has(f.id) &&
    !BLACKLISTED_FOODS.has(f.name) &&
    strategyScore(f, strategy) > -100
  )

  // Filtrar por adequacao a refeicao (habitos brasileiros)
  if (mealType) {
    const suitable = available.filter(f => isSuitableForMeal(f.name, f.category, mealType))
    if (suitable.length > 0) {
      available = suitable
    } else if (mealType === 'cafe_da_manha') {
      // Café da manhã: NUNCA usar fallback para carnes pesadas
      return null
    }
  }

  // Filtrar por limite de repetição de tipo base no dia
  if (usedBaseTypes) {
    available = available.filter(f => {
      const bt = extractBaseType(f.name)
      if (!bt) return true
      const max = MAX_BASE_TYPE_PER_DAY[bt] ?? DEFAULT_MAX_BASE_TYPE
      return (usedBaseTypes.get(bt) ?? 0) < max
    })
  }

  // Para gordura: priorizar tier 1, depois tier 2, nunca óleo isolado
  if (macroRole === 'fat') {
    const tier1 = available.filter(f => FAT_SOURCE_TIER1.has(f.name))
    const tier2 = available.filter(f => FAT_SOURCE_TIER2.has(f.name))
    if (tier1.length > 0) available = tier1
    else if (tier2.length > 0) available = tier2
  }

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

/** Categorias permitidas no café da manhã para proteína (nunca carnes pesadas) */
const CAFE_PROTEIN_CATEGORIES = new Set(['laticinios'])
const CAFE_ROLES: RoleDef[] = [
  { role: 'proteina', macro: 'protein', cats: CAFE_PROTEIN_CATEGORIES, portionFrac: 0.4 },
  { role: 'proteina2', macro: 'protein', cats: CAFE_PROTEIN_CATEGORIES, portionFrac: 0.6 },
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
const LIGHT_PROTEIN_NAMES = new Set([
  'Ovo cozido', 'Peito de peru', 'Presunto', 'Mortadela',
  'Queijo minas frescal', 'Queijo mussarela', 'Queijo prato',
  'Iogurte grego', 'Iogurte natural integral',
  'Requeijão cremoso', 'Cream cheese',
  'Leite integral', 'Leite desnatado',
  'Whey protein (scoop)', 'Albumina (dose)',
])

export function buildMealPlan(
  foods: FoodRow[],
  macros: MacroTargets,
  dailyCalTarget: number,
  goal: string,
  date: string,
  fixedFoods?: FixedFoodEntry[]
): MealPlan {
  const usedFoodNames = new Set<string>()
  const foodByName = new Map<string, FoodRow>()
  for (const f of foods) {
    if (!foodByName.has(f.name)) foodByName.set(f.name, f)
  }
  const nonCustom = foods.filter(f => !f.isCustom && !BLACKLISTED_FOODS.has(f.name))

  // ---------- Alimentos fixos por refeição ----------
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
      usedFoodNames.add(ff.food.name)
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
      usedFoodNames.add(ff.food.name)
    }
  }

  // ---------- Mapear tags de estratégia ----------
  const strategyTags: string[] = [macros.strategy]
  if (macros.strategy === 'high_protein') strategyTags.push('fit', 'high_protein')
  if (macros.strategy === 'low_carb') strategyTags.push('low_carb')
  if (macros.strategy === 'cetogenica') strategyTags.push('cetogenica', 'low_carb')
  if (macros.strategy === 'equilibrado') strategyTags.push('equilibrado', 'tradicional', 'fit')
  if (macros.strategy === 'high_carb') strategyTags.push('equilibrado', 'tradicional')

  // ---------- Selecionar template por refeição ----------
  const usedProteinNames = new Set<string>() // evitar repetição de proteína principal
  const meals: PlannedMeal[] = []

  for (const [mealType, fraction] of Object.entries(MEAL_DISTRIBUTION)) {
    const mealBudget = {
      protein: macros.protein * fraction,
      carbs: macros.carbs * fraction,
      fat: macros.fat * fraction,
      calories: dailyCalTarget * fraction,
    }

    // Subtrair fixos
    const fm = fixedMacros.get(mealType)!
    mealBudget.protein -= fm.protein; mealBudget.carbs -= fm.carbs
    mealBudget.fat -= fm.fat; mealBudget.calories -= fm.calories

    const fixedItems = fixedByMeal.get(mealType) || []

    // Se os fixos já cobrem a refeição (>80% das calorias), pular template
    if (mealBudget.calories < dailyCalTarget * fraction * 0.2) {
      const meal: PlannedMeal = {
        mealType: mealType as PlannedMeal['mealType'],
        label: MEAL_LABELS[mealType],
        items: [...fixedItems],
        totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
      }
      recalcMeal(meal)
      meals.push(meal)
      continue
    }

    // Filtrar templates compatíveis
    const allTemplates = TEMPLATES_BY_MEAL[mealType] || []
    let compatible = allTemplates.filter(t =>
      t.tags.some(tag => strategyTags.includes(tag))
    )
    if (compatible.length === 0) compatible = allTemplates // fallback: todos

    // Filtrar templates que não repetem proteína principal do dia
    const withVariety = compatible.filter(t => {
      const principal = t.items.find(i => i.role === 'principal')
      return !principal || !usedProteinNames.has(principal.foodName)
    })
    if (withVariety.length > 0) compatible = withVariety

    // Filtrar templates cujos alimentos existem no banco
    compatible = compatible.filter(t =>
      t.items.filter(i => i.role === 'principal').every(i => foodByName.has(i.foodName))
    )
    if (compatible.length === 0) compatible = allTemplates.filter(t =>
      t.items.filter(i => i.role === 'principal').every(i => foodByName.has(i.foodName))
    )

    // Pontuar templates por proximidade de macros ao budget da refeição
    const scored = compatible.map(t => {
      let tCal = 0, tP = 0, tC = 0, tF = 0
      for (const ti of t.items) {
        const food = foodByName.get(ti.foodName)
        if (!food) continue
        tCal += food.calories * ti.defaultServings
        tP += food.protein * ti.defaultServings
        tC += food.carbs * ti.defaultServings
        tF += food.fat * ti.defaultServings
      }
      // Score: menor diferença percentual = melhor
      const calDiff = tCal > 0 ? Math.abs(tCal - mealBudget.calories) / Math.max(1, mealBudget.calories) : 1
      const pDiff = mealBudget.protein > 0 ? Math.abs(tP - mealBudget.protein) / mealBudget.protein : 0
      const cDiff = mealBudget.carbs > 0 ? Math.abs(tC - mealBudget.carbs) / mealBudget.carbs : 0
      const fDiff = mealBudget.fat > 0 ? Math.abs(tF - mealBudget.fat) / mealBudget.fat : 0
      return { template: t, score: calDiff + pDiff * 0.8 + cDiff * 0.8 + fDiff * 0.5 }
    })
    scored.sort((a, b) => a.score - b.score)
    // Escolher entre os top 3 para manter alguma variedade
    const topN = scored.slice(0, Math.min(3, scored.length))
    const template = topN[Math.floor(Math.random() * topN.length)]?.template

    if (!template) {
      // Sem template disponível — criar refeição vazia com fixos
      const meal: PlannedMeal = {
        mealType: mealType as PlannedMeal['mealType'],
        label: MEAL_LABELS[mealType],
        items: [...fixedItems],
        totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
      }
      recalcMeal(meal)
      meals.push(meal)
      continue
    }

    // ---------- Montar itens do template com ajuste de porções ----------
    const items: PlannedItem[] = [...fixedItems]

    // Calcular macros base do template
    let templateBaseCal = 0, templateBaseCarbs = 0, templateBaseFat = 0
    for (const ti of template.items) {
      const food = foodByName.get(ti.foodName)
      if (!food) continue
      templateBaseCal += food.calories * ti.defaultServings
      templateBaseCarbs += food.carbs * ti.defaultServings
      templateBaseFat += food.fat * ti.defaultServings
    }

    // Fator de escala por calorias (principal)
    const calScale = templateBaseCal > 0 ? mealBudget.calories / templateBaseCal : 1
    // Se carbs estourariam, limitar o scale
    const carbScale = templateBaseCarbs > 0 && mealBudget.carbs > 0
      ? mealBudget.carbs / templateBaseCarbs : calScale
    // Usar o menor scale para não estourar nenhum macro
    const scaleFactor = Math.min(calScale, carbScale)

    for (const ti of template.items) {
      const food = foodByName.get(ti.foodName)
      if (!food) continue
      if (usedFoodNames.has(ti.foodName)) continue

      let servings = ti.defaultServings
      if (ti.adjustable) {
        servings = ti.defaultServings * scaleFactor
      }

      // Clampar para range realista
      servings = Math.max(0.5, Math.min(3, servings))
      servings = Math.round(servings * 2) / 2

      const item = makePlannedItem(food, servings)
      items.push(item)
      usedFoodNames.add(ti.foodName)

      if (ti.role === 'principal' && food.protein > 10) {
        usedProteinNames.add(ti.foodName)
      }
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

  // ---------- Ajuste fino: tolerância ±10% em todos os macros ----------
  const TOLERANCE = 0.10

  // Helper: recalc totais globais
  const totals = () => ({
    cal: meals.reduce((s, m) => s + m.totalCalories, 0),
    p: meals.reduce((s, m) => s + m.totalProtein, 0),
    c: meals.reduce((s, m) => s + m.totalCarbs, 0),
    f: meals.reduce((s, m) => s + m.totalFat, 0),
  })

  // Helper: ajustar porção de um item por step (-0.5 ou +0.5)
  const adjustItem = (meal: PlannedMeal, idx: number, step: number) => {
    const item = meal.items[idx]
    const food = foodByName.get(item.name)
    if (!food || item.servings + step < 0.5 || item.servings + step > 3.5) return false
    meal.items[idx] = makePlannedItem(food, item.servings + step)
    recalcMeal(meal)
    return true
  }

  // Passo 1: Se carbs estão >10% acima, reduzir itens ricos em carbs
  for (let pass = 0; pass < 4; pass++) {
    const t = totals()
    if (t.c <= macros.carbs * (1 + TOLERANCE)) break
    for (const meal of meals) {
      const fixedCount = fixedByMeal.get(meal.mealType)?.length || 0
      for (let i = meal.items.length - 1; i >= fixedCount; i--) {
        const food = foodByName.get(meal.items[i].name)
        if (!food || food.carbs < 10 || meal.items[i].servings <= 0.5) continue
        adjustItem(meal, i, -0.5)
        break
      }
    }
  }

  // Passo 2: Se gordura está >10% abaixo, aumentar itens de gordura ou proteínas com gordura
  for (let pass = 0; pass < 3; pass++) {
    const t = totals()
    if (t.f >= macros.fat * (1 - TOLERANCE)) break
    for (const meal of meals) {
      if (meal.mealType === 'lanche') continue
      const fixedCount = fixedByMeal.get(meal.mealType)?.length || 0
      for (let i = fixedCount; i < meal.items.length; i++) {
        const food = foodByName.get(meal.items[i].name)
        if (!food || food.fat < 5 || meal.items[i].servings >= 3) continue
        adjustItem(meal, i, 0.5)
        break
      }
    }
  }

  // Passo 3: Se proteína está >10% abaixo, aumentar proteínas
  for (let pass = 0; pass < 3; pass++) {
    const t = totals()
    if (t.p >= macros.protein * (1 - TOLERANCE)) break
    for (const meal of meals) {
      if (meal.mealType === 'lanche') continue
      for (let i = 0; i < meal.items.length; i++) {
        const food = foodByName.get(meal.items[i].name)
        if (!food || food.protein < 15 || meal.items[i].servings >= 3) continue
        adjustItem(meal, i, 0.5)
        break
      }
    }
  }

  // Passo 4: Se calorias >10% acima, reduzir itens maiores
  for (let pass = 0; pass < 4; pass++) {
    const t = totals()
    if (t.cal <= dailyCalTarget * (1 + TOLERANCE)) break
    for (const meal of [...meals].reverse()) {
      const fixedCount = fixedByMeal.get(meal.mealType)?.length || 0
      for (let i = meal.items.length - 1; i >= fixedCount; i--) {
        const food = foodByName.get(meal.items[i].name)
        if (!food || meal.items[i].servings <= 0.5) continue
        adjustItem(meal, i, -0.5)
        break
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
