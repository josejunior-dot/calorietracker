// ============================================================
// Adequação de alimentos por refeição
// Define quais refeições cada alimento combina, baseado em
// hábitos alimentares brasileiros reais.
// ============================================================

type MealType = 'cafe_da_manha' | 'almoco' | 'jantar' | 'lanche'

// Adequação por categoria padrão
const CATEGORY_SUITABILITY: Record<string, MealType[]> = {
  frutas:           ['cafe_da_manha', 'lanche'],
  carnes:           ['almoco', 'jantar'],
  graos:            ['almoco', 'jantar'],
  laticinios:       ['cafe_da_manha', 'lanche'],
  legumes:          ['almoco', 'jantar'],
  paes:             ['cafe_da_manha', 'lanche'],
  bebidas:          ['cafe_da_manha', 'lanche'],
  refeicoes:        ['almoco', 'jantar'],
  industrializados: ['lanche'],
  oleos:            ['almoco', 'jantar'],
}

// Override por nome específico (tem prioridade sobre categoria)
const NAME_SUITABILITY: Record<string, MealType[]> = {
  // ── Café da manhã ──
  'Ovo cozido':                    ['cafe_da_manha', 'lanche'],
  'Peito de peru':                 ['cafe_da_manha', 'lanche'],
  'Presunto':                      ['cafe_da_manha', 'lanche'],
  'Mortadela':                     ['cafe_da_manha', 'lanche'],
  'Pão francês':                   ['cafe_da_manha'],
  'Pão integral':                  ['cafe_da_manha', 'lanche'],
  'Pão de forma':                  ['cafe_da_manha', 'lanche'],
  'Torrada':                       ['cafe_da_manha', 'lanche'],
  'Tapioca':                       ['cafe_da_manha', 'lanche'],
  'Biscoito cream cracker':        ['cafe_da_manha', 'lanche'],
  'Café sem açúcar':               ['cafe_da_manha', 'lanche'],
  'Leite integral':                ['cafe_da_manha', 'lanche'],
  'Leite desnatado':               ['cafe_da_manha', 'lanche'],
  'Leite com chocolate':           ['cafe_da_manha', 'lanche'],
  'Iogurte natural integral':      ['cafe_da_manha', 'lanche'],
  'Iogurte grego':                 ['cafe_da_manha', 'lanche'],
  'Queijo minas frescal':          ['cafe_da_manha', 'lanche'],
  'Requeijão cremoso':             ['cafe_da_manha', 'lanche'],
  'Cream cheese':                  ['cafe_da_manha', 'lanche'],
  'Manteiga':                      ['cafe_da_manha'],
  'Mel':                           ['cafe_da_manha', 'lanche'],
  'Granola':                       ['cafe_da_manha', 'lanche'],
  'Aveia em flocos':               ['cafe_da_manha', 'lanche'],
  'Vitamina de banana':            ['cafe_da_manha', 'lanche'],

  // ── Almoço e Jantar (pratos principais) ──
  'Arroz branco cozido':           ['almoco', 'jantar'],
  'Arroz integral cozido':         ['almoco', 'jantar'],
  'Feijão preto cozido':           ['almoco', 'jantar'],
  'Feijão carioca cozido':         ['almoco', 'jantar'],
  'Macarrão cozido':               ['almoco', 'jantar'],
  'Macarrão integral cozido':      ['almoco', 'jantar'],
  'Lasanha bolonhesa':             ['almoco', 'jantar'],
  'Feijoada (porção)':             ['almoco'],
  'Estrogonofe de frango':         ['almoco', 'jantar'],
  'Arroz carreteiro':              ['almoco', 'jantar'],
  'Cuscuz':                        ['cafe_da_manha', 'jantar'],
  'Miojo':                         ['lanche', 'jantar'],

  // ── Carnes (sempre almoço/jantar, nunca café) ──
  'Frango peito grelhado':         ['almoco', 'jantar'],
  'Frango desfiado':               ['almoco', 'jantar'],
  'Lagarto desfiado':              ['almoco', 'jantar'],
  'Picanha grelhada':              ['almoco', 'jantar'],
  'Alcatra grelhada':              ['almoco', 'jantar'],
  'Filé mignon grelhado':          ['almoco', 'jantar'],
  'Salmão grelhado':               ['almoco', 'jantar'],
  'Tilápia grelhada':              ['almoco', 'jantar'],
  'Bacalhau assado':               ['almoco', 'jantar'],
  'Camarão cozido':                ['almoco', 'jantar'],

  // ── Lanches ──
  'Pão de queijo':                 ['cafe_da_manha', 'lanche'],
  'Coxinha':                       ['lanche'],
  'Empada':                        ['lanche'],
  'Esfiha':                        ['lanche'],
  'Pastel':                        ['lanche'],
  'Misto quente':                  ['cafe_da_manha', 'lanche'],
  'Bauru':                         ['lanche'],
  'Barra de cereal':               ['lanche'],
  'Barra de proteína':             ['lanche'],
  'Whey protein (scoop)':          ['lanche', 'cafe_da_manha'],
  'Pasta de amendoim':             ['cafe_da_manha', 'lanche'],
  'Castanha de caju':              ['lanche'],
  'Mix de nuts':                   ['lanche'],
  'Brigadeiro':                    ['lanche'],

  // ── Açaí → apenas lanche (evitar repetição café+lanche) ──
  'Açaí (polpa)':                  ['lanche'],
  'Açaí com granola':              ['lanche'],

  // ── Bebidas ──
  'Refrigerante cola':             ['almoco', 'jantar', 'lanche'],
  'Água de coco':                  ['lanche'],
  'Cerveja':                       ['almoco', 'jantar'],
  'Suco de laranja natural':       ['cafe_da_manha', 'lanche'],
  'Suco verde':                    ['cafe_da_manha', 'lanche'],
  'Chá sem açúcar':                ['cafe_da_manha', 'lanche'],
  'Isotônico':                     ['lanche'],

  // ── Condimentos (acompanham qualquer refeição) ──
  'Azeite de oliva':               ['almoco', 'jantar'],
  'Ketchup':                       ['almoco', 'jantar', 'lanche'],
  'Maionese':                      ['almoco', 'jantar', 'lanche'],
  'Mostarda':                      ['almoco', 'jantar', 'lanche'],
  'Sal':                           ['almoco', 'jantar', 'cafe_da_manha'],
  'Açúcar':                        ['cafe_da_manha'],

  // ── Suplementos ──
  'Albumina (dose)':               ['lanche'],
  'Creatina':                      ['lanche'],
  'BCAA (dose)':                   ['lanche'],
  'Dextrose':                      ['lanche'],
}

/**
 * Retorna as refeições adequadas para um alimento.
 * Prioriza override por nome, depois usa categoria padrão.
 */
export function getMealSuitability(foodName: string, category: string): MealType[] {
  // Override por nome
  if (NAME_SUITABILITY[foodName]) {
    return NAME_SUITABILITY[foodName]
  }
  // Padrão por categoria
  return CATEGORY_SUITABILITY[category] || ['almoco', 'jantar']
}

/**
 * Verifica se um alimento é adequado para uma refeição específica.
 */
export function isSuitableForMeal(foodName: string, category: string, mealType: string): boolean {
  const suitable = getMealSuitability(foodName, category)
  return suitable.includes(mealType as MealType)
}
