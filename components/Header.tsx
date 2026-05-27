"use client"

import { useFontSize } from "@/contexts/FontSizeContext"
import { FontSizeKey } from "@/lib/types"

export default function Header() {
  const { fontSize, setFontSize } = useFontSize()

  const sizes: { key: FontSizeKey; label: string }[] = [
    { key: "sm", label: "小" },
    { key: "md", label: "中" },
    { key: "lg", label: "大" },
  ]

  return (
    <header className="sticky top-0 z-50 bg-brand-800 text-white shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* 좌측: 타이틀 */}
        <div className="flex items-center gap-2">
          <span className="text-xl">📑</span>
          <div>
            <div className="font-bold leading-tight" style={{ fontSize: "1.05em" }}>
              새모양 F&amp;B
            </div>
            <div className="text-brand-200 leading-tight" style={{ fontSize: "0.78em" }}>
              경비관리 시스템
            </div>
          </div>
        </div>

        {/* 우측: 폰트 크기 조절 */}
        <div className="flex items-center gap-1">
          <span className="text-brand-300 mr-1" style={{ fontSize: "0.75em" }}>
            글씨
          </span>
          {sizes.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFontSize(key)}
              className={`w-8 h-8 rounded font-bold transition-all ${
                fontSize === key
                  ? "bg-white text-brand-800"
                  : "bg-brand-700 text-brand-200 hover:bg-brand-600"
              }`}
              style={{ fontSize: key === "sm" ? "12px" : key === "md" ? "14px" : "16px" }}
              aria-label={`글씨 크기 ${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
