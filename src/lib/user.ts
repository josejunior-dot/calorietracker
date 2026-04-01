import { prisma } from './prisma'

export async function getDefaultUserId(): Promise<string | null> {
  const user = await prisma.user.findFirst({ select: { id: true } })
  return user?.id ?? null
}
