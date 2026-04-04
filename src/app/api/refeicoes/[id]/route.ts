import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/refeicoes/[id] — Update servings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { servings } = await request.json()

    if (typeof servings !== 'number' || servings < 0.1 || servings > 20) {
      return NextResponse.json(
        { error: 'Porção deve ser entre 0.1 e 20' },
        { status: 400 }
      )
    }

    const entry = await prisma.mealEntry.findUnique({
      where: { id },
      include: { food: true },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Entrada nao encontrada' },
        { status: 404 }
      )
    }

    const calories = entry.food.calories * servings
    const protein = entry.food.protein * servings
    const carbs = entry.food.carbs * servings
    const fat = entry.food.fat * servings

    const updated = await prisma.mealEntry.update({
      where: { id },
      data: { servings, calories, protein, carbs, fat },
      include: { food: true },
    })

    // Recalculate DailyLog totals
    const allEntries = await prisma.mealEntry.findMany({
      where: { userId: entry.userId, date: entry.date },
    })

    const totals = allEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )

    await prisma.dailyLog.upsert({
      where: { userId_date: { userId: entry.userId, date: entry.date } },
      create: {
        userId: entry.userId,
        date: entry.date,
        caloriesTarget: 2000,
        caloriesConsumed: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
      },
      update: {
        caloriesConsumed: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/refeicoes/[id] error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar entrada' },
      { status: 500 }
    )
  }
}

// DELETE /api/refeicoes/[id] — Delete a meal entry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the entry to know userId and date
    const entry = await prisma.mealEntry.findUnique({
      where: { id },
      select: { userId: true, date: true },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Entrada nao encontrada' },
        { status: 404 }
      )
    }

    // Delete
    await prisma.mealEntry.delete({ where: { id } })

    // Recalculate DailyLog totals for that date
    const remaining = await prisma.mealEntry.findMany({
      where: { userId: entry.userId, date: entry.date },
    })

    const caloriesConsumed = remaining.reduce((s, e) => s + e.calories, 0)
    const protein = remaining.reduce((s, e) => s + e.protein, 0)
    const carbs = remaining.reduce((s, e) => s + e.carbs, 0)
    const fat = remaining.reduce((s, e) => s + e.fat, 0)

    await prisma.dailyLog.upsert({
      where: { userId_date: { userId: entry.userId, date: entry.date } },
      create: {
        userId: entry.userId,
        date: entry.date,
        caloriesTarget: 2000,
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/refeicoes/[id] error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar entrada' },
      { status: 500 }
    )
  }
}
