import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const metadata: Metadata = {
  title: "CalorieTracker",
  description: "Controle seu peso e calorias de forma inteligente",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CalorieTracker",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#22c55e",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
