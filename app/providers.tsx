"use client"

import { SessionProvider } from "next-auth/react"
import { FontSizeProvider } from "@/contexts/FontSizeContext"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <FontSizeProvider>{children}</FontSizeProvider>
    </SessionProvider>
  )
}
