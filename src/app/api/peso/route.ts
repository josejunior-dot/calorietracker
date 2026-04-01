import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { weightLogSchema } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })
    }

    const { searchParams } = request.nextUrl
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 365)

    const logs = await prisma.weightLog.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('GET /api/peso error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = weightLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Upsert: update if same date exists, otherwise create
    const log = await prisma.weightLog.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: data.date,
        },
      },
      update: {
        weight: data.weight,
        bodyFatPercent: data.bodyFatPercent ?? null,
        note: data.note ?? null,
      },
      create: {
        userId: user.id,
        date: data.date,
        weight: data.weight,
        bodyFatPercent: data.bodyFatPercent ?? null,
        note: data.note ?? null,
      },
    })

    // Also update user's current weight
    await prisma.user.update({
      where: { id: user.id },
      data: {
        weight: data.weight,
        ...(data.bodyFatPercent !== undefined ? { bodyFatPercent: data.bodyFatPercent } : {}),
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('POST /api/peso error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
