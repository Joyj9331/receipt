import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { generateExcelBuffer } from "@/lib/excel"
import { SavedRecord } from "@/lib/types"

export const runtime = "nodejs"

interface RequestBody {
  records: SavedRecord[]
  receiverEmail: string
  ccEmail?: string
  senderName: string   // 로그인한 사용자 이름 (표시용)
  senderEmail: string  // 로그인한 사용자 이메일 (Reply-To용)
}

function buildHtmlBody(senderName: string, senderEmail: string, records: SavedRecord[]): string {
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
              <th style="padding:10px;border:1px solid #292524;">날짜</th>
              <th style="padding:10px;border:1px solid #292524;">사용자</th>
              <th style="padding:10px;border:1px solid #292524;text-align:right;">금액(원)</th>
              <th style="padding:10px;border:1px solid #292524;">카테고리</th>
              <th style="padding:10px;border:1px solid #292524;">비고</th>
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
    const { records, receiverEmail, ccEmail, senderName, senderEmail } = body

    if (!records?.length) {
      return NextResponse.json({ error: "전송할 데이터가 없습니다." }, { status: 400 })
    }
    if (!receiverEmail) {
      return NextResponse.json({ error: "수신자 이메일이 없습니다." }, { status: 400 })
    }

    const smtpServer   = process.env.SMTP_SERVER   ?? "smtp.naver.com"
    const smtpPort     = parseInt(process.env.SMTP_PORT ?? "587", 10)
    const smtpUser     = process.env.SMTP_USER     ?? ""
    const smtpPassword = process.env.SMTP_PASSWORD ?? ""

    if (!smtpUser || !smtpPassword) {
      return NextResponse.json(
        { error: "이메일 서버 설정이 완료되지 않았습니다. Vercel 환경변수(SMTP_USER, SMTP_PASSWORD)를 확인하세요." },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: smtpServer,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPassword },
      tls: { rejectUnauthorized: false },
    })

    const excelBuffer = generateExcelBuffer(records)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const total = records.reduce((s, r) => s + r.amount, 0)
    const subject = `[법인카드 지출보고] ${new Date().toLocaleDateString("ko-KR")} · ${records.length}건 · ${total.toLocaleString("ko-KR")}원 — ${senderName}`

    await transporter.sendMail({
      from: `"새모양 F&B 경비관리" <${smtpUser}>`,
      replyTo: senderEmail ? `"${senderName}" <${senderEmail}>` : undefined,
      to: receiverEmail,
      cc: ccEmail || undefined,
      subject,
      html: buildHtmlBody(senderName, senderEmail, records),
      attachments: [
        {
          filename: `Receipt_Report_${today}.xlsx`,
          content: excelBuffer,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("이메일 발송 오류:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
