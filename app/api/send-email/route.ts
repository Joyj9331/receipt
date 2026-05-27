import { NextRequest, NextResponse } from "next/server"
import { generateExcelBuffer } from "@/lib/excel"
import { SavedRecord } from "@/lib/types"

export const runtime = "nodejs"

interface RequestBody {
  records: SavedRecord[]
  receiverEmail: string
  senderName: string
  senderEmail: string
  accessToken?: string   // Google OAuth access token (gmail.send 권한)
  ccEmail?: string
}

/** RFC 2047 인코딩 (한글 헤더 처리) */
function encodeHeader(text: string): string {
  return `=?UTF-8?B?${Buffer.from(text).toString("base64")}?=`
}

/**
 * Gmail API로 이메일 발송
 * - multipart/mixed: HTML 본문 + Excel 첨부
 * - RFC 2822 메시지를 base64url 인코딩하여 전송
 */
async function sendViaGmailAPI(
  accessToken: string,
  opts: {
    from: string
    fromName: string
    to: string
    cc?: string
    subject: string
    htmlBody: string
    excelBuffer: Buffer
    fileName: string
  }
): Promise<{ ok: boolean; error?: string }> {
  const boundary = `_boundary_${Date.now()}_`

  const lines: string[] = [
    `MIME-Version: 1.0`,
    `From: ${encodeHeader(opts.fromName)} <${opts.from}>`,
    `To: ${opts.to}`,
  ]
  if (opts.cc) lines.push(`Cc: ${opts.cc}`)
  lines.push(
    `Subject: ${encodeHeader(opts.subject)}`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="utf-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(opts.htmlBody, "utf-8").toString("base64"),
    ``,
    `--${boundary}`,
    `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
    `Content-Disposition: attachment; filename="${opts.fileName}"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    opts.excelBuffer.toString("base64"),
    ``,
    `--${boundary}--`,
  )

  const raw = Buffer.from(lines.join("\r\n"), "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  )

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: { message?: string } }
    return { ok: false, error: err?.error?.message ?? `Gmail API 오류 (${response.status})` }
  }
  return { ok: true }
}

/** HTML 이메일 본문 생성 */
function buildHtmlBody(
  senderName: string,
  senderEmail: string,
  records: SavedRecord[]
): string {
  const today = new Date().toLocaleDateString("ko-KR")
  const total = records.reduce((s, r) => s + r.amount, 0)

  const rows = records
    .map(
      (r, i) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#faf9f7"}">
        <td style="padding:8px 10px;border:1px solid #e5e3df;">${r.date}</td>
        <td style="padding:8px 10px;border:1px solid #e5e3df;font-weight:700;">${r.user}</td>
        <td style="padding:8px 10px;border:1px solid #e5e3df;text-align:right;font-weight:700;">${r.amount.toLocaleString("ko-KR")}</td>
        <td style="padding:8px 10px;border:1px solid #e5e3df;">${r.category}</td>
        <td style="padding:8px 10px;border:1px solid #e5e3df;color:#57534e;">${r.note || "—"}</td>
      </tr>`
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Malgun Gothic',sans-serif;margin:0;padding:20px;background:#F5F4F1;color:#1c1917;">
  <div style="max-width:680px;margin:0 auto;background:#FDFBF7;border:1px solid #d6d3d1;border-radius:8px;overflow:hidden;">
    <div style="padding:20px 24px;border-bottom:4px double #292524;">
      <h2 style="margin:0;font-size:1.3em;font-weight:900;letter-spacing:-0.03em;">
        📑 새모양 F&amp;B 법인카드 지출보고
      </h2>
    </div>
    <div style="padding:20px 24px;">
      <p style="margin:0 0 4px 0;">보고일: <strong>${today}</strong> &nbsp;|&nbsp; 건수: <strong>${records.length}건</strong> &nbsp;|&nbsp; 합계: <strong style="color:#be123c;">${total.toLocaleString("ko-KR")}원</strong></p>
      <p style="margin:0 0 16px 0;color:#57534e;font-size:0.88em;">작성자: ${senderName} (${senderEmail})</p>

      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.9em;">
          <thead>
            <tr style="background:#1c1917;color:#fff;">
              <th style="padding:10px;border:1px solid #292524;text-align:center;">날짜</th>
              <th style="padding:10px;border:1px solid #292524;text-align:center;">사용자</th>
              <th style="padding:10px;border:1px solid #292524;text-align:right;">금액(원)</th>
              <th style="padding:10px;border:1px solid #292524;text-align:center;">카테고리</th>
              <th style="padding:10px;border:1px solid #292524;text-align:center;">비고</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#F5F4F1;border-top:2px solid #292524;">
              <td colspan="2" style="padding:10px;border:1px solid #d6d3d1;font-weight:900;">합계 (${records.length}건)</td>
              <td style="padding:10px;border:1px solid #d6d3d1;text-align:right;font-weight:900;color:#be123c;">${total.toLocaleString("ko-KR")}</td>
              <td colspan="2" style="border:1px solid #d6d3d1;"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p style="margin:20px 0 0;font-size:0.8em;color:#57534e;">
        ※ 엑셀 파일이 첨부되어 있습니다. 확인 후 결재 처리 부탁드립니다.
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody
    const { records, receiverEmail, senderName, senderEmail, accessToken, ccEmail } = body

    if (!records?.length) {
      return NextResponse.json({ error: "전송할 데이터가 없습니다." }, { status: 400 })
    }
    if (!receiverEmail) {
      return NextResponse.json({ error: "수신자 이메일이 없습니다." }, { status: 400 })
    }
    if (!accessToken) {
      return NextResponse.json(
        { error: "Gmail 발송 권한이 없습니다. Google 계정으로 다시 로그인해주세요." },
        { status: 401 }
      )
    }

    const excelBuffer = generateExcelBuffer(records)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const total = records.reduce((s, r) => s + r.amount, 0)
    const subject = `[법인카드 지출보고] ${new Date().toLocaleDateString("ko-KR")} · ${records.length}건 · ${total.toLocaleString("ko-KR")}원`

    const result = await sendViaGmailAPI(accessToken, {
      from: senderEmail,
      fromName: senderName,
      to: receiverEmail,
      cc: ccEmail || undefined,
      subject,
      htmlBody: buildHtmlBody(senderName, senderEmail, records),
      excelBuffer,
      fileName: `Receipt_Report_${today}.xlsx`,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("이메일 발송 오류:", err)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
