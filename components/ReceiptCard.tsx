"use client"

import { useState } from "react"
import Image from "next/image"
import { ReceiptItem } from "@/lib/types"
import { STAFF_LIST, CATEGORY_LIST } from "@/lib/constants"

interface Props {
  receipt: ReceiptItem
  index: number
  onUpdate: (updates: Partial<ReceiptItem>) => void
  onRemove: () => void
}

export default function ReceiptCard({ receipt, index, onUpdate, onRemove }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const handleCompanionToggle = (name: string) => {
    const current = receipt.companions
    const next = current.includes(name)
      ? current.filter((c) => c !== name)
      : [...current, name]
    onUpdate({ companions: next })
  }

  return (
    <div className="mx-4 mb-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 카드 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-brand-50 border-b border-brand-100 cursor-pointer"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-brand-700">🧾 영수증 #{index + 1}</span>
          {receipt.isOcrLoading && (
            <span className="text-xs text-brand-500 animate-pulse">OCR 인식 중…</span>
          )}
          {!receipt.isOcrLoading && receipt.amount > 0 && (
            <span className="text-xs text-green-600 font-semibold">
              {receipt.amount.toLocaleString("ko-KR")}원
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="text-red-400 hover:text-red-600 text-lg leading-none p-1"
            aria-label="영수증 삭제"
          >
            ✕
          </button>
          <span className="text-gray-400 text-sm">{collapsed ? "▼" : "▲"}</span>
        </div>
      </div>

      {/* 카드 바디 */}
      {!collapsed && (
        <div className="p-4">
          {/* 이미지 미리보기 */}
          {receipt.imageUrl && (
            <div className="mb-4 flex justify-center">
              <div className="relative w-full max-w-xs h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={receipt.imageUrl}
                  alt={`영수증 ${index + 1}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* OCR 인식 텍스트 (접힌 박스) */}
          {receipt.ocrText && (
            <details className="mb-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                📝 OCR 인식 원본 텍스트 보기
              </summary>
              <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded overflow-auto max-h-24 whitespace-pre-wrap">
                {receipt.ocrText}
              </pre>
            </details>
          )}

          {/* 폼 필드 */}
          <div className="space-y-3">
            {/* 날짜 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                📅 날짜
              </label>
              <input
                type="date"
                value={receipt.date}
                onChange={(e) => onUpdate({ date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
              />
            </div>

            {/* 금액 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                💰 금액 (원)
              </label>
              <input
                type="number"
                min={0}
                value={receipt.amount}
                onChange={(e) => onUpdate({ amount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
                placeholder="금액을 입력하세요"
              />
              {receipt.isOcrLoading && (
                <p className="text-xs text-brand-500 mt-1 animate-pulse">
                  OCR로 금액 인식 중...
                </p>
              )}
            </div>

            {/* 사용자 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                👤 사용자
              </label>
              <select
                value={receipt.user}
                onChange={(e) => onUpdate({ user: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm bg-white"
              >
                {STAFF_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏷️ 카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_LIST.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      onUpdate({
                        category: cat,
                        customCategory: cat === "직접입력" ? receipt.customCategory : undefined,
                      })
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      receipt.category === cat
                        ? "bg-brand-700 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-brand-100 hover:text-brand-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {receipt.category === "직접입력" && (
                <input
                  type="text"
                  value={receipt.customCategory ?? ""}
                  onChange={(e) => onUpdate({ customCategory: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
                  placeholder="카테고리를 직접 입력하세요"
                />
              )}
            </div>

            {/* 동반직원 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👥 동반직원 (복수 선택)
              </label>
              <div className="flex flex-wrap gap-2">
                {STAFF_LIST.filter((s) => s !== receipt.user).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleCompanionToggle(name)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      receipt.companions.includes(name)
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700"
                    }`}
                  >
                    {receipt.companions.includes(name) ? "✓ " : ""}{name}
                  </button>
                ))}
              </div>
            </div>

            {/* 비고 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                📝 비고 / 가맹점명
              </label>
              <input
                type="text"
                value={receipt.note}
                onChange={(e) => onUpdate({ note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
                placeholder="가맹점명 또는 메모를 입력하세요"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
