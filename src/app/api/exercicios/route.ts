import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exerciseEntrySchema } from '@/types'
import { getDefaultUserId } from '@/lib/user'

// GET /api/exercicios — Search exercises or get entries for a date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')
    const date = searchParams.get('date')
    const userId = searchParams.get('userId')

    // Search exercises by name
    if (search !== null) {
      const exercises = await prisma.exercise.findMany({
        where: search
          ? { name: { contains: search, mode: 'insensitive' } }
          : {},
        take: 20,
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(exercises)
    }

    // Get exercise entries for a date
    if (date) {
      const resolvedUserId = userId || await getDefaultUserId()
      if (!resolvedUserId) {
        return NextResponse.json(
          { error: 'Nenhum usuario cadastrado' },
          { status: 404 }
        )
      }

      const entries = await prisma.exerciseEntry.findMany({
        where: { userId: resolvedUserId, date },
        include: { exercise: true },
        orderBy: { createdAt: 'asc' },
      })

      const totalBurned = entries.reduce((s, e) => s + e.caloriesBurned, 0)

      return NextResponse.json({ entries, totalBurned: Math.round(totalBurned) })
    }

    return NextResponse.json(
      { error: 'Informe "search" ou "date" + "userId"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('GET /api/exercicios error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar exercicios' },
      { status: 500 }
    )
  }
}

// POST /api/exercicios — Add exercise entry
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

    // Validate
    const parsed = exerciseEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { exerciseId, date, durationMin } = parsed.data

    // Fetch exercise and user
    const [exercise, user] = await Promise.all([
      prisma.exercise.findUnique({ where: { id: exerciseId } }),
      prisma.user.findUnique({
        where: { id: resolvedUserId },
        select: { weight: true, dailyCalTarget: true },
      }),
    ])

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercicio nao encontrado' },
        { status: 404 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario nao encontrado' },
        { status: 404 }
      )
    }

    // Calculate calories burned adjusted for user weight (base is 70kg)
    const caloriesBurned =
      exercise.caloriesPerMinBase * (user.weight / 70) * durationMin

    // Create entry
    const entry = await prisma.exerciseEntry.create({
      data: {
        userId: resolvedUserId,
        exerciseId,
        date,
        durationMin,
        caloriesBurned,
      },
      include: { exercise: true },
    })

    // Update DailyLog.caloriesBurned
    await recalculateExerciseDailyLog(resolvedUserId, date, user.dailyCalTarget)

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('POST /api/exercicios error:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar exercicio' },
      { status: 500 }
    )
  }
}

/** Recalculate DailyLog.caloriesBurned from all ExerciseEntries for user+date */
async function recalculateExerciseDailyLog(
  userId: string,
  date: string,
  dailyCalTarget?: number | null
) {
  const entries = await prisma.exerciseEntry.findMany({
    where: { userId, date },
  })

  const caloriesBurned = entries.reduce((s, e) => s + e.caloriesBurned, 0)

  await prisma.dailyLog.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      caloriesTarget: dailyCalTarget ?? 2000,
      caloriesBurned,
    },
    update: {
      caloriesBurned,
    },
  })
}
