import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDefaultUserId } from '@/lib/user'

// GET /api/streak — Get streak for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')

    const resolvedUserId = userId || await getDefaultUserId()
    if (!resolvedUserId) {
      return NextResponse.json(
        { error: 'Nenhum usuario cadastrado' },
        { status: 404 }
      )
    }

    const streak = await prisma.streak.findUnique({
      where: { userId: resolvedUserId },
    })

    if (!streak) {
      return NextResponse.json({
        current: 0,
        longest: 0,
        lastLogDate: null,
      })
    }

    return NextResponse.json({
      current: streak.currentStreak,
      longest: streak.longestStreak,
      lastLogDate: streak.lastLogDate,
    })
  } catch (error) {
    console.error('GET /api/streak error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar streak' },
      { status: 500 }
    )
  }
}
