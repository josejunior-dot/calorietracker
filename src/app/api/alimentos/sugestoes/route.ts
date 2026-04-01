import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/alimentos/sugestoes?foodId=xxx&mealType=almoco
 *
 * Retorna sugestões de alimentos similares para substituição.
 * A lógica: busca alimentos da mesma categoria, ordena por proximidade
 * calórica e de macros, e retorna os mais parecidos.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const foodId = searchParams.get('foodId')

    if (!foodId) {
      return NextResponse.json(
        { error: 'foodId obrigatorio' },
        { status: 400 }
      )
    }

    // 1. Buscar o alimento original
    const original = await prisma.food.findUnique({ where: { id: foodId } })
    if (!original) {
      return NextResponse.json(
        { error: 'Alimento nao encontrado' },
        { status: 404 }
      )
    }

    // 2. Buscar alimentos da mesma categoria (excluindo o próprio e combos)
    const sameCategory = await prisma.food.findMany({
      where: {
        category: original.category,
        id: { not: original.id },
        isCombo: false,
      },
      orderBy: { name: 'asc' },
    })

    // 3. Calcular score de similaridade e ordenar
    const scored = sameCategory.map((f) => {
      // Proximidade calórica (quanto mais perto, melhor)
      const calDiff = Math.abs(f.calories - original.calories)
      const calScore = Math.max(0, 100 - calDiff)

      // Proximidade de macros dominante
      const origTotal = original.protein + original.carbs + original.fat || 1
      const origProtRatio = original.protein / origTotal
      const origCarbRatio = original.carbs / origTotal
      const origFatRatio = original.fat / origTotal

      const fTotal = f.protein + f.carbs + f.fat || 1
      const fProtRatio = f.protein / fTotal
      const fCarbRatio = f.carbs / fTotal
      const fFatRatio = f.fat / fTotal

      const macroDiff =
        Math.abs(origProtRatio - fProtRatio) +
        Math.abs(origCarbRatio - fCarbRatio) +
        Math.abs(origFatRatio - fFatRatio)
      const macroScore = Math.max(0, 100 - macroDiff * 150)

      // Mesmo perfil Noom Color = bonus
      const noomBonus = f.noomColor === original.noomColor ? 20 : 0

      const totalScore = calScore + macroScore + noomBonus

      return { food: f, score: totalScore }
    })

    // Ordenar por score desc e pegar top 10
    scored.sort((a, b) => b.score - a.score)
    const suggestions = scored.slice(0, 10).map((s) => ({
      id: s.food.id,
      name: s.food.name,
      brand: s.food.brand,
      category: s.food.category,
      servingSize: s.food.servingSize,
      servingLabel: s.food.servingLabel,
      calories: s.food.calories,
      protein: s.food.protein,
      carbs: s.food.carbs,
      fat: s.food.fat,
      noomColor: s.food.noomColor,
    }))

    return NextResponse.json({
      original: {
        id: original.id,
        name: original.name,
        category: original.category,
        calories: original.calories,
      },
      suggestions,
    })
  } catch (error) {
    console.error('GET /api/alimentos/sugestoes error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar sugestoes' },
      { status: 500 }
    )
  }
}
