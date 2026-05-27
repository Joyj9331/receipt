import type { Metadata, Viewport } from "next"
import "./globals.css"
import { FontSizeProvider } from "@/contexts/FontSizeContext"

export const metadata: Metadata = {
  title: "새모양 F&B 경비관리 시스템",
  description: "법인카드 영수증 일괄 처리 및 경비 관리",
  icons: { icon: "/favicon.ico" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <FontSizeProvider>{children}</FontSizeProvider>
      </body>
    </html>
  )
}
