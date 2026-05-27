import { SavedRecord } from "./types"
import { STORAGE_KEY } from "./constants"

export function loadRecords(): SavedRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedRecord[]) : []
  } catch {
    return []
  }
}

export function saveRecords(records: SavedRecord[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    console.error("localStorage 저장 실패")
  }
}

export function clearRecords(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
