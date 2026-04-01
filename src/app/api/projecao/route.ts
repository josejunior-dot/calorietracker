import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDefaultUserId } from '@/lib/user'
import { calculateAllMetrics } from '@/lib/bmr'
import {
  calculateProjection,
  calculateDailyDeficit,
  weeksToGoal,
  formatProjectionSummary,
} from '@/lib/projection'
import { toISODate } from '@/lib/date'

// GET /api/projecao — Projecao de peso
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    const weeks = Math.min(Math.max(parseInt(searchParams.get('weeks') ?? '12'), 1), 52)

    const resolvedUserId = userId || (await getDefaultUserId())
    if (!resolvedUserId) {
      return NextResponse.json(
        { error: 'Nenhum usuario cadastrado' },
        { status: 404 }
      )
    }

    // 1. Buscar perfil do usuario
    const user = await prisma.user.findUnique({
      where: { id: resolvedUserId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario nao encontrado' },
        { status: 404 }
      )
    }

    // 2. Calcular metricas (BMR, TDEE, etc)
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

    const dailyCalTarget = user.dailyCalTarget ?? metrics.dailyTarget

    // 3. Buscar consumo medio dos ultimos 7 dias
    const today = toISODate(new Date())
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = toISODate(sevenDaysAgo)

    const recentLogs = await prisma.dailyLog.findMany({
      where: {
        userId: resolvedUserId,
        date: {
          gte: sevenDaysAgoStr,
          lte: today,
        },
      },
      orderBy: { date: 'desc' },
    })

    const hasActualData = recentLogs.length > 0
    let avgDailyConsumed = 0
    let avgDailyBurned = 0

    if (hasActualData) {
      avgDailyConsumed = Math.round(
        recentLogs.reduce((s, l) => s + l.caloriesConsumed, 0) / recentLogs.length
      )
      avgDailyBurned = Math.round(
        recentLogs.reduce((s, l) => s + l.caloriesBurned, 0) / recentLogs.length
      )
    }

    // 4. Projecao baseada na META
    const goalWeight = user.goal === 'perder'
      ? user.weight - user.goalKgPerWeek * weeks
      : user.goal === 'ganhar'
        ? user.weight + user.goalKgPerWeek * weeks
        : undefined

    const basedOnTarget = calculateProjection({
      currentWeight: user.weight,
      goalWeight: goalWeight,
      dailyCalTarget,
      tdee: metrics.tdee,
      weeks,
      height: user.height,
      age: metrics.age,
      gender: user.gender,
      activityLevel: user.activityLevel,
    })

    // 5. Projecao baseada no consumo REAL (ultimos 7 dias)
    let basedOnActual = null
    if (hasActualData) {
      const actualDailyIntake = avgDailyConsumed - avgDailyBurned
      basedOnActual = calculateProjection({
        currentWeight: user.weight,
        goalWeight: goalWeight,
        dailyCalTarget: actualDailyIntake,
        tdee: metrics.tdee,
        weeks,
        height: user.height,
        age: metrics.age,
        gender: user.gender,
        activityLevel: user.activityLevel,
      })
    }

    // 6. Gerar insight em pt-BR
    const activeProjection = basedOnActual ?? basedOnTarget
    let insight = formatProjectionSummary(activeProjection)

    // Adicionar tempo para meta se aplicavel
    if (goalWeight !== undefined && user.goal !== 'manter') {
      const deficit = calculateDailyDeficit(
        hasActualData ? avgDailyConsumed : dailyCalTarget,
        avgDailyBurned,
        metrics.tdee
      )
      const weeksNeeded = weeksToGoal({
        currentWeight: user.weight,
        goalWeight: goalWeight,
        dailyDeficit: deficit,
      })
      if (weeksNeeded !== Infinity && weeksNeeded > 0) {
        insight += ` Para atingir ${goalWeight.toFixed(1)}kg, serao necessarias aproximadamente ${weeksNeeded} semanas.`
      }
    }

    return NextResponse.json({
      user: {
        currentWeight: user.weight,
        goalWeight: goalWeight ?? null,
        tdee: metrics.tdee,
        dailyCalTarget,
      },
      basedOnTarget,
      basedOnActual,
      avgDailyConsumed,
      avgDailyBurned,
      insight,
    })
  } catch (error) {
    console.error('GET /api/projecao error:', error)
    return NextResponse.json(
      { error: 'Erro ao calcular projecao' },
      { status: 500 }
    )
  }
}
