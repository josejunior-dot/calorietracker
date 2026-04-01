export const MEAL_TYPES = [
  { key: 'cafe_da_manha', label: 'Café da Manhã', icon: 'Coffee', emoji: '☕' },
  { key: 'almoco', label: 'Almoço', icon: 'Sun', emoji: '🍽️' },
  { key: 'jantar', label: 'Jantar', icon: 'Moon', emoji: '🌙' },
  { key: 'lanche', label: 'Lanche', icon: 'Cookie', emoji: '🍪' },
] as const

export const ACTIVITY_LEVELS = [
  { key: 'sedentario', label: 'Sedentário', description: 'Pouco ou nenhum exercício', factor: 1.2 },
  { key: 'leve', label: 'Levemente Ativo', description: 'Exercício leve 1-3 dias/semana', factor: 1.375 },
  { key: 'moderado', label: 'Moderadamente Ativo', description: 'Exercício moderado 3-5 dias/semana', factor: 1.55 },
  { key: 'ativo', label: 'Muito Ativo', description: 'Exercício pesado 6-7 dias/semana', factor: 1.725 },
  { key: 'muito_ativo', label: 'Extremamente Ativo', description: 'Exercício intenso + trabalho braçal', factor: 1.9 },
] as const

export const GOALS = [
  { key: 'perder', label: 'Perder Peso', icon: 'TrendingDown', color: 'text-blue-500' },
  { key: 'manter', label: 'Manter Peso', icon: 'Minus', color: 'text-green-500' },
  { key: 'ganhar', label: 'Ganhar Peso', icon: 'TrendingUp', color: 'text-orange-500' },
] as const

export const FOOD_CATEGORIES = [
  { key: 'frutas', label: 'Frutas', emoji: '🍎' },
  { key: 'carnes', label: 'Carnes e Proteínas', emoji: '🥩' },
  { key: 'graos', label: 'Grãos e Cereais', emoji: '🌾' },
  { key: 'laticinios', label: 'Laticínios', emoji: '🥛' },
  { key: 'legumes', label: 'Legumes e Verduras', emoji: '🥦' },
  { key: 'paes', label: 'Pães e Massas', emoji: '🍞' },
  { key: 'bebidas', label: 'Bebidas', emoji: '☕' },
  { key: 'refeicoes', label: 'Refeições Típicas', emoji: '🍲' },
  { key: 'industrializados', label: 'Industrializados', emoji: '📦' },
  { key: 'oleos', label: 'Óleos e Condimentos', emoji: '🫒' },
] as const

export const MACRO_COLORS = {
  protein: { bg: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-100' },
  carbs: { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-100' },
  fat: { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-100' },
} as const
