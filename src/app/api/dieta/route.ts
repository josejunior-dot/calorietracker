import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDefaultUserId } from '@/lib/user'
import { buildMealPlan, type DietPreferences } from '@/lib/diet-builder'
import { toISODate } from '@/lib/date'
import { updateStreak } from '@/lib/streak'

// GET /api/dieta — Gerar sugestao de dieta
export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId()
    if (!userId) {
      return NextResponse.json(
        { error: 'Nenhum usuario cadastrado' },
        { status: 404 }
      )
    }

    // Buscar perfil do usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyCalTarget: true,
        goal: true,
        weight: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario nao encontrado' },
        { status: 404 }
      )
    }

    const dailyCal = user.dailyCalTarget ?? 2000

    // Ler proporções de macros da query string (ou usar padrão)
    const { searchParams } = request.nextUrl
    const proteinPct = Math.min(60, Math.max(10, parseInt(searchParams.get('proteinPct') || '25')))
    const carbsPct = Math.min(70, Math.max(10, parseInt(searchParams.get('carbsPct') || '50')))
    const fatPct = Math.min(50, Math.max(10, parseInt(searchParams.get('fatPct') || '25')))

    const proteinTarget = Math.round((dailyCal * proteinPct / 100) / 4)
    const carbsTarget = Math.round((dailyCal * carbsPct / 100) / 4)
    const fatTarget = Math.round((dailyCal * fatPct / 100) / 9)

    const prefs: DietPreferences = {
      dailyCalTarget: dailyCal,
      proteinTarget,
      carbsTarget,
      fatTarget,
      goal: (user.goal as DietPreferences['goal']) || 'manter',
      preferHighProtein: proteinPct >= 30,
    }

    // Buscar todos os alimentos nao-custom do banco
    const foods = await prisma.food.findMany({
      where: { isCustom: false },
      orderBy: { name: 'asc' },
    })

    if (foods.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum alimento cadastrado no banco de dados' },
        { status: 400 }
      )
    }

    const date = toISODate(new Date())
    const plan = buildMealPlan(foods, prefs, date)

    return NextResponse.json({ plan, preferences: prefs })
  } catch (error) {
    console.error('GET /api/dieta error:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar dieta' },
      { status: 500 }
    )
  }
}

// POST /api/dieta — Aplicar plano de dieta ao diario
export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId()
    if (!userId) {
      return NextResponse.json(
        { error: 'Nenhum usuario cadastrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { date, meals } = body

    if (!date || !meals || !Array.isArray(meals)) {
      return NextResponse.json(
        { error: 'Parametros obrigatorios: date, meals' },
        { status: 400 }
      )
    }

    // Criar MealEntry para cada item de cada refeicao
    const entries = []
    for (const meal of meals) {
      for (const item of meal.items) {
        entries.push({
          userId,
          foodId: item.foodId,
          date,
          mealType: meal.mealType,
          servings: item.servings,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        })
      }
    }

    // Inserir em lote
    await prisma.mealEntry.createMany({ data: entries })

    // Recalcular DailyLog
    const allEntries = await prisma.mealEntry.findMany({
      where: { userId, date },
    })

    const caloriesConsumed = allEntries.reduce((s, e) => s + e.calories, 0)
    const protein = allEntries.reduce((s, e) => s + e.protein, 0)
    const carbs = allEntries.reduce((s, e) => s + e.carbs, 0)
    const fat = allEntries.reduce((s, e) => s + e.fat, 0)

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

    // Atualizar streak
    await updateStreak(userId, date)

    return NextResponse.json({
      success: true,
      entriesCreated: entries.length,
    })
  } catch (error) {
    console.error('POST /api/dieta error:', error)
    return NextResponse.json(
      { error: 'Erro ao aplicar dieta' },
      { status: 500 }
    )
  }
}
