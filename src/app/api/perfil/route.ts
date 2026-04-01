import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userProfileSchema } from '@/types'
import { calculateAllMetrics } from '@/lib/bmr'

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!user) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })
    }

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

    return NextResponse.json({
      ...user,
      ...metrics,
    })
  } catch (error) {
    console.error('GET /api/perfil error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = userProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check if user already exists
    const existingUser = await prisma.user.findFirst()
    if (existingUser) {
      return NextResponse.json(
        { error: 'Perfil ja existe. Use PUT para atualizar.' },
        { status: 409 }
      )
    }

    const metrics = calculateAllMetrics({
      weight: data.weight,
      height: data.height,
      birthDate: new Date(data.birthDate),
      gender: data.gender,
      activityLevel: data.activityLevel,
      goal: data.goal,
      goalKgPerWeek: data.goalKgPerWeek,
      bodyFatPercent: data.bodyFatPercent,
    })

    const user = await prisma.user.create({
      data: {
        name: data.name,
        gender: data.gender,
        birthDate: new Date(data.birthDate),
        height: data.height,
        weight: data.weight,
        bodyFatPercent: data.bodyFatPercent ?? null,
        activityLevel: data.activityLevel,
        goal: data.goal,
        goalKgPerWeek: data.goalKgPerWeek,
        dailyCalTarget: metrics.dailyTarget,
      },
    })

    // Create initial streak record
    await prisma.streak.create({
      data: {
        userId: user.id,
        currentStreak: 0,
        longestStreak: 0,
      },
    })

    return NextResponse.json(
      {
        ...user,
        ...metrics,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/perfil error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = userProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existingUser = await prisma.user.findFirst()
    if (!existingUser) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })
    }

    const metrics = calculateAllMetrics({
      weight: data.weight,
      height: data.height,
      birthDate: new Date(data.birthDate),
      gender: data.gender,
      activityLevel: data.activityLevel,
      goal: data.goal,
      goalKgPerWeek: data.goalKgPerWeek,
      bodyFatPercent: data.bodyFatPercent,
    })

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: data.name,
        gender: data.gender,
        birthDate: new Date(data.birthDate),
        height: data.height,
        weight: data.weight,
        bodyFatPercent: data.bodyFatPercent ?? null,
        activityLevel: data.activityLevel,
        goal: data.goal,
        goalKgPerWeek: data.goalKgPerWeek,
        dailyCalTarget: metrics.dailyTarget,
      },
    })

    return NextResponse.json({
      ...user,
      ...metrics,
    })
  } catch (error) {
    console.error('PUT /api/perfil error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
