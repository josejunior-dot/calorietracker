import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MEAL_TYPES } from '@/lib/constants'
import type { DashboardData } from '@/types'

// GET /api/dashboard — Dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    const date =
      searchParams.get('date') || new Date().toISOString().split('T')[0]

    if (!userId) {
      return NextResponse.json(
        { error: 'userId e obrigatorio' },
        { status: 400 }
      )
    }

    // 1. Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, dailyCalTarget: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario nao encontrado' },
        { status: 404 }
      )
    }

    const target = user.dailyCalTarget ?? 2000

    // 2. Get or create DailyLog
    const dailyLog = await prisma.dailyLog.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        caloriesTarget: target,
      },
      update: {},
    })

    // 3. Calculate macro targets
    // Protein: 25% of calories / 4 cal per gram
    // Carbs: 50% of calories / 4 cal per gram
    // Fat: 25% of calories / 9 cal per gram
    const proteinTarget = Math.round((target * 0.25) / 4)
    const carbsTarget = Math.round((target * 0.5) / 4)
    const fatTarget = Math.round((target * 0.25) / 9)

    // 4. Get meal entries grouped by mealType
    const mealEntries = await prisma.mealEntry.findMany({
      where: { userId, date },
    })

    const meals = MEAL_TYPES.map(({ key, label }) => {
      const items = mealEntries.filter((e) => e.mealType === key)
      return {
        type: key,
        label,
        totalCalories: Math.round(items.reduce((s, e) => s + e.calories, 0)),
        itemCount: items.length,
      }
    })

    // 5. Get streak
    const streak = await prisma.streak.findUnique({
      where: { userId },
    })

    // 6. Calculate remaining
    const consumed = dailyLog.caloriesConsumed
    const burned = dailyLog.caloriesBurned
    const remaining = target - consumed + burned

    const data: DashboardData = {
      user: { name: user.name, dailyCalTarget: target },
      date,
      calories: {
        target,
        consumed: Math.round(consumed),
        burned: Math.round(burned),
        remaining: Math.round(remaining),
      },
      macros: {
        protein: Math.round(dailyLog.protein * 10) / 10,
        carbs: Math.round(dailyLog.carbs * 10) / 10,
        fat: Math.round(dailyLog.fat * 10) / 10,
        proteinTarget,
        carbsTarget,
        fatTarget,
      },
      meals,
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
      },
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    )
  }
}
