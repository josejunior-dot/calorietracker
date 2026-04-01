import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDefaultUserId } from '@/lib/user'
import {
  buildMealPlan,
  calculateMacroTargets,
  type FixedFoodEntry,
  type NutritionStrategy,
  type UserContext,
} from '@/lib/diet-builder'
import { calculateAllMetrics, calculateAge } from '@/lib/bmr'
import { toISODate } from '@/lib/date'
import { updateStreak } from '@/lib/streak'

// GET /api/dieta — Gerar sugestao de dieta com inteligencia nutricional
export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId()
    if (!userId) {
      return NextResponse.json(
        { error: 'Nenhum usuario cadastrado' },
        { status: 404 }
      )
    }

    // 1. Buscar perfil completo do usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        weight: true,
        height: true,
        birthDate: true,
        gender: true,
        activityLevel: true,
        goal: true,
        goalKgPerWeek: true,
        bodyFatPercent: true,
        dailyCalTarget: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario nao encontrado' },
        { status: 404 }
      )
    }

    // 2. Calcular idade e TDEE
    const age = calculateAge(user.birthDate)
    const metrics = calculateAllMetrics({
      weight: user.weight,
      height: user.height,
      birthDate: user.birthDate,
      gender: user.gender,
      activityLevel: user.activityLevel,
      goal: user.goal,
      goalKgPerWeek: user.goalKgPerWeek,
      bodyFatPercent: user.bodyFatPercent ?? undefined,
    })

    const dailyCal = user.dailyCalTarget ?? metrics.dailyTarget

    // 3. Ler parametros da query string
    const { searchParams } = request.nextUrl
    const strategy = (searchParams.get('strategy') || 'equilibrado') as NutritionStrategy

    // Overrides opcionais
    const proteinPerKgParam = searchParams.get('proteinPerKg')
    const carbsGramsParam = searchParams.get('carbsGrams')
    const overrides: { proteinPerKg?: number; carbsGrams?: number } = {}
    if (proteinPerKgParam) overrides.proteinPerKg = parseFloat(proteinPerKgParam)
    if (carbsGramsParam) overrides.carbsGrams = parseInt(carbsGramsParam)

    // 4. Montar contexto do usuario
    const userContext: UserContext = {
      weight: user.weight,
      height: user.height,
      age,
      gender: user.gender,
      activityLevel: user.activityLevel,
      goal: user.goal || 'manter',
      bodyFatPercent: user.bodyFatPercent ?? undefined,
      dailyCalTarget: dailyCal,
      tdee: metrics.tdee,
    }

    // 5. Calcular metas de macros com a estrategia e overrides
    const macros = calculateMacroTargets(userContext, strategy, overrides)

    // 5.5. Se preview=true, retornar só macros (sem gerar plano)
    const preview = searchParams.get('preview')
    if (preview === 'true') {
      return NextResponse.json({
        macros,
        user: {
          name: user.name,
          weight: user.weight,
          height: user.height,
          age,
          activityLevel: user.activityLevel,
          goal: user.goal,
          dailyCalTarget: dailyCal,
          tdee: metrics.tdee,
        },
      })
    }

    // 6. Buscar todos os alimentos nao-custom do banco
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

    // 7. Buscar alimentos fixos (Base Alimentar) do usuario
    const fixedFoodsRaw = await prisma.fixedFood.findMany({
      where: { userId },
      include: { food: true },
    })

    const fixedFoods: FixedFoodEntry[] = fixedFoodsRaw.map((ff) => ({
      foodId: ff.foodId,
      mealType: ff.mealType,
      servings: ff.servings,
      food: {
        id: ff.food.id,
        name: ff.food.name,
        calories: ff.food.calories,
        protein: ff.food.protein,
        carbs: ff.food.carbs,
        fat: ff.food.fat,
        servingLabel: ff.food.servingLabel,
        noomColor: ff.food.noomColor,
        servingSize: ff.food.servingSize,
        category: ff.food.category,
      },
    }))

    // 8. Gerar plano alimentar
    const date = toISODate(new Date())
    const plan = buildMealPlan(
      foods,
      macros,
      dailyCal,
      userContext.goal,
      date,
      fixedFoods.length > 0 ? fixedFoods : undefined
    )

    // 9. Retornar plano + macros + contexto do usuario
    return NextResponse.json({
      plan,
      macros,
      user: {
        name: user.name,
        weight: user.weight,
        height: user.height,
        age,
        activityLevel: user.activityLevel,
        goal: user.goal,
        dailyCalTarget: dailyCal,
        tdee: metrics.tdee,
      },
    })
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
