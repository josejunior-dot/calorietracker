import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/peso/[id] — Delete a weight log entry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const entry = await prisma.weightLog.findUnique({ where: { id } })
    if (!entry) {
      return NextResponse.json(
        { error: 'Registro nao encontrado' },
        { status: 404 }
      )
    }

    await prisma.weightLog.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/peso/[id] error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar registro de peso' },
      { status: 500 }
    )
  }
}
