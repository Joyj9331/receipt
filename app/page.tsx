"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { v4 as uuidv4 } from "uuid"
import Header from "@/components/Header"
import LoginScreen from "@/components/LoginScreen"
import ReceiptUploader from "@/components/ReceiptUploader"
import ReceiptCard from "@/components/ReceiptCard"
import SummaryTable from "@/components/SummaryTable"
import SettingsModal, { getReceiverEmail } from "@/components/SettingsModal"
import { ReceiptItem, SavedRecord } from "@/lib/types"
import { loadRecords, saveRecords, clearRecords } from "@/lib/storage"
import { downloadExcel } from "@/lib/excel"

export default function Home() {
  const { data: session, status } = useSession()
  const [staffList, setStaffList] = useState<string[]>([])
  const [receipts, setReceipts] = useState<ReceiptItem[]>([])
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>([])
  const [isSending, setIsSending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)
  const [fontSize, setFontSize] = useState(18)
  const fontSizeRef = useRef(18)

  // localStorage 로드 + 직원 목록 fetch
  useEffect(() => {
    setSavedRecords(loadRecords())
    const saved = parseInt(localStorage.getItem("app_font_size") ?? "18", 10)
    if (saved >= 14 && saved <= 30) {
      setFontSize(saved)
      fontSizeRef.current = saved
      document.body.style.fontSize = saved + "px"
    }
    // 서버 환경변수에서 직원 목록 불러오기
    fetch("/api/staff")
      .then((r) => r.json())
      .then((data: { staff: string[] }) => {
        if (data.staff?.length > 0) setStaffList(data.staff)
      })
      .catch(() => {})
  }, [])

  const handleFontSize = (delta: number) => {
    const base = delta === 0 ? 18 : fontSizeRef.current + delta
    const next = Math.min(30, Math.max(14, base))
    fontSizeRef.current = next
    setFontSize(next)
    document.body.style.fontSize = next + "px"
    localStorage.setItem("app_font_size", String(next))
  }

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  // ── OCR 호출 ──
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
                amount: data.detectedAmount > 0 ? data.detectedAmount : r.amount,
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

  // ── 파일 선택 ──
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
          user: staffList[0] ?? "",
          category: "식사",
          companions: [],
          note: "",
        }
      })
      setReceipts((prev) => [...prev, ...newReceipts])
      newReceipts.forEach((r) => r.file && performOCR(r.id, r.file))
    },
    [performOCR]
  )

  const updateReceipt = (id: string, updates: Partial<ReceiptItem>) =>
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))

  const removeReceipt = (id: string) => {
    setReceipts((prev) => {
      const t = prev.find((r) => r.id === id)
      if (t?.imageUrl) URL.revokeObjectURL(t.imageUrl)
      return prev.filter((r) => r.id !== id)
    })
  }

  // ── 테이블에 저장 ──
  const handleSaveToTable = () => {
    if (receipts.length === 0) return
    const newRecords: SavedRecord[] = receipts.map((r) => ({
      id: r.id,
      date: r.date,
      amount: r.amount,
      user: r.user,
      category:
        r.category === "직접입력" ? r.customCategory || "기타" : r.category,
      companions: r.companions,
      note: r.note || "영수증 처리",
      savedAt: new Date().toISOString(),
    }))
    const updated = [...savedRecords, ...newRecords]
    setSavedRecords(updated)
    saveRecords(updated)
    receipts.forEach((r) => r.imageUrl && URL.revokeObjectURL(r.imageUrl))
    setReceipts([])
    showToast(`✅ ${newRecords.length}건이 테이블에 저장되었습니다.`, "ok")
  }

  // ── 엑셀 다운로드 ──
  const handleDownload = () => {
    if (savedRecords.length === 0) { showToast("저장된 내역이 없습니다.", "err"); return }
    downloadExcel(savedRecords)
    showToast("↓ 엑셀 파일 다운로드 중", "ok")
  }

  // ── 이메일 발송 ──
  const handleSendEmail = async () => {
    if (savedRecords.length === 0) { showToast("전송할 내역이 없습니다.", "err"); return }

    const receiverEmail = getReceiverEmail()
    if (!receiverEmail) {
      setShowSettings(true)
      showToast("먼저 수신자 이메일을 설정해주세요.", "err")
      return
    }

    setIsSending(true)
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: savedRecords,
          receiverEmail,
          senderName: session?.user?.name ?? "경비관리 시스템",
          senderEmail: session?.user?.email ?? "",
        }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (res.ok && data.success) {
        showToast("✉ 이메일이 성공적으로 발송되었습니다", "ok")
      } else {
        showToast(`발송 실패: ${data.error ?? "알 수 없는 오류"}`, "err")
      }
    } catch {
      showToast("이메일 발송 중 오류가 발생했습니다.", "err")
    }
    setIsSending(false)
  }

  // ── 내역 삭제 ──
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

  // ── 로딩 / 로그인 화면 ──
  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-page)",
          fontFamily: "Chosunilbo_myungjo, serif",
          fontSize: "1.1em",
          color: "var(--text-sub)",
        }}
      >
        로딩 중…
      </div>
    )
  }

  if (!session) return <LoginScreen />

  // ── 메인 앱 ──
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <Header
        onSettings={() => setShowSettings(true)}
        fontSize={fontSize}
        onFontSize={handleFontSize}
      />

      <main
        style={{ maxWidth: "680px", margin: "0 auto", padding: "16px 12px 160px" }}
      >
        {/* 업로드 */}
        <ReceiptUploader onFilesSelected={handleFilesSelected} />

        {/* 영수증 카드 */}
        {receipts.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontWeight: 900, fontSize: "1em" }}>
                ▶ 영수증 정보 확인 ({receipts.length}장)
              </span>
              <span style={{ fontSize: "0.78em", color: "var(--text-sub)" }}>
                OCR로 금액 자동 인식 · 필요 시 수정 후 저장
              </span>
            </div>
            {receipts.map((r, i) => (
              <ReceiptCard
                key={r.id}
                receipt={r}
                index={i}
                staffList={staffList}
                onUpdate={(u) => updateReceipt(r.id, u)}
                onRemove={() => removeReceipt(r.id)}
              />
            ))}
          </div>
        )}

        {/* 누적 내역 */}
        <SummaryTable
          records={savedRecords}
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearAll}
        />
      </main>

      {/* ── 하단 고정 액션 바 ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: "var(--bg-card)",
          borderTop: "2px solid var(--border-thin)",
          padding: "10px 12px",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          {receipts.length > 0 && (
            <button
              className="action-btn primary"
              style={{ width: "100%", marginBottom: "8px", padding: "14px" }}
              onClick={handleSaveToTable}
            >
              ▶ {receipts.length}장 영수증 — 테이블에 저장
            </button>
          )}

          {savedRecords.length > 0 && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="action-btn safe" onClick={handleDownload}>
                ↓ 엑셀 저장
              </button>
              <button
                className="action-btn primary"
                onClick={handleSendEmail}
                disabled={isSending}
                style={{ opacity: isSending ? 0.6 : 1 }}
              >
                {isSending ? "··· 발송 중" : "✉ 메일 전송"}
              </button>
            </div>
          )}

          {receipts.length === 0 && savedRecords.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-sub)",
                fontSize: "0.82em",
                margin: "4px 0",
              }}
            >
              위에서 영수증을 업로드하면 버튼이 활성화됩니다.
            </p>
          )}
        </div>
      </div>

      {/* 설정 모달 */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* 토스트 */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  )
}
