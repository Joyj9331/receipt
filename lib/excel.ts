import * as XLSX from "xlsx"
import { SavedRecord } from "./types"

export function downloadExcel(records: SavedRecord[]): void {
  const rows = records.map((r) => ({
    날짜: r.date,
    사용자: r.user,
    "금액(원)": r.amount,
    카테고리: r.category,
    동반직원: r.companions.length > 0 ? r.companions.join(", ") : "없음",
    비고: r.note || "영수증 처리",
    "등록시각": new Date(r.savedAt).toLocaleString("ko-KR"),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // 열 너비 조정
  ws["!cols"] = [
    { wch: 14 }, // 날짜
    { wch: 16 }, // 사용자
    { wch: 12 }, // 금액
    { wch: 10 }, // 카테고리
    { wch: 24 }, // 동반직원
    { wch: 24 }, // 비고
    { wch: 20 }, // 등록시각
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "영수증지출내역")

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  XLSX.writeFile(wb, `법카_지출내역_${today}.xlsx`)
}

export function generateExcelBuffer(records: SavedRecord[]): Buffer {
  const rows = records.map((r) => ({
    날짜: r.date,
    사용자: r.user,
    "금액(원)": r.amount,
    카테고리: r.category,
    동반직원: r.companions.length > 0 ? r.companions.join(", ") : "없음",
    비고: r.note || "영수증 처리",
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws["!cols"] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
    { wch: 24 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "영수증지출내역")

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer
}
