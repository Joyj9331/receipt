import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

function detectAmount(text: string): number {
  if (!text) return 0
  const clean = text.replace(/,/g, "")
  const numbers = [...clean.matchAll(/\d+/g)]
    .map((m) => parseInt(m[0], 10))
    .filter((n) => n >= 100 && n < 5_000_000)
  if (numbers.length === 0) return 0
  return Math.max(...numbers)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 })
    }

    const apiKey = process.env.OCR_SPACE_API_KEY ?? "helloworld"

    // ocr.space 에 전달할 FormData 구성
    const ocrForm = new FormData()
    ocrForm.append("apikey", apiKey)
    ocrForm.append("language", "kor")
    ocrForm.append("detectOrientation", "true")
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
    }

    const text =
      json.OCRExitCode === 1
        ? (json.ParsedResults?.[0]?.ParsedText ?? "")
        : ""

    return NextResponse.json({
      text,
      detectedAmount: detectAmount(text),
    })
  } catch (err) {
    console.error("OCR 오류:", err)
    return NextResponse.json({ text: "", detectedAmount: 0 })
  }
}
