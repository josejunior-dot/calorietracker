import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
