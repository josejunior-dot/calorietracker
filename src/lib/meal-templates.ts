// ============================================================
// Templates de Refeições Brasileiras
// Combinações curadas de alimentos reais, organizadas por tipo
// de refeição e perfil nutricional.
// ============================================================

export type MealTemplate = {
  name: string
  items: TemplateItem[]
  tags: string[] // 'high_protein' | 'low_carb' | 'equilibrado' | 'fit' | 'tradicional' | 'rapido' | 'cetogenica' | 'vegetariano'
}

export type TemplateItem = {
  foodName: string
  role: 'principal' | 'acompanhamento' | 'complemento' | 'bebida'
  defaultServings: number
  adjustable: boolean // se pode ter porção ajustada para bater macros
}

// ============================================================
// CAFÉ DA MANHÃ (20 templates)
// ============================================================

export const CAFE_TEMPLATES: MealTemplate[] = [
  {
    name: 'Café Brasileiro Clássico',
    items: [
      { foodName: 'Pão francês', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Manteiga', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Queijo minas frescal', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Café sem açúcar', role: 'bebida', defaultServings: 1, adjustable: false },
      { foodName: 'Banana', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado'],
  },
  {
    name: 'Café Fit com Ovos',
    items: [
      { foodName: 'Pão integral', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Ovo cozido', role: 'acompanhamento', defaultServings: 2, adjustable: true },
      { foodName: 'Queijo minas frescal', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Café sem açúcar', role: 'bebida', defaultServings: 1, adjustable: false },
    ],
    tags: ['fit', 'high_protein', 'equilibrado'],
  },
  {
    name: 'Tapioca com Queijo e Peru',
    items: [
      { foodName: 'Tapioca', role: 'principal', defaultServings: 2, adjustable: true },
      { foodName: 'Queijo minas frescal', role: 'acompanhamento', defaultServings: 2, adjustable: true },
      { foodName: 'Peito de peru', role: 'acompanhamento', defaultServings: 2, adjustable: true },
      { foodName: 'Café sem açúcar', role: 'bebida', defaultServings: 1, adjustable: false },
    ],
    tags: ['fit', 'low_carb', 'high_protein'],
  },
  {
    name: 'Iogurte com Granola e Fruta',
    items: [
      { foodName: 'Iogurte grego', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Granola', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Banana', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Mel', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['rapido', 'equilibrado', 'fit'],
  },
  {
    name: 'Café Proteico com Whey',
    items: [
      { foodName: 'Whey protein (scoop)', role: 'principal', defaultServings: 1, adjustable: false },
      { foodName: 'Banana', role: 'acompanhamento', defaultServings: 1, adjustable: false },
      { foodName: 'Aveia em flocos', role: 'complemento', defaultServings: 1, adjustable: true },
      { foodName: 'Pasta de amendoim', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['fit', 'high_protein', 'rapido'],
  },
  {
    name: 'Pão Integral com Requeijão',
    items: [
      { foodName: 'Pão integral', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Requeijão cremoso', role: 'acompanhamento', defaultServings: 1, adjustable: false },
      { foodName: 'Peito de peru', role: 'acompanhamento', defaultServings: 2, adjustable: true },
      { foodName: 'Maçã', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Café sem açúcar', role: 'bebida', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado'],
  },
  {
    name: 'Cuscuz com Ovo',
    items: [
      { foodName: 'Cuscuz de milho', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Ovo cozido', role: 'acompanhamento', defaultServings: 2, adjustable: true },
      { foodName: 'Manteiga', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Café sem açúcar', role: 'bebida', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'high_protein'],
  },
  {
    name: 'Vitamina de Banana Proteica',
    items: [
      { foodName: 'Vitamina de banana', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Whey protein (scoop)', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Aveia em flocos', role: 'complemento', defaultServings: 1, adjustable: true },
    ],
    tags: ['rapido', 'high_protein', 'fit'],
  },
  {
    name: 'Pão de Queijo com Iogurte',
    items: [
      { foodName: 'Pão de queijo', role: 'principal', defaultServings: 3, adjustable: true },
      { foodName: 'Iogurte natural integral', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Morango', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Café sem açúcar', role: 'bebida', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'rapido'],
  },
  {
    name: 'Aveia com Frutas',
    items: [
      { foodName: 'Aveia em flocos', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Leite integral', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Banana', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Mel', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['fit', 'equilibrado'],
  },
  {
    name: 'Café Low Carb',
    items: [
      { foodName: 'Ovo cozido', role: 'principal', defaultServings: 3, adjustable: true },
      { foodName: 'Queijo minas frescal', role: 'acompanhamento', defaultServings: 2, adjustable: true },
      { foodName: 'Abacate', role: 'complemento', defaultServings: 0.5, adjustable: true },
      { foodName: 'Café sem açúcar', role: 'bebida', defaultServings: 1, adjustable: false },
    ],
    tags: ['low_carb', 'cetogenica', 'high_protein'],
  },
  {
    name: 'Torrada com Cream Cheese',
    items: [
      { foodName: 'Torrada integral', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Cream cheese', role: 'acompanhamento', defaultServings: 1, adjustable: false },
      { foodName: 'Presunto', role: 'acompanhamento', defaultServings: 2, adjustable: true },
      { foodName: 'Laranja', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Café sem açúcar', role: 'bebida', defaultServings: 1, adjustable: false },
    ],
    tags: ['equilibrado', 'rapido'],
  },
]

// ============================================================
// ALMOÇO (20 templates)
// ============================================================

export const ALMOCO_TEMPLATES: MealTemplate[] = [
  {
    name: 'Prato Feito Clássico',
    items: [
      { foodName: 'Arroz branco cozido', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Feijão carioca cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Frango peito grelhado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Alface', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Tomate', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado', 'high_protein'],
  },
  {
    name: 'Arroz com Feijão Preto e Carne',
    items: [
      { foodName: 'Arroz branco cozido', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Feijão preto cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Alcatra grelhada', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Couve refogada', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado', 'high_protein'],
  },
  {
    name: 'Frango com Batata Doce',
    items: [
      { foodName: 'Frango peito grelhado', role: 'principal', defaultServings: 2, adjustable: true },
      { foodName: 'Batata doce cozida', role: 'acompanhamento', defaultServings: 1.5, adjustable: true },
      { foodName: 'Brócolis cozido', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['fit', 'high_protein'],
  },
  {
    name: 'Peixe com Arroz Integral',
    items: [
      { foodName: 'Tilápia grelhada', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Arroz integral cozido', role: 'acompanhamento', defaultServings: 1.5, adjustable: true },
      { foodName: 'Feijão carioca cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Espinafre cozido', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['fit', 'equilibrado'],
  },
  {
    name: 'Carne Moída com Arroz',
    items: [
      { foodName: 'Arroz branco cozido', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Feijão preto cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Carne moída refogada', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Abobrinha refogada', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado'],
  },
  {
    name: 'Salmão com Legumes',
    items: [
      { foodName: 'Salmão grelhado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Batata inglesa cozida', role: 'acompanhamento', defaultServings: 1.5, adjustable: true },
      { foodName: 'Brócolis cozido', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['fit', 'high_protein'],
  },
  {
    name: 'Filé Mignon com Arroz',
    items: [
      { foodName: 'Arroz branco cozido', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Feijão carioca cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Filé mignon grelhado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Alface', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Tomate', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['tradicional', 'high_protein'],
  },
  {
    name: 'Frango Desfiado Fit',
    items: [
      { foodName: 'Arroz integral cozido', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Lentilha cozida', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Frango desfiado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Cenoura crua', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['fit', 'high_protein'],
  },
  {
    name: 'Bife com Mandioca',
    items: [
      { foodName: 'Patinho grelhado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Mandioca cozida', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Feijão preto cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Couve refogada', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado'],
  },
  {
    name: 'Sobrecoxa com Arroz',
    items: [
      { foodName: 'Arroz branco cozido', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Feijão carioca cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Sobrecoxa de frango assada', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Pepino', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado'],
  },
  {
    name: 'Merluza com Purê',
    items: [
      { foodName: 'Merluza grelhada', role: 'principal', defaultServings: 2, adjustable: true },
      { foodName: 'Batata inglesa cozida', role: 'acompanhamento', defaultServings: 1.5, adjustable: true },
      { foodName: 'Espinafre cozido', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['equilibrado'],
  },
  {
    name: 'Maminha com Arroz e Feijão',
    items: [
      { foodName: 'Arroz branco cozido', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Feijão preto cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Maminha assada', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Alface', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'high_protein'],
  },
  {
    name: 'Low Carb: Frango com Legumes',
    items: [
      { foodName: 'Frango peito grelhado', role: 'principal', defaultServings: 2, adjustable: true },
      { foodName: 'Brócolis cozido', role: 'acompanhamento', defaultServings: 1.5, adjustable: false },
      { foodName: 'Abobrinha refogada', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 1, adjustable: true },
    ],
    tags: ['low_carb', 'cetogenica', 'high_protein', 'fit'],
  },
  {
    name: 'Tucunaré com Arroz',
    items: [
      { foodName: 'Arroz branco cozido', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Feijão carioca cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Tucunaré grelhado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Tomate', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado'],
  },
  {
    name: 'Quinoa com Frango e Legumes',
    items: [
      { foodName: 'Quinoa cozida', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Frango peito grelhado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Cenoura crua', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['fit', 'high_protein'],
  },
  {
    name: 'Kibe Assado com Tabule',
    items: [
      { foodName: 'Kibe assado', role: 'principal', defaultServings: 2, adjustable: true },
      { foodName: 'Tabule', role: 'acompanhamento', defaultServings: 1.5, adjustable: true },
      { foodName: 'Homus', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Alface', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['equilibrado', 'tradicional', 'high_protein'],
  },
  {
    name: 'Kafta com Arroz e Homus',
    items: [
      { foodName: 'Kafta grelhada', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Arroz branco cozido', role: 'acompanhamento', defaultServings: 1.5, adjustable: true },
      { foodName: 'Homus', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Tomate', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['equilibrado', 'tradicional', 'high_protein'],
  },
  {
    name: 'Charuto com Coalhada',
    items: [
      { foodName: 'Charuto de repolho', role: 'principal', defaultServings: 3, adjustable: true },
      { foodName: 'Arroz branco cozido', role: 'acompanhamento', defaultServings: 1.5, adjustable: true },
      { foodName: 'Coalhada seca', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Alface', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['equilibrado', 'tradicional'],
  },
]

// ============================================================
// JANTAR (15 templates)
// ============================================================

export const JANTAR_TEMPLATES: MealTemplate[] = [
  {
    name: 'Frango Grelhado com Salada',
    items: [
      { foodName: 'Frango peito grelhado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Arroz branco cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Alface', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Tomate', role: 'complemento', defaultServings: 0.5, adjustable: false },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['equilibrado', 'fit'],
  },
  {
    name: 'Omelete com Salada',
    items: [
      { foodName: 'Ovo cozido', role: 'principal', defaultServings: 3, adjustable: true },
      { foodName: 'Queijo mussarela', role: 'acompanhamento', defaultServings: 1, adjustable: false },
      { foodName: 'Tomate', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Pão integral', role: 'acompanhamento', defaultServings: 1, adjustable: true },
    ],
    tags: ['rapido', 'high_protein', 'equilibrado'],
  },
  {
    name: 'Tilápia com Legumes',
    items: [
      { foodName: 'Tilápia grelhada', role: 'principal', defaultServings: 2, adjustable: true },
      { foodName: 'Batata doce cozida', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Brócolis cozido', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['fit', 'equilibrado'],
  },
  {
    name: 'Carne com Abóbora',
    items: [
      { foodName: 'Patinho grelhado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Abóbora cozida', role: 'acompanhamento', defaultServings: 2, adjustable: true },
      { foodName: 'Espinafre cozido', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['equilibrado', 'low_carb'],
  },
  {
    name: 'Sopa de Legumes com Frango',
    items: [
      { foodName: 'Frango desfiado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Batata inglesa cozida', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Cenoura crua', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Chuchu cozido', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado'],
  },
  {
    name: 'Arroz Integral com Peixe',
    items: [
      { foodName: 'Filé de peixe grelhado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Arroz integral cozido', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Alface', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['fit', 'equilibrado'],
  },
  {
    name: 'Macarrão com Carne Moída',
    items: [
      { foodName: 'Macarrão cozido', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Carne moída refogada', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Tomate', role: 'complemento', defaultServings: 0.5, adjustable: false },
      { foodName: 'Queijo prato', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado'],
  },
  {
    name: 'Jantar Low Carb',
    items: [
      { foodName: 'Alcatra grelhada', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Espinafre cozido', role: 'acompanhamento', defaultServings: 1.5, adjustable: false },
      { foodName: 'Abacate', role: 'complemento', defaultServings: 0.5, adjustable: true },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['low_carb', 'cetogenica', 'high_protein'],
  },
  {
    name: 'Acém com Mandioca',
    items: [
      { foodName: 'Acém cozido', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Mandioca cozida', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Couve refogada', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional'],
  },
  {
    name: 'Salmão com Quinoa',
    items: [
      { foodName: 'Salmão grelhado', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Quinoa cozida', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Brócolis cozido', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Azeite de oliva', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['fit', 'high_protein'],
  },
  {
    name: 'Kibe com Tabule',
    items: [
      { foodName: 'Kibe assado', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Tabule', role: 'acompanhamento', defaultServings: 1.5, adjustable: true },
      { foodName: 'Babaganuche', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['equilibrado', 'tradicional'],
  },
  {
    name: 'Kafta com Salada',
    items: [
      { foodName: 'Kafta grelhada', role: 'principal', defaultServings: 1.5, adjustable: true },
      { foodName: 'Alface', role: 'acompanhamento', defaultServings: 1, adjustable: false },
      { foodName: 'Tomate', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Homus', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['low_carb', 'high_protein'],
  },
]

// ============================================================
// LANCHE (15 templates)
// ============================================================

export const LANCHE_TEMPLATES: MealTemplate[] = [
  {
    name: 'Iogurte com Castanhas',
    items: [
      { foodName: 'Iogurte grego', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Castanha de caju', role: 'acompanhamento', defaultServings: 0.5, adjustable: true },
      { foodName: 'Mel', role: 'complemento', defaultServings: 0.5, adjustable: false },
    ],
    tags: ['rapido', 'equilibrado'],
  },
  {
    name: 'Frutas com Pasta de Amendoim',
    items: [
      { foodName: 'Banana', role: 'principal', defaultServings: 1, adjustable: false },
      { foodName: 'Pasta de amendoim', role: 'acompanhamento', defaultServings: 1, adjustable: true },
    ],
    tags: ['rapido', 'fit', 'equilibrado'],
  },
  {
    name: 'Shake Proteico',
    items: [
      { foodName: 'Whey protein (scoop)', role: 'principal', defaultServings: 1, adjustable: false },
      { foodName: 'Banana', role: 'acompanhamento', defaultServings: 1, adjustable: false },
      { foodName: 'Leite integral', role: 'complemento', defaultServings: 0.5, adjustable: true },
    ],
    tags: ['fit', 'high_protein', 'rapido'],
  },
  {
    name: 'Mix de Nuts com Fruta',
    items: [
      { foodName: 'Mix de nuts', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Maçã', role: 'acompanhamento', defaultServings: 1, adjustable: false },
    ],
    tags: ['rapido', 'low_carb'],
  },
  {
    name: 'Açaí com Granola',
    items: [
      { foodName: 'Açaí (polpa)', role: 'principal', defaultServings: 2, adjustable: true },
      { foodName: 'Granola', role: 'acompanhamento', defaultServings: 0.5, adjustable: true },
      { foodName: 'Banana', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['equilibrado'],
  },
  {
    name: 'Pão de Queijo com Café',
    items: [
      { foodName: 'Pão de queijo', role: 'principal', defaultServings: 2, adjustable: true },
      { foodName: 'Café sem açúcar', role: 'bebida', defaultServings: 1, adjustable: false },
    ],
    tags: ['rapido', 'tradicional'],
  },
  {
    name: 'Sanduíche Natural',
    items: [
      { foodName: 'Pão integral', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Peito de peru', role: 'acompanhamento', defaultServings: 2, adjustable: true },
      { foodName: 'Queijo minas frescal', role: 'complemento', defaultServings: 1, adjustable: false },
      { foodName: 'Alface', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['equilibrado', 'high_protein'],
  },
  {
    name: 'Iogurte com Aveia',
    items: [
      { foodName: 'Iogurte natural integral', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Aveia em flocos', role: 'acompanhamento', defaultServings: 1, adjustable: true },
      { foodName: 'Morango', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['fit', 'equilibrado'],
  },
  {
    name: 'Barra de Proteína com Fruta',
    items: [
      { foodName: 'Barra de proteína', role: 'principal', defaultServings: 1, adjustable: false },
      { foodName: 'Maçã', role: 'acompanhamento', defaultServings: 1, adjustable: false },
    ],
    tags: ['rapido', 'high_protein'],
  },
  {
    name: 'Abacate com Limão',
    items: [
      { foodName: 'Abacate', role: 'principal', defaultServings: 1, adjustable: true },
      { foodName: 'Limão', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['low_carb', 'cetogenica', 'rapido'],
  },
  {
    name: 'Esfihas com Homus',
    items: [
      { foodName: 'Esfiha aberta de carne', role: 'principal', defaultServings: 2, adjustable: true },
      { foodName: 'Homus', role: 'acompanhamento', defaultServings: 1, adjustable: false },
      { foodName: 'Coalhada seca', role: 'complemento', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'equilibrado'],
  },
  {
    name: 'Kibe Frito com Coalhada',
    items: [
      { foodName: 'Kibe frito', role: 'principal', defaultServings: 2, adjustable: true },
      { foodName: 'Coalhada seca', role: 'acompanhamento', defaultServings: 1, adjustable: false },
    ],
    tags: ['tradicional', 'rapido'],
  },
]

// ============================================================
// Mapa por tipo de refeição
// ============================================================

export const TEMPLATES_BY_MEAL: Record<string, MealTemplate[]> = {
  cafe_da_manha: CAFE_TEMPLATES,
  almoco: ALMOCO_TEMPLATES,
  jantar: JANTAR_TEMPLATES,
  lanche: LANCHE_TEMPLATES,
}
