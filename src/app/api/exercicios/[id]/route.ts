import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/exercicios/[id] — Delete exercise entry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get entry
    const entry = await prisma.exerciseEntry.findUnique({
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
    await prisma.exerciseEntry.delete({ where: { id } })

    // Recalculate DailyLog.caloriesBurned
    const remaining = await prisma.exerciseEntry.findMany({
      where: { userId: entry.userId, date: entry.date },
    })

    const caloriesBurned = remaining.reduce((s, e) => s + e.caloriesBurned, 0)

    await prisma.dailyLog.upsert({
      where: { userId_date: { userId: entry.userId, date: entry.date } },
      create: {
        userId: entry.userId,
        date: entry.date,
        caloriesTarget: 2000,
        caloriesBurned,
      },
      update: {
        caloriesBurned,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/exercicios/[id] error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar exercicio' },
      { status: 500 }
    )
  }
}
