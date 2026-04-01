import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function Home() {
  let hasUser = false

  try {
    const user = await prisma.user.findFirst({ select: { id: true } })
    hasUser = !!user
  } catch {
    hasUser = false
  }

  if (hasUser) {
    redirect("/inicio")
  } else {
    redirect("/onboarding")
  }
}
