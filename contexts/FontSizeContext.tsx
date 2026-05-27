"use client"

import { createContext, useContext, ReactNode } from "react"

// 폰트 크기는 이제 app/page.tsx에서 document.body.style.fontSize 로 직접 제어합니다.
// 이 Context는 하위 호환성을 위해 유지합니다.

const FontSizeContext = createContext<Record<string, never>>({})

export function FontSizeProvider({ children }: { children: ReactNode }) {
  return (
    <FontSizeContext.Provider value={{}}>
      {children}
    </FontSizeContext.Provider>
  )
}

export const useFontSize = () => useContext(FontSizeContext)
