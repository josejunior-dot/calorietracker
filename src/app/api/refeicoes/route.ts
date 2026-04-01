import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mealEntrySchema } from '@/types'
import { updateStreak } from '@/lib/streak'
import { MEAL_TYPES } from '@/lib/constants'

// GET /api/refeicoes — Get meal entries for a date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const date = searchParams.get('date')
    const userId = searchParams.get('userId')

    if (!date || !userId) {
      return NextResponse.json(
        { error: 'Parametros obrigatorios: date, userId' },
        { status: 400 }
      )
    }

    const entries = await prisma.mealEntry.findMany({
      where: { userId, date },
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

    if (!userId) {
      return NextResponse.json(
        { error: 'userId e obrigatorio' },
        { status: 400 }
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

    // Calculate denormalized values
    const calories = food.calories * servings
    const protein = food.protein * servings
    const carbs = food.carbs * servings
    const fat = food.fat * servings

    // Create entry
    const entry = await prisma.mealEntry.create({
      data: {
        userId,
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
    await recalculateDailyLog(userId, date)

    // Update streak
    await updateStreak(userId, date)

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
