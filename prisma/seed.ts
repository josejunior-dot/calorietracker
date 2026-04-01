import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Noom color: green < 1.0 cal/g, yellow 1.0-2.4 cal/g, orange > 2.4 cal/g
function noomColor(calories: number, servingSize: number): string {
  const density = calories / servingSize
  if (density < 1.0) return 'green'
  if (density <= 2.4) return 'yellow'
  return 'orange'
}

// Helper to build food entry
function f(
  name: string,
  category: string,
  servingSize: number,
  servingLabel: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber = 0,
  sugar = 0,
  sodium = 0,
  brand?: string
) {
  return {
    name,
    brand: brand ?? null,
    category,
    servingSize,
    servingLabel,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodium,
    noomColor: noomColor(calories, servingSize),
    isCustom: false,
  }
}

const foods = [
  // ── Frutas (15) ──
  f('Banana', 'frutas', 100, '1 unidade média', 89, 1.1, 22.8, 0.3, 2.6, 12.2, 1),
  f('Maçã', 'frutas', 150, '1 unidade média', 78, 0.4, 20.7, 0.2, 3.6, 15.5, 1),
  f('Laranja', 'frutas', 150, '1 unidade média', 70, 1.3, 17.6, 0.2, 3.6, 12.0, 0),
  f('Manga', 'frutas', 150, '1 fatia grande', 90, 1.2, 23.4, 0.4, 2.4, 20.0, 2),
  f('Mamão', 'frutas', 150, '1 fatia', 59, 0.8, 14.6, 0.2, 2.7, 11.3, 3),
  f('Abacaxi', 'frutas', 100, '1 fatia', 50, 0.5, 13.1, 0.1, 1.4, 9.9, 1),
  f('Morango', 'frutas', 100, '8 unidades', 32, 0.7, 7.7, 0.3, 2.0, 4.9, 1),
  f('Uva', 'frutas', 100, '1 cacho pequeno', 69, 0.7, 18.1, 0.2, 0.9, 15.5, 2),
  f('Melancia', 'frutas', 200, '1 fatia', 60, 1.2, 15.2, 0.3, 0.8, 12.4, 2),
  f('Goiaba', 'frutas', 100, '1 unidade', 68, 2.6, 14.3, 1.0, 5.4, 8.9, 2),
  f('Açaí (polpa)', 'frutas', 100, '100g', 58, 0.8, 6.2, 3.9, 2.6, 0.0, 7),
  f('Abacate', 'frutas', 100, '½ unidade', 160, 2.0, 8.5, 14.7, 6.7, 0.7, 7),
  f('Pera', 'frutas', 150, '1 unidade', 86, 0.5, 22.7, 0.2, 4.7, 14.7, 2),
  f('Kiwi', 'frutas', 75, '1 unidade', 46, 0.8, 10.9, 0.4, 2.3, 6.8, 2),
  f('Limão', 'frutas', 50, '1 unidade', 15, 0.2, 5.0, 0.1, 1.4, 1.3, 1),

  // ── Carnes/Proteínas (15) ──
  f('Frango peito grelhado', 'carnes', 100, '100g', 165, 31.0, 0.0, 3.6, 0, 0, 74),
  f('Patinho grelhado', 'carnes', 100, '100g', 219, 35.9, 0.0, 7.3, 0, 0, 56),
  f('Carne suína (lombo)', 'carnes', 100, '100g', 242, 27.3, 0.0, 14.0, 0, 0, 62),
  f('Tilápia grelhada', 'carnes', 100, '100g', 128, 26.2, 0.0, 2.7, 0, 0, 56),
  f('Salmão grelhado', 'carnes', 100, '100g', 208, 20.4, 0.0, 13.4, 0, 0, 59),
  f('Ovo cozido', 'carnes', 50, '1 unidade', 78, 6.3, 0.6, 5.3, 0, 0.6, 62),
  f('Atum em lata', 'carnes', 60, '1 lata pequena', 70, 15.5, 0.0, 0.8, 0, 0, 240),
  f('Sardinha em lata', 'carnes', 84, '1 lata', 168, 20.0, 0.0, 9.5, 0, 0, 380),
  f('Carne moída refogada', 'carnes', 100, '100g', 212, 26.1, 0.0, 11.2, 0, 0, 72),
  f('Linguiça calabresa', 'carnes', 50, '1 gomo', 156, 7.4, 1.5, 13.4, 0, 0.5, 520),
  f('Peito de peru', 'carnes', 40, '2 fatias', 42, 7.8, 1.2, 0.6, 0, 0.8, 440),
  f('Camarão cozido', 'carnes', 100, '100g', 99, 20.9, 0.2, 1.7, 0, 0, 111),
  f('Frango coxa assada', 'carnes', 100, '100g', 209, 26.0, 0.0, 10.9, 0, 0, 88),
  f('Costela bovina assada', 'carnes', 100, '100g', 292, 24.1, 0.0, 21.2, 0, 0, 63),
  f('Filé de peixe grelhado', 'carnes', 100, '100g', 118, 24.0, 0.0, 2.0, 0, 0, 65),

  // ── Grãos/Cereais (12) ──
  f('Arroz branco cozido', 'graos', 100, '4 colheres', 130, 2.7, 28.2, 0.3, 0.4, 0, 1),
  f('Arroz integral cozido', 'graos', 100, '4 colheres', 111, 2.6, 23.0, 0.9, 1.8, 0, 5),
  f('Feijão preto cozido', 'graos', 100, '1 concha', 77, 4.5, 14.0, 0.5, 8.7, 0.3, 2),
  f('Feijão carioca cozido', 'graos', 100, '1 concha', 76, 4.8, 13.6, 0.5, 8.5, 0.3, 2),
  f('Lentilha cozida', 'graos', 100, '3 colheres', 116, 9.0, 20.1, 0.4, 7.9, 1.8, 2),
  f('Aveia em flocos', 'graos', 30, '3 colheres', 117, 4.2, 20.1, 2.1, 3.2, 0.3, 1),
  f('Granola', 'graos', 40, '¼ xícara', 180, 3.6, 28.0, 6.4, 2.8, 10.0, 12),
  f('Milho cozido', 'graos', 100, '1 espiga', 96, 3.2, 21.0, 1.2, 2.4, 3.2, 1),
  f('Ervilha cozida', 'graos', 100, '3 colheres', 81, 5.4, 14.5, 0.4, 5.1, 5.7, 5),
  f('Grão de bico cozido', 'graos', 100, '3 colheres', 164, 8.9, 27.4, 2.6, 7.6, 4.8, 7),
  f('Quinoa cozida', 'graos', 100, '4 colheres', 120, 4.4, 21.3, 1.9, 2.8, 0.9, 7),
  f('Farinha de mandioca', 'graos', 30, '2 colheres', 107, 0.5, 26.2, 0.1, 2.7, 0.3, 1),

  // ── Laticínios (10) ──
  f('Leite integral', 'laticinios', 200, '1 copo', 122, 6.2, 9.4, 6.6, 0, 10.0, 86),
  f('Leite desnatado', 'laticinios', 200, '1 copo', 68, 6.6, 10.0, 0.4, 0, 10.0, 100),
  f('Iogurte natural integral', 'laticinios', 170, '1 pote', 104, 6.0, 7.7, 5.4, 0, 7.7, 78),
  f('Queijo minas frescal', 'laticinios', 30, '1 fatia', 74, 5.2, 0.9, 5.7, 0, 0.3, 150),
  f('Queijo mussarela', 'laticinios', 30, '1 fatia', 90, 6.6, 0.6, 6.9, 0, 0.3, 180),
  f('Requeijão cremoso', 'laticinios', 30, '1 colher', 81, 1.7, 0.9, 8.0, 0, 0.9, 120),
  f('Iogurte grego', 'laticinios', 100, '1 pote pequeno', 97, 9.0, 5.0, 5.0, 0, 4.0, 50),
  f('Cream cheese', 'laticinios', 30, '1 colher', 99, 1.8, 1.2, 9.8, 0, 0.8, 105),
  f('Queijo prato', 'laticinios', 30, '1 fatia', 109, 7.1, 0.3, 8.8, 0, 0.3, 195),
  f('Manteiga', 'laticinios', 10, '1 colher chá', 72, 0.1, 0.0, 8.1, 0, 0, 65),

  // ── Legumes/Verduras (15) ──
  f('Alface', 'legumes', 50, '3 folhas', 7, 0.5, 1.2, 0.1, 0.6, 0.4, 5),
  f('Tomate', 'legumes', 100, '1 unidade', 18, 0.9, 3.9, 0.2, 1.2, 2.6, 5),
  f('Cenoura crua', 'legumes', 80, '1 unidade média', 33, 0.7, 7.6, 0.2, 2.2, 3.8, 55),
  f('Brócolis cozido', 'legumes', 100, '4 floretes', 35, 2.4, 7.2, 0.4, 3.3, 1.4, 41),
  f('Abobrinha refogada', 'legumes', 100, '3 colheres', 20, 1.2, 3.4, 0.3, 1.0, 2.5, 8),
  f('Batata doce cozida', 'legumes', 100, '1 unidade pequena', 86, 1.6, 20.1, 0.1, 3.0, 4.2, 36),
  f('Batata inglesa cozida', 'legumes', 100, '1 unidade média', 77, 1.9, 17.5, 0.1, 1.8, 0.8, 6),
  f('Mandioca cozida', 'legumes', 100, '2 pedaços', 125, 0.6, 30.1, 0.3, 1.8, 1.7, 14),
  f('Chuchu cozido', 'legumes', 100, '3 colheres', 17, 0.4, 3.5, 0.1, 1.6, 1.9, 2),
  f('Couve refogada', 'legumes', 100, '3 colheres', 30, 2.5, 4.3, 0.5, 3.2, 0.5, 12),
  f('Espinafre cozido', 'legumes', 100, '3 colheres', 23, 2.9, 3.6, 0.3, 2.2, 0.4, 79),
  f('Pepino', 'legumes', 100, '½ unidade', 15, 0.7, 3.6, 0.1, 0.5, 1.7, 2),
  f('Beterraba cozida', 'legumes', 100, '3 fatias', 44, 1.7, 9.6, 0.2, 2.0, 6.8, 78),
  f('Abóbora cozida', 'legumes', 100, '2 colheres', 26, 1.0, 6.5, 0.1, 0.5, 2.8, 1),
  f('Quiabo cozido', 'legumes', 100, '5 unidades', 33, 1.9, 7.5, 0.2, 3.2, 1.5, 7),

  // ── Pães/Massas (12) ──
  f('Pão francês', 'paes', 50, '1 unidade', 150, 4.5, 28.7, 1.8, 1.4, 1.5, 320),
  f('Pão integral', 'paes', 50, '2 fatias', 124, 5.3, 23.0, 1.6, 3.0, 3.0, 260),
  f('Macarrão cozido', 'paes', 100, '1 escumadeira', 158, 5.8, 30.9, 0.9, 1.8, 0.6, 1),
  f('Tapioca', 'paes', 30, '1 unidade', 100, 0.0, 25.6, 0.0, 0, 0, 0),
  f('Cuscuz de milho', 'paes', 100, '1 fatia', 113, 2.6, 24.0, 0.5, 1.0, 0.3, 1),
  f('Biscoito cream cracker', 'paes', 30, '6 unidades', 132, 2.7, 21.0, 4.2, 0.9, 1.8, 330),
  f('Pão de forma', 'paes', 50, '2 fatias', 131, 4.4, 24.0, 1.8, 1.3, 3.5, 290),
  f('Torrada integral', 'paes', 30, '3 unidades', 120, 3.6, 21.0, 2.1, 2.4, 1.5, 210),
  f('Macarrão integral cozido', 'paes', 100, '1 escumadeira', 124, 5.3, 26.5, 0.5, 3.2, 0.6, 4),
  f('Lasanha bolonhesa', 'paes', 250, '1 pedaço', 375, 18.0, 32.5, 18.8, 2.0, 4.5, 720),
  f('Pizza margherita (fatia)', 'paes', 100, '1 fatia', 266, 11.4, 33.3, 9.8, 2.0, 3.6, 560),
  f('Miojo (lamen)', 'paes', 85, '1 pacote', 380, 8.0, 52.0, 15.0, 2.0, 2.0, 1500),

  // ── Bebidas (10) ──
  f('Café sem açúcar', 'bebidas', 100, '1 xícara', 2, 0.3, 0.0, 0.0, 0, 0, 5),
  f('Suco de laranja natural', 'bebidas', 250, '1 copo', 112, 1.7, 25.8, 0.5, 0.5, 20.8, 2),
  f('Refrigerante cola', 'bebidas', 350, '1 lata', 140, 0.0, 35.0, 0.0, 0, 35.0, 45),
  f('Água de coco', 'bebidas', 200, '1 copo', 38, 0.4, 8.8, 0.2, 0, 6.2, 42),
  f('Cerveja', 'bebidas', 350, '1 lata', 153, 1.6, 12.6, 0.0, 0, 0, 14),
  f('Suco verde', 'bebidas', 250, '1 copo', 55, 1.5, 12.0, 0.3, 1.5, 8.0, 20),
  f('Chá sem açúcar', 'bebidas', 200, '1 xícara', 2, 0.0, 0.5, 0.0, 0, 0, 7),
  f('Leite com chocolate', 'bebidas', 200, '1 copo', 180, 5.0, 28.0, 5.0, 1.0, 24.0, 120),
  f('Vitamina de banana', 'bebidas', 300, '1 copo', 210, 7.0, 38.0, 3.5, 1.5, 25.0, 80),
  f('Isotônico', 'bebidas', 500, '1 garrafa', 130, 0.0, 32.0, 0.0, 0, 30.0, 210),

  // ── Refeições Típicas (12) ──
  f('Feijoada (porção)', 'refeicoes', 200, '1 concha cheia', 338, 18.4, 16.2, 22.8, 6.0, 1.2, 680),
  f('Pão de queijo', 'refeicoes', 40, '1 unidade', 108, 2.8, 12.4, 5.2, 0.2, 0.8, 220),
  f('Coxinha', 'refeicoes', 80, '1 unidade', 224, 7.2, 22.4, 12.0, 0.8, 1.0, 380),
  f('Açaí com granola', 'refeicoes', 300, '1 tigela', 465, 5.4, 72.0, 16.5, 4.5, 42.0, 30),
  f('Brigadeiro', 'refeicoes', 25, '1 unidade', 80, 1.0, 12.5, 2.8, 0.2, 10.5, 15),
  f('Empada de frango', 'refeicoes', 60, '1 unidade', 186, 5.4, 16.2, 11.0, 0.5, 0.8, 250),
  f('Esfiha de carne', 'refeicoes', 80, '1 unidade', 196, 7.2, 22.4, 8.4, 0.8, 1.5, 340),
  f('Pastel de carne', 'refeicoes', 100, '1 unidade', 298, 8.5, 28.0, 16.5, 1.0, 1.2, 420),
  f('Bauru', 'refeicoes', 150, '1 unidade', 345, 15.0, 32.0, 17.0, 1.5, 3.0, 680),
  f('Misto quente', 'refeicoes', 100, '1 unidade', 260, 11.0, 27.0, 12.0, 1.0, 2.0, 540),
  f('Estrogonofe de frango', 'refeicoes', 200, '1 porção', 310, 24.0, 10.0, 19.0, 0.5, 3.5, 520),
  f('Arroz carreteiro', 'refeicoes', 200, '1 porção', 340, 16.0, 38.0, 13.0, 1.8, 1.0, 480),

  // ── Industrializados/Suplementos (10) ──
  f('Barra de cereal', 'industrializados', 25, '1 unidade', 100, 1.5, 18.0, 2.5, 1.0, 7.0, 50),
  f('Whey protein (scoop)', 'industrializados', 30, '1 scoop', 120, 24.0, 3.0, 1.5, 0, 1.5, 80),
  f('Pasta de amendoim', 'industrializados', 20, '1 colher sopa', 118, 5.0, 3.4, 10.0, 1.2, 1.6, 4),
  f('Castanha de caju', 'industrializados', 30, '10 unidades', 174, 5.4, 9.0, 13.2, 1.0, 1.8, 4),
  f('Mix de nuts', 'industrializados', 30, '1 punhado', 170, 4.8, 8.4, 14.1, 1.5, 2.4, 3),
  f('Barra de proteína', 'industrializados', 45, '1 unidade', 170, 15.0, 18.0, 5.0, 3.0, 4.0, 120),
  f('Albumina (dose)', 'industrializados', 30, '2 colheres', 112, 24.0, 2.4, 0.3, 0, 0, 300),
  f('Creatina', 'industrializados', 5, '1 dose', 0, 0.0, 0.0, 0.0, 0, 0, 0),
  f('BCAA (dose)', 'industrializados', 10, '1 dose', 40, 10.0, 0.0, 0.0, 0, 0, 0),
  f('Dextrose (dose)', 'industrializados', 30, '1 dose', 120, 0.0, 30.0, 0.0, 0, 0, 10),

  // ── Óleos/Condimentos (8) ──
  f('Azeite de oliva', 'oleos', 13, '1 colher sopa', 117, 0.0, 0.0, 13.0, 0, 0, 0),
  f('Óleo de soja', 'oleos', 13, '1 colher sopa', 117, 0.0, 0.0, 13.0, 0, 0, 0),
  f('Sal', 'oleos', 1, '1 pitada', 0, 0.0, 0.0, 0.0, 0, 0, 388),
  f('Açúcar', 'oleos', 5, '1 colher chá', 20, 0.0, 5.0, 0.0, 0, 5.0, 0),
  f('Mel', 'oleos', 21, '1 colher sopa', 64, 0.1, 17.3, 0.0, 0, 17.1, 1),
  f('Ketchup', 'oleos', 15, '1 colher sopa', 17, 0.2, 4.3, 0.0, 0, 3.6, 167),
  f('Maionese', 'oleos', 15, '1 colher sopa', 100, 0.2, 0.5, 11.0, 0, 0.3, 90),
  f('Mostarda', 'oleos', 10, '1 colher chá', 7, 0.4, 0.5, 0.4, 0.3, 0.2, 135),
]

const exercises = [
  // ── Cardio ──
  { name: 'Caminhada', category: 'cardio', caloriesPerMinBase: 4.5, icon: '🚶' },
  { name: 'Corrida', category: 'cardio', caloriesPerMinBase: 10.0, icon: '🏃' },
  { name: 'Ciclismo', category: 'cardio', caloriesPerMinBase: 7.5, icon: '🚴' },
  { name: 'Natação', category: 'cardio', caloriesPerMinBase: 8.0, icon: '🏊' },
  { name: 'Pular corda', category: 'cardio', caloriesPerMinBase: 12.0, icon: '⏫' },
  { name: 'Elíptico', category: 'cardio', caloriesPerMinBase: 7.0, icon: '🔄' },
  { name: 'Esteira', category: 'cardio', caloriesPerMinBase: 8.0, icon: '🏃' },
  { name: 'Spinning', category: 'cardio', caloriesPerMinBase: 9.0, icon: '🚲' },

  // ── Musculação ──
  { name: 'Musculação', category: 'musculacao', caloriesPerMinBase: 5.5, icon: '🏋️' },
  { name: 'CrossFit', category: 'musculacao', caloriesPerMinBase: 10.0, icon: '💪' },
  { name: 'Funcional (academia)', category: 'musculacao', caloriesPerMinBase: 7.0, icon: '🔥' },

  // ── Esportes ──
  { name: 'Futebol', category: 'esportes', caloriesPerMinBase: 8.0, icon: '⚽' },
  { name: 'Vôlei', category: 'esportes', caloriesPerMinBase: 5.0, icon: '🏐' },
  { name: 'Basquete', category: 'esportes', caloriesPerMinBase: 7.5, icon: '🏀' },
  { name: 'Tênis', category: 'esportes', caloriesPerMinBase: 7.0, icon: '🎾' },
  { name: 'Handball', category: 'esportes', caloriesPerMinBase: 8.0, icon: '🤾' },
  { name: 'Surf', category: 'esportes', caloriesPerMinBase: 6.0, icon: '🏄' },
  { name: 'Jiu-Jitsu', category: 'esportes', caloriesPerMinBase: 9.0, icon: '🥋' },
  { name: 'Boxe', category: 'esportes', caloriesPerMinBase: 10.0, icon: '🥊' },

  // ── Flexibilidade ──
  { name: 'Yoga', category: 'flexibilidade', caloriesPerMinBase: 3.0, icon: '🧘' },
  { name: 'Pilates', category: 'flexibilidade', caloriesPerMinBase: 4.0, icon: '🤸' },
  { name: 'Alongamento', category: 'flexibilidade', caloriesPerMinBase: 2.5, icon: '🙆' },

  // ── Funcional ──
  { name: 'HIIT', category: 'funcional', caloriesPerMinBase: 11.0, icon: '⚡' },
  { name: 'Dança', category: 'funcional', caloriesPerMinBase: 6.0, icon: '💃' },
  { name: 'Luta', category: 'funcional', caloriesPerMinBase: 9.0, icon: '🥊' },
  { name: 'Trilha', category: 'funcional', caloriesPerMinBase: 6.5, icon: '🥾' },
  { name: 'Patins', category: 'funcional', caloriesPerMinBase: 7.0, icon: '⛸️' },
  { name: 'Hidroginástica', category: 'funcional', caloriesPerMinBase: 5.0, icon: '🏊' },
  { name: 'Remo', category: 'funcional', caloriesPerMinBase: 8.0, icon: '🚣' },
  { name: 'Escada', category: 'funcional', caloriesPerMinBase: 9.0, icon: '🪜' },
]

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.mealEntry.deleteMany()
  await prisma.exerciseEntry.deleteMany()
  await prisma.weightLog.deleteMany()
  await prisma.dailyLog.deleteMany()
  await prisma.streak.deleteMany()
  await prisma.user.deleteMany()
  await prisma.food.deleteMany()
  await prisma.exercise.deleteMany()

  // Seed foods
  const result = await prisma.food.createMany({ data: foods })
  console.log(`Created ${result.count} foods`)

  // Seed exercises
  const exResult = await prisma.exercise.createMany({ data: exercises })
  console.log(`Created ${exResult.count} exercises`)

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
