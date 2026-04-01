"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, PlusCircle, Dumbbell, User } from "lucide-react"

const tabs = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/diario", label: "Diário", icon: BookOpen },
  { href: "/adicionar", label: "Adicionar", icon: PlusCircle, isCenter: true },
  { href: "/exercicios", label: "Exercícios", icon: Dumbbell },
  { href: "/perfil", label: "Perfil", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          const Icon = tab.icon

          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
