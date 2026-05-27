import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const raw = process.env.STAFF_LIST ?? ""
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  return NextResponse.json({ staff: list })
}
