import { BottomNav } from "@/components/layout/BottomNav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <main className="safe-bottom pb-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
