import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mealEntrySchema } from '@/types'
import { updateStreak } from '@/lib/streak'
import { getDefaultUserId } from '@/lib/user'
import { MEAL_TYPES } from '@/lib/constants'

// GET /api/refeicoes — Get meal entries for a date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const date = searchParams.get('date')
    const userId = searchParams.get('userId')

    if (!date) {
      return NextResponse.json(
        { error: 'Parametro obrigatorio: date' },
        { status: 400 }
      )
    }

    const resolvedUserId = userId || await getDefaultUserId()
    if (!resolvedUserId) {
      return NextResponse.json(
        { error: 'Nenhum usuario cadastrado' },
        { status: 404 }
      )
    }

    const entries = await prisma.mealEntry.findMany({
      where: { userId: resolvedUserId, date },
      include: { food: true },
      orderBy: { createdAt: 'asc' },
    })

    // Group by mealType
    const grouped = MEAL_TYPES.map(({ key, label }) => {
      const items = entries.filter((e) => e.mealType === key)
      const totalCalories = items.reduce((sum, e) => sum + e.calories, 0)
      return {
        type: key,
        label,
        totalCalories: Math.round(totalCalories),
        items,
      }
    })

    const totals = {
      calories: Math.round(entries.reduce((s, e) => s + e.calories, 0)),
      protein: Math.round(entries.reduce((s, e) => s + e.protein, 0) * 10) / 10,
      carbs: Math.round(entries.reduce((s, e) => s + e.carbs, 0) * 10) / 10,
      fat: Math.round(entries.reduce((s, e) => s + e.fat, 0) * 10) / 10,
    }

    return NextResponse.json({ meals: grouped, totals })
  } catch (error) {
    console.error('GET /api/refeicoes error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar refeicoes' },
      { status: 500 }
    )
  }
}

// POST /api/refeicoes — Add meal entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    const resolvedUserId = userId || await getDefaultUserId()
    if (!resolvedUserId) {
      return NextResponse.json(
        { error: 'Nenhum usuario cadastrado' },
        { status: 404 }
      )
    }

    // Validate input
    const parsed = mealEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { foodId, date, mealType, servings } = parsed.data

    // Fetch food for nutritional values
    const food = await prisma.food.findUnique({ where: { id: foodId } })
    if (!food) {
      return NextResponse.json(
        { error: 'Alimento nao encontrado' },
        { status: 404 }
      )
    }

    // Check for similar food already in the same meal (unless user confirmed)
    const skipDuplicateCheck = body.skipDuplicateCheck === true
    if (!skipDuplicateCheck) {
      const existingEntries = await prisma.mealEntry.findMany({
        where: { userId: resolvedUserId, date, mealType },
        include: { food: true },
      })

      const baseType = extractFoodBaseType(food.name)
      if (baseType) {
        const similar = existingEntries.find(
          (e) => e.foodId !== foodId && extractFoodBaseType(e.food.name) === baseType
        )
        if (similar) {
          return NextResponse.json(
            {
              error: 'similar_food',
              message: `Ja existe "${similar.food.name}" nessa refeicao. Deseja adicionar "${food.name}" tambem?`,
              existingFood: similar.food.name,
              newFood: food.name,
            },
            { status: 409 }
          )
        }
      }
    }

    // Calculate denormalized values
    const calories = food.calories * servings
    const protein = food.protein * servings
    const carbs = food.carbs * servings
    const fat = food.fat * servings

    // Create entry
    const entry = await prisma.mealEntry.create({
      data: {
        userId: resolvedUserId,
        foodId,
        date,
        mealType,
        servings,
        calories,
        protein,
        carbs,
        fat,
      },
      include: { food: true },
    })

    // Recalculate DailyLog totals for this date
    await recalculateDailyLog(resolvedUserId, date)

    // Update streak
    await updateStreak(resolvedUserId, date)

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('POST /api/refeicoes error:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar refeicao' },
      { status: 500 }
    )
  }
}

/** Recalculate DailyLog totals from all MealEntries for a given user+date */
async function recalculateDailyLog(userId: string, date: string) {
  const entries = await prisma.mealEntry.findMany({
    where: { userId, date },
  })

  const caloriesConsumed = entries.reduce((s, e) => s + e.calories, 0)
  const protein = entries.reduce((s, e) => s + e.protein, 0)
  const carbs = entries.reduce((s, e) => s + e.carbs, 0)
  const fat = entries.reduce((s, e) => s + e.fat, 0)

  // Get user's daily target
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyCalTarget: true },
  })

  await prisma.dailyLog.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      caloriesTarget: user?.dailyCalTarget ?? 2000,
      caloriesConsumed,
      protein,
      carbs,
      fat,
    },
    update: {
      caloriesConsumed,
      protein,
      carbs,
      fat,
    },
  })
}

/**
 * Extract the "base type" of a food name so we can detect duplicates like
 * "Feijão preto cozido" vs "Feijão carioca cozido" → both are "feijao".
 * Returns null if no known base type matches.
 */
function extractFoodBaseType(name: string): string | null {
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents

  // Map of base types → keywords that identify them
  const BASE_TYPES: Record<string, string[]> = {
    feijao: ['feijao'],
    arroz: ['arroz'],
    carne: ['carne moida', 'carne bovina', 'carne de', 'patinho', 'acem', 'alcatra', 'maminha', 'picanha', 'contrafile', 'coxao', 'lagarto', 'musculo'],
    frango: ['frango', 'peito de frango', 'coxa de frango', 'sobrecoxa'],
    peixe: ['peixe', 'merluza', 'tilapia', 'salmao', 'atum', 'sardinha', 'bacalhau', 'pescada'],
    ovo: ['ovo cozido', 'ovo frito', 'ovo mexido', 'omelete', 'ovo '],
    leite: ['leite integral', 'leite desnatado', 'leite semi'],
    pao: ['pao de forma', 'pao frances', 'pao integral', 'pao de'],
    queijo: ['queijo minas', 'queijo mussarela', 'queijo prato', 'queijo coalho', 'queijo cottage', 'queijo'],
    banana: ['banana'],
    batata: ['batata doce', 'batata inglesa', 'batata cozida', 'batata frita', 'batata'],
    macarrao: ['macarrao', 'espaguete', 'penne', 'massa'],
    iogurte: ['iogurte'],
  }

  for (const [baseType, keywords] of Object.entries(BASE_TYPES)) {
    // Sort keywords by length desc so longer (more specific) matches first
    const sorted = [...keywords].sort((a, b) => b.length - a.length)
    for (const kw of sorted) {
      if (normalized.includes(kw)) return baseType
    }
  }

  return null
}
