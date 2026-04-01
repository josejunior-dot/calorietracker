import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function Home() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) redirect("/onboarding")
    redirect("/inicio")
  } catch {
    redirect("/onboarding")
  }
}
