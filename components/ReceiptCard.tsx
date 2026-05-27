"use client"

import { useState } from "react"
import Image from "next/image"
import { ReceiptItem } from "@/lib/types"
import { CATEGORY_LIST } from "@/lib/constants"

interface Props {
  receipt: ReceiptItem
  index: number
  staffList: string[]
  onUpdate: (updates: Partial<ReceiptItem>) => void
  onRemove: () => void
}

export default function ReceiptCard({ receipt, index, staffList, onUpdate, onRemove }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const toggleCompanion = (name: string) => {
    const next = receipt.companions.includes(name)
      ? receipt.companions.filter((c) => c !== name)
      : [...receipt.companions, name]
    onUpdate({ companions: next })
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* 카드 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "var(--bg-page)",
          borderBottom: collapsed ? "none" : "1px solid var(--border-thin)",
          cursor: "pointer",
        }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: 900 }}>■ 영수증 #{index + 1}</span>
          {receipt.isOcrLoading && (
            <span style={{ fontSize: "0.78em", color: "var(--text-sub)" }}>
              OCR 인식 중…
            </span>
          )}
          {!receipt.isOcrLoading && receipt.amount > 0 && (
            <span style={{ fontSize: "0.85em", color: "var(--safe-color)", fontWeight: 900 }}>
              {receipt.amount.toLocaleString("ko-KR")}원
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className="ctrl-btn danger"
            style={{ padding: "4px 10px", fontSize: "0.78em" }}
            onClick={(e) => { e.stopPropagation(); onRemove() }}
          >
            삭제
          </button>
          <span style={{ color: "var(--text-sub)", fontSize: "0.85em" }}>
            {collapsed ? "▼" : "▲"}
          </span>
        </div>
      </div>

      {/* 카드 바디 */}
      {!collapsed && (
        <div style={{ padding: "16px" }}>
          {/* 이미지 미리보기 */}
          {receipt.imageUrl && (
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "260px",
                height: "160px",
                margin: "0 auto 16px",
                borderRadius: "6px",
                overflow: "hidden",
                border: "1px solid var(--border-thin)",
                background: "#f5f5f5",
              }}
            >
              <Image
                src={receipt.imageUrl}
                alt={`영수증 ${index + 1}`}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {/* OCR 원본 텍스트 */}
          {receipt.ocrText && (
            <details style={{ marginBottom: "14px" }}>
              <summary
                style={{
                  fontSize: "0.78em",
                  color: "var(--text-sub)",
                  cursor: "pointer",
                }}
              >
                · OCR 인식 원문 보기
              </summary>
              <pre
                style={{
                  marginTop: "6px",
                  fontSize: "0.72em",
                  color: "var(--text-sub)",
                  background: "var(--bg-page)",
                  padding: "8px",
                  borderRadius: "4px",
                  overflow: "auto",
                  maxHeight: "80px",
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                }}
              >
                {receipt.ocrText}
              </pre>
            </details>
          )}

          {/* 폼 필드 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* 날짜 */}
            <div>
              <label className="form-label">날짜</label>
              <input
                type="date"
                className="form-input"
                value={receipt.date}
                onChange={(e) => onUpdate({ date: e.target.value })}
              />
            </div>

            {/* 금액 */}
            <div>
              <label className="form-label">
                금액 (원)
                {receipt.isOcrLoading && (
                  <span style={{ color: "var(--text-sub)", marginLeft: "8px", fontWeight: 700 }}>
                    자동 인식 중…
                  </span>
                )}
              </label>
              <input
                type="number"
                className="form-input"
                style={{ textAlign: "right" }}
                min={0}
                value={receipt.amount || ""}
                placeholder="0"
                onChange={(e) =>
                  onUpdate({ amount: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>

            {/* 사용자 */}
            <div>
              <label className="form-label">사용자</label>
              <select
                className="form-input"
                value={receipt.user}
                onChange={(e) => onUpdate({ user: e.target.value })}
              >
                {staffList.length === 0 ? (
                  <option value="">— 직원 없음 (관리자에게 문의) —</option>
                ) : (
                  staffList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))
                )}
              </select>
            </div>

            {/* 카테고리 */}
            <div>
              <label className="form-label">카테고리</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {CATEGORY_LIST.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`chip ${receipt.category === cat ? "active" : ""}`}
                    onClick={() =>
                      onUpdate({
                        category: cat,
                        customCategory:
                          cat === "직접입력" ? receipt.customCategory : undefined,
                      })
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {receipt.category === "직접입력" && (
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: "8px" }}
                  placeholder="카테고리를 입력하세요"
                  value={receipt.customCategory ?? ""}
                  onChange={(e) => onUpdate({ customCategory: e.target.value })}
                />
              )}
            </div>

            {/* 동반직원 */}
            <div>
              <label className="form-label">동반직원 (중복 선택)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {staffList.filter((s) => s !== receipt.user).map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`chip green ${receipt.companions.includes(name) ? "active" : ""}`}
                    onClick={() => toggleCompanion(name)}
                  >
                    {receipt.companions.includes(name) ? "✓ " : ""}
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* 비고 */}
            <div>
              <label className="form-label">비고 / 가맹점명</label>
              <input
                type="text"
                className="form-input"
                placeholder="가맹점명 또는 메모"
                value={receipt.note}
                onChange={(e) => onUpdate({ note: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
