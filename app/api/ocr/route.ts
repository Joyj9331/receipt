import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * 한국 영수증 OCR 텍스트에서 결제 금액을 정확하게 추출합니다.
 *
 * 우선순위:
 * 1. "합계", "결제금액", "청구금액" 등 키워드 바로 뒤의 숫자
 * 2. 숫자 뒤에 "원" 이 붙는 패턴 (콤마 포함) → 최댓값
 * 3. 콤마 포함 숫자 (e.g., 15,000) → 최댓값
 * 4. 전체 숫자 중 1,000 이상 최댓값 (fallback)
 */
function detectAmount(text: string): number {
  if (!text || text.trim().length === 0) return 0

  const normalize = (s: string) => s.replace(/\s+/g, "").replace(/，/g, ",")
  const parseNum = (s: string) => parseInt(s.replace(/,/g, ""), 10)
  const isValid = (n: number) => n >= 500 && n < 10_000_000

  const norm = normalize(text)

  // ── 1. 키워드 우선 탐색 ──
  const keywords = [
    "합계", "결제금액", "청구금액", "총금액", "이용금액",
    "신용승인금액", "받은돈", "합산", "TOTAL", "Total", "Amount",
  ]
  for (const kw of keywords) {
    // 키워드 + (비숫자 0~5글자) + 숫자 (콤마 가능)
    const re = new RegExp(`${kw}[^\\d]{0,5}([\\d,]{3,})`, "i")
    const m = norm.match(re)
    if (m) {
      const val = parseNum(m[1])
      if (isValid(val)) return val
    }
  }

  // ── 2. "원" 접미사 패턴 (줄 단위 정규식) ──
  const wonRe = /([\d,]{3,})\s*원/g
  const wonMatches = Array.from(text.matchAll(wonRe))
  if (wonMatches.length > 0) {
    const vals = wonMatches
      .map((m) => parseNum(m[1]))
      .filter(isValid)
    if (vals.length > 0) return Math.max(...vals)
  }

  // ── 3. 콤마 포함 숫자 ──
  const commaRe = /\b(\d{1,3}(?:,\d{3})+)\b/g
  const commaMatches = Array.from(text.matchAll(commaRe))
  if (commaMatches.length > 0) {
    const vals = commaMatches
      .map((m) => parseNum(m[1]))
      .filter(isValid)
    if (vals.length > 0) return Math.max(...vals)
  }

  // ── 4. Fallback: 연속 숫자 중 최댓값 ──
  const allRe = /\d+/g
  const allNums = Array.from(text.replace(/,/g, "").matchAll(allRe))
    .map((m) => parseInt(m[0], 10))
    .filter(isValid)

  return allNums.length > 0 ? Math.max(...allNums) : 0
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "파일 없음" }, { status: 400 })
    }

    const apiKey = process.env.OCR_SPACE_API_KEY ?? "helloworld"

    const ocrForm = new FormData()
    ocrForm.append("apikey", apiKey)
    ocrForm.append("language", "kor")
    ocrForm.append("detectOrientation", "true")
    ocrForm.append("isTable", "true")          // 표 구조 인식 활성화
    ocrForm.append("scale", "true")            // 해상도 스케일링
    ocrForm.append("OCREngine", "2")           // Engine 2 = 한국어 정확도 향상
    ocrForm.append("file", file, "receipt.jpg")

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: ocrForm,
    })

    if (!res.ok) {
      return NextResponse.json({ text: "", detectedAmount: 0 })
    }

    const json = (await res.json()) as {
      OCRExitCode?: number
      ParsedResults?: { ParsedText: string }[]
      ErrorMessage?: string
    }

    const text =
      json.OCRExitCode === 1
        ? (json.ParsedResults?.[0]?.ParsedText ?? "")
        : ""

    const detectedAmount = detectAmount(text)

    return NextResponse.json({ text, detectedAmount })
  } catch (err) {
    console.error("OCR 오류:", err)
    return NextResponse.json({ text: "", detectedAmount: 0 })
  }
}
