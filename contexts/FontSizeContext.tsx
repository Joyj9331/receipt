"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { FontSizeKey } from "@/lib/types"

interface FontSizeCtx {
  fontSize: FontSizeKey
  setFontSize: (s: FontSizeKey) => void
}

const FontSizeContext = createContext<FontSizeCtx>({
  fontSize: "md",
  setFontSize: () => {},
})

const SIZE_MAP: Record<FontSizeKey, string> = {
  sm: "13px",
  md: "15px",
  lg: "18px",
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSizeKey>("md")

  useEffect(() => {
    const saved = localStorage.getItem("app_font_size") as FontSizeKey | null
    if (saved && ["sm", "md", "lg"].includes(saved)) {
      setFontSizeState(saved)
    }
  }, [])

  const setFontSize = (s: FontSizeKey) => {
    setFontSizeState(s)
    localStorage.setItem("app_font_size", s)
  }

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      <div style={{ fontSize: SIZE_MAP[fontSize] }}>{children}</div>
    </FontSizeContext.Provider>
  )
}

export const useFontSize = () => useContext(FontSizeContext)
