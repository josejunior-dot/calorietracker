import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNoomColor } from '@/lib/noom-color'

// GET /api/combos — List all combos with their items and ingredient details
export async function GET() {
  try {
    // 1. Find all combo foods
    const combos = await prisma.food.findMany({
      where: { isCombo: true, isCustom: true },
      include: { comboItems: true },
      orderBy: { createdAt: 'desc' },
    })

    // 2. Gather all ingredient foodIds
    const ingredientIds = new Set<string>()
    for (const combo of combos) {
      for (const item of combo.comboItems) {
        ingredientIds.add(item.foodId)
      }
    }

    // 3. Fetch ingredient foods
    const ingredientFoods = ingredientIds.size > 0
      ? await prisma.food.findMany({
          where: { id: { in: Array.from(ingredientIds) } },
        })
      : []

    const foodMap = new Map(ingredientFoods.map((f) => [f.id, f]))

    // 4. Build response with ingredient details
    const result = combos.map((combo) => ({
      id: combo.id,
      name: combo.name,
      calories: combo.calories,
      protein: combo.protein,
      carbs: combo.carbs,
      fat: combo.fat,
      fiber: combo.fiber,
      sodium: combo.sodium,
      noomColor: combo.noomColor,
      servingSize: combo.servingSize,
      servingLabel: combo.servingLabel,
      createdAt: combo.createdAt,
      items: combo.comboItems.map((item) => {
        const food = foodMap.get(item.foodId)
        return {
          id: item.id,
          foodId: item.foodId,
          foodName: food?.name ?? 'Desconhecido',
          quantity: item.quantity,
          unit: item.unit,
          servings: item.servings,
          calories: food ? food.calories * item.servings : 0,
          protein: food ? food.protein * item.servings : 0,
          carbs: food ? food.carbs * item.servings : 0,
          fat: food ? food.fat * item.servings : 0,
        }
      }),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/combos error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar combos' },
      { status: 500 }
    )
  }
}

// POST /api/combos — Create a new combo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, items } = body as {
      name: string
      items: Array<{
        foodId: string
        quantity: number
        unit: string
        servings: number
      }>
    }

    if (!name || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nome e pelo menos 1 ingrediente sao obrigatorios' },
        { status: 400 }
      )
    }

    // 1. Fetch all ingredient foods
    const foodIds = items.map((i) => i.foodId)
    const foods = await prisma.food.findMany({
      where: { id: { in: foodIds } },
    })
    const foodMap = new Map(foods.map((f) => [f.id, f]))

    // 2. Calculate total nutritional values
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0
    let totalSugar = 0
    let totalSodium = 0
    let totalSaturatedFat = 0
    let totalTransFat = 0
    let totalWeightGrams = 0

    for (const item of items) {
      const food = foodMap.get(item.foodId)
      if (!food) continue

      const s = item.servings
      totalCalories += food.calories * s
      totalProtein += food.protein * s
      totalCarbs += food.carbs * s
      totalFat += food.fat * s
      totalFiber += food.fiber * s
      totalSugar += food.sugar * s
      totalSodium += food.sodium * s
      totalSaturatedFat += food.saturatedFat * s
      totalTransFat += food.transFat * s

      // Estimate weight for noom color calculation
      if (item.unit === 'g' || item.unit === 'ml') {
        totalWeightGrams += item.quantity
      } else if (item.unit === 'colher') {
        totalWeightGrams += item.quantity * 15
      } else if (item.unit === 'pitada') {
        totalWeightGrams += item.quantity * 0.5
      } else {
        // unidade, fatia, scoop — use servingSize as weight estimate
        totalWeightGrams += food.servingSize * s
      }
    }

    // 3. Calculate noom color
    const noomColor = getNoomColor(totalCalories, totalWeightGrams || 1)

    // 4. Create combo Food + ComboItems in a transaction
    const combo = await prisma.food.create({
      data: {
        name,
        brand: null,
        category: 'refeicoes',
        servingSize: 1,
        servingLabel: '1 combo',
        calories: Math.round(totalCalories * 10) / 10,
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        saturatedFat: Math.round(totalSaturatedFat * 10) / 10,
        transFat: Math.round(totalTransFat * 10) / 10,
        fiber: Math.round(totalFiber * 10) / 10,
        sugar: Math.round(totalSugar * 10) / 10,
        sodium: Math.round(totalSodium * 10) / 10,
        noomColor,
        isCustom: true,
        isCombo: true,
        comboItems: {
          create: items.map((item) => ({
            foodId: item.foodId,
            quantity: item.quantity,
            unit: item.unit,
            servings: item.servings,
          })),
        },
      },
      include: { comboItems: true },
    })

    // 5. Return with ingredient names
    const result = {
      ...combo,
      items: combo.comboItems.map((ci) => {
        const food = foodMap.get(ci.foodId)
        return {
          id: ci.id,
          foodId: ci.foodId,
          foodName: food?.name ?? 'Desconhecido',
          quantity: ci.quantity,
          unit: ci.unit,
          servings: ci.servings,
          calories: food ? food.calories * ci.servings : 0,
          protein: food ? food.protein * ci.servings : 0,
          carbs: food ? food.carbs * ci.servings : 0,
          fat: food ? food.fat * ci.servings : 0,
        }
      }),
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('POST /api/combos error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar combo' },
      { status: 500 }
    )
  }
}

// PUT /api/combos — Update an existing combo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, items } = body as {
      id: string
      name: string
      items: Array<{
        foodId: string
        quantity: number
        unit: string
        servings: number
      }>
    }

    if (!id || !name || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'ID, nome e pelo menos 1 ingrediente sao obrigatorios' },
        { status: 400 }
      )
    }

    // Verify it exists
    const existing = await prisma.food.findFirst({
      where: { id, isCombo: true, isCustom: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Combo nao encontrado' }, { status: 404 })
    }

    // Fetch ingredient foods
    const foodIds = items.map((i) => i.foodId)
    const foods = await prisma.food.findMany({ where: { id: { in: foodIds } } })
    const foodMap = new Map(foods.map((f) => [f.id, f]))

    // Recalculate nutrition
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0
    let totalFiber = 0, totalSugar = 0, totalSodium = 0
    let totalSaturatedFat = 0, totalTransFat = 0, totalWeightGrams = 0

    for (const item of items) {
      const food = foodMap.get(item.foodId)
      if (!food) continue
      const s = item.servings
      totalCalories += food.calories * s
      totalProtein += food.protein * s
      totalCarbs += food.carbs * s
      totalFat += food.fat * s
      totalFiber += food.fiber * s
      totalSugar += food.sugar * s
      totalSodium += food.sodium * s
      totalSaturatedFat += food.saturatedFat * s
      totalTransFat += food.transFat * s
      if (item.unit === 'g' || item.unit === 'ml') totalWeightGrams += item.quantity
      else if (item.unit === 'colher') totalWeightGrams += item.quantity * 15
      else if (item.unit === 'pitada') totalWeightGrams += item.quantity * 0.5
      else totalWeightGrams += food.servingSize * s
    }

    const noomColor = getNoomColor(totalCalories, totalWeightGrams || 1)

    // Delete old items and update food + create new items
    await prisma.comboItem.deleteMany({ where: { comboId: id } })

    const combo = await prisma.food.update({
      where: { id },
      data: {
        name,
        calories: Math.round(totalCalories * 10) / 10,
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        saturatedFat: Math.round(totalSaturatedFat * 10) / 10,
        transFat: Math.round(totalTransFat * 10) / 10,
        fiber: Math.round(totalFiber * 10) / 10,
        sugar: Math.round(totalSugar * 10) / 10,
        sodium: Math.round(totalSodium * 10) / 10,
        noomColor,
        comboItems: {
          create: items.map((item) => ({
            foodId: item.foodId,
            quantity: item.quantity,
            unit: item.unit,
            servings: item.servings,
          })),
        },
      },
      include: { comboItems: true },
    })

    const result = {
      ...combo,
      items: combo.comboItems.map((ci) => {
        const food = foodMap.get(ci.foodId)
        return {
          id: ci.id, foodId: ci.foodId, foodName: food?.name ?? 'Desconhecido',
          quantity: ci.quantity, unit: ci.unit, servings: ci.servings,
          calories: food ? food.calories * ci.servings : 0,
          protein: food ? food.protein * ci.servings : 0,
          carbs: food ? food.carbs * ci.servings : 0,
          fat: food ? food.fat * ci.servings : 0,
        }
      }),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('PUT /api/combos error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar combo' }, { status: 500 })
  }
}

// DELETE /api/combos?id=xxx — Delete a combo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do combo e obrigatorio' },
        { status: 400 }
      )
    }

    // Verify it's actually a combo
    const combo = await prisma.food.findFirst({
      where: { id, isCombo: true, isCustom: true },
    })

    if (!combo) {
      return NextResponse.json(
        { error: 'Combo nao encontrado' },
        { status: 404 }
      )
    }

    // Remove references from MealEntry and FixedFood before deleting
    await prisma.mealEntry.deleteMany({ where: { foodId: id } })
    await prisma.fixedFood.deleteMany({ where: { foodId: id } })

    // Delete (cascade will remove ComboItems)
    await prisma.food.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/combos error:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir combo' },
      { status: 500 }
    )
  }
}
