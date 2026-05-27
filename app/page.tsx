"use client"

import { useState, useEffect, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import Header from "@/components/Header"
import ReceiptUploader from "@/components/ReceiptUploader"
import ReceiptCard from "@/components/ReceiptCard"
import SummaryTable from "@/components/SummaryTable"
import { ReceiptItem, SavedRecord } from "@/lib/types"
import { STAFF_LIST } from "@/lib/constants"
import { loadRecords, saveRecords, clearRecords } from "@/lib/storage"
import { downloadExcel } from "@/lib/excel"

export default function Home() {
  const [receipts, setReceipts] = useState<ReceiptItem[]>([])
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

  // localStorage에서 저장 내역 로드
  useEffect(() => {
    setSavedRecords(loadRecords())
  }, [])

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ----------- OCR 호출 -----------
  const performOCR = useCallback(async (id: string, file: File) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isOcrLoading: true } : r))
    )
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/ocr", { method: "POST", body: fd })
      const data = (await res.json()) as { text: string; detectedAmount: number }
      setReceipts((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                isOcrLoading: false,
                ocrText: data.text,
                amount: data.detectedAmount || r.amount,
              }
            : r
        )
      )
    } catch {
      setReceipts((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isOcrLoading: false } : r))
      )
    }
  }, [])

  // ----------- 파일 선택 -----------
  const handleFilesSelected = useCallback(
    (files: FileList) => {
      const today = new Date().toISOString().slice(0, 10)
      const newReceipts: ReceiptItem[] = Array.from(files).map((file) => {
        const id = uuidv4()
        return {
          id,
          file,
          imageUrl: URL.createObjectURL(file),
          fileName: file.name,
          isOcrLoading: false,
          date: today,
          amount: 0,
          user: STAFF_LIST[0],
          category: "식사",
          companions: [],
          note: "",
        }
      })

      setReceipts((prev) => [...prev, ...newReceipts])

      // 각 영수증에 OCR 적용
      newReceipts.forEach((r) => {
        if (r.file) performOCR(r.id, r.file)
      })
    },
    [performOCR]
  )

  // ----------- 영수증 폼 업데이트 -----------
  const updateReceipt = (id: string, updates: Partial<ReceiptItem>) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  const removeReceipt = (id: string) => {
    setReceipts((prev) => {
      const target = prev.find((r) => r.id === id)
      if (target?.imageUrl) URL.revokeObjectURL(target.imageUrl)
      return prev.filter((r) => r.id !== id)
    })
  }

  // ----------- 테이블에 저장 -----------
  const handleSaveToTable = () => {
    if (receipts.length === 0) return
    setIsSaving(true)

    const newRecords: SavedRecord[] = receipts.map((r) => ({
      id: r.id,
      date: r.date,
      amount: r.amount,
      user: r.user,
      category: r.category === "직접입력" ? (r.customCategory || "기타") : r.category,
      companions: r.companions,
      note: r.note || "영수증 처리",
      savedAt: new Date().toISOString(),
    }))

    const updated = [...savedRecords, ...newRecords]
    setSavedRecords(updated)
    saveRecords(updated)

    // 처리한 영수증 URL 해제
    receipts.forEach((r) => { if (r.imageUrl) URL.revokeObjectURL(r.imageUrl) })
    setReceipts([])
    setIsSaving(false)
    showToast(`✅ ${newRecords.length}건이 테이블에 저장되었습니다.`, "ok")
  }

  // ----------- 엑셀 다운로드 -----------
  const handleDownload = () => {
    if (savedRecords.length === 0) {
      showToast("저장된 내역이 없습니다.", "err")
      return
    }
    downloadExcel(savedRecords)
    showToast("📥 엑셀 파일 다운로드 시작!", "ok")
  }

  // ----------- 이메일 발송 -----------
  const handleSendEmail = async () => {
    if (savedRecords.length === 0) {
      showToast("전송할 내역이 없습니다.", "err")
      return
    }
    setIsSending(true)
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: savedRecords }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (res.ok && data.success) {
        showToast("📧 이메일이 성공적으로 발송되었습니다!", "ok")
      } else {
        showToast(`발송 실패: ${data.error ?? "알 수 없는 오류"}`, "err")
      }
    } catch {
      showToast("이메일 발송 중 오류가 발생했습니다.", "err")
    }
    setIsSending(false)
  }

  // ----------- 내역 삭제 -----------
  const handleDeleteRecord = (id: string) => {
    const updated = savedRecords.filter((r) => r.id !== id)
    setSavedRecords(updated)
    saveRecords(updated)
  }

  const handleClearAll = () => {
    setSavedRecords([])
    clearRecords()
    showToast("모든 내역이 삭제되었습니다.", "ok")
  }

  return (
    <div className="min-h-screen bg-[#f0ede8]">
      <Header />

      <main className="max-w-2xl mx-auto pb-40">
        {/* ─── 업로드 영역 ─── */}
        <ReceiptUploader
          onFilesSelected={handleFilesSelected}
          disabled={isSaving}
        />

        {/* ─── 영수증 카드 목록 ─── */}
        {receipts.length > 0 && (
          <section>
            <div className="px-4 mb-2">
              <h2 className="font-bold text-gray-700 text-base">
                ▶ 영수증 정보 확인 및 수정 ({receipts.length}장)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                OCR로 금액을 자동 인식합니다. 내용을 확인 후 하단 버튼으로 저장하세요.
              </p>
            </div>
            {receipts.map((receipt, idx) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                index={idx}
                onUpdate={(updates) => updateReceipt(receipt.id, updates)}
                onRemove={() => removeReceipt(receipt.id)}
              />
            ))}
          </section>
        )}

        {/* ─── 누적 내역 테이블 ─── */}
        <SummaryTable
          records={savedRecords}
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearAll}
        />
      </main>

      {/* ─── 하단 고정 액션 바 ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
          {/* 영수증이 있을 때: 테이블에 저장 버튼 */}
          {receipts.length > 0 && (
            <button
              onClick={handleSaveToTable}
              disabled={isSaving}
              className="w-full py-3 bg-brand-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:bg-brand-800 disabled:opacity-60 transition-colors"
              style={{ fontSize: "1em" }}
            >
              🔥 {receipts.length}장 영수증 테이블에 저장
            </button>
          )}

          {/* 내역이 있을 때: 다운로드 + 이메일 */}
          {savedRecords.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-1 active:bg-green-700 transition-colors"
                style={{ fontSize: "0.9em" }}
              >
                📥 엑셀 저장
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-1 active:bg-amber-700 disabled:opacity-60 transition-colors"
                style={{ fontSize: "0.9em" }}
              >
                {isSending ? "⏳ 발송 중…" : "📧 메일 전송"}
              </button>
            </div>
          )}

          {/* 아무것도 없을 때 */}
          {receipts.length === 0 && savedRecords.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-1">
              위에서 영수증을 업로드하면 버튼이 활성화됩니다.
            </p>
          )}
        </div>
      </div>

      {/* ─── 토스트 알림 ─── */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === "ok" ? "bg-green-600" : "bg-red-500"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
