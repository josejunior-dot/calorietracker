import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/alimentos — Search foods
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const recentUserId = searchParams.get('recent')

    let recentFoods: (typeof results) = []

    // 1. Get recent foods if userId provided
    if (recentUserId) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      const recentEntries = await prisma.mealEntry.groupBy({
        by: ['foodId'],
        where: {
          userId: recentUserId,
          date: { gte: sevenDaysAgoStr },
        },
        _count: { foodId: true },
        orderBy: { _count: { foodId: 'desc' } },
        take: 5,
      })

      if (recentEntries.length > 0) {
        const recentFoodIds = recentEntries.map((e) => e.foodId)
        const foods = await prisma.food.findMany({
          where: { id: { in: recentFoodIds } },
        })

        // Preserve order from groupBy
        recentFoods = recentFoodIds
          .map((id) => foods.find((f) => f.id === id))
          .filter(Boolean) as typeof foods
      }
    }

    // 2. Search foods by name and optionally category
    const where: Record<string, unknown> = {}

    if (q) {
      where.name = { contains: q, mode: 'insensitive' }
    }
    if (category) {
      where.category = category
    }

    const results = await prisma.food.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
    })

    // 3. Combine: recent first (marked), then search results (no duplicates)
    const recentIds = new Set(recentFoods.map((f) => f.id))
    const combined = [
      ...recentFoods.map((f) => ({ ...f, isRecent: true })),
      ...results
        .filter((f) => !recentIds.has(f.id))
        .map((f) => ({ ...f, isRecent: false })),
    ]

    return NextResponse.json(combined)
  } catch (error) {
    console.error('GET /api/alimentos error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar alimentos' },
      { status: 500 }
    )
  }
}

// POST /api/alimentos — Create custom food
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      name, brand, category, servingSize, servingLabel,
      calories, protein, carbs, fat, fiber, sugar, sodium,
    } = body

    if (!name || !category || !servingSize || calories == null) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: name, category, servingSize, calories' },
        { status: 400 }
      )
    }

    // Calculate noom color based on calorie density (cal/g)
    const density = calories / servingSize
    let noomColor: string
    if (density < 1.0) {
      noomColor = 'green'
    } else if (density <= 2.4) {
      noomColor = 'yellow'
    } else {
      noomColor = 'orange'
    }

    const food = await prisma.food.create({
      data: {
        name,
        brand: brand || null,
        category,
        servingSize,
        servingLabel: servingLabel || `${servingSize}g`,
        calories,
        protein: protein ?? 0,
        carbs: carbs ?? 0,
        fat: fat ?? 0,
        fiber: fiber ?? 0,
        sugar: sugar ?? 0,
        sodium: sodium ?? 0,
        noomColor,
        isCustom: true,
      },
    })

    return NextResponse.json(food, { status: 201 })
  } catch (error) {
    console.error('POST /api/alimentos error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar alimento' },
      { status: 500 }
    )
  }
}
