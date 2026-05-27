// ReceiptItem: 현재 세션에서 처리 중인 영수증 (이미지 포함)
export interface ReceiptItem {
  id: string
  file?: File
  imageUrl?: string       // object URL (세션 중에만 유효)
  fileName?: string
  isOcrLoading: boolean
  ocrText?: string
  // 폼 데이터
  date: string            // YYYY-MM-DD
  amount: number
  user: string
  category: string
  customCategory?: string // 직접 입력 시
  companions: string[]
  note: string
}

// SavedRecord: localStorage에 저장되는 영수증 데이터 (이미지 없음)
export interface SavedRecord {
  id: string
  date: string
  amount: number
  user: string
  category: string
  companions: string[]
  note: string
  savedAt: string         // ISO timestamp
}

export type FontSizeKey = 'sm' | 'md' | 'lg'

export interface AppSettings {
  fontSize: FontSizeKey
}
