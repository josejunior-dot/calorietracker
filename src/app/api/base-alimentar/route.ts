import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDefaultUserId } from '@/lib/user'

// GET /api/base-alimentar — Listar alimentos fixos do usuario
export async function GET() {
  try {
    const userId = await getDefaultUserId()
    if (!userId) {
      return NextResponse.json(
        { error: 'Nenhum usuario cadastrado' },
        { status: 404 }
      )
    }

    const fixedFoods = await prisma.fixedFood.findMany({
      where: { userId },
      include: { food: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(fixedFoods)
  } catch (error) {
    console.error('GET /api/base-alimentar error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar alimentos fixos' },
      { status: 500 }
    )
  }
}

// POST /api/base-alimentar — Adicionar alimento fixo
export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId()
    if (!userId) {
      return NextResponse.json(
        { error: 'Nenhum usuario cadastrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { foodId, mealType, servings } = body

    if (!foodId || !mealType) {
      return NextResponse.json(
        { error: 'Parametros obrigatorios: foodId, mealType' },
        { status: 400 }
      )
    }

    const validMealTypes = ['cafe_da_manha', 'almoco', 'jantar', 'lanche', 'qualquer']
    if (!validMealTypes.includes(mealType)) {
      return NextResponse.json(
        { error: 'mealType invalido. Use: cafe_da_manha, almoco, jantar, lanche ou qualquer' },
        { status: 400 }
      )
    }

    // Validar que o alimento existe
    const food = await prisma.food.findUnique({ where: { id: foodId } })
    if (!food) {
      return NextResponse.json(
        { error: 'Alimento nao encontrado' },
        { status: 404 }
      )
    }

    const fixedFood = await prisma.fixedFood.create({
      data: {
        userId,
        foodId,
        mealType,
        servings: servings ?? 1,
      },
      include: { food: true },
    })

    return NextResponse.json(fixedFood, { status: 201 })
  } catch (error) {
    console.error('POST /api/base-alimentar error:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar alimento fixo' },
      { status: 500 }
    )
  }
}

// DELETE /api/base-alimentar?id=xxx — Remover alimento fixo
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getDefaultUserId()
    if (!userId) {
      return NextResponse.json(
        { error: 'Nenhum usuario cadastrado' },
        { status: 404 }
      )
    }

    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Parametro obrigatorio: id' },
        { status: 400 }
      )
    }

    await prisma.fixedFood.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/base-alimentar error:', error)
    return NextResponse.json(
      { error: 'Erro ao remover alimento fixo' },
      { status: 500 }
    )
  }
}
