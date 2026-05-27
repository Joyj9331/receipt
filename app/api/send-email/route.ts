import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { generateExcelBuffer } from "@/lib/excel"
import { SavedRecord } from "@/lib/types"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { records: SavedRecord[] }
    const { records } = body

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: "전송할 데이터가 없습니다." },
        { status: 400 }
      )
    }

    const smtpServer = process.env.SMTP_SERVER ?? "smtp.naver.com"
    const smtpPort = parseInt(process.env.SMTP_PORT ?? "587", 10)
    const senderEmail = process.env.SENDER_EMAIL ?? ""
    const senderPassword = process.env.SENDER_PASSWORD ?? ""
    const receiverEmail = process.env.RECEIVER_EMAIL ?? ""

    if (!senderEmail || !senderPassword || !receiverEmail) {
      return NextResponse.json(
        { error: "이메일 설정이 완료되지 않았습니다. 환경변수를 확인해주세요." },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: smtpServer,
      port: smtpPort,
      secure: false,
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
      tls: { rejectUnauthorized: false },
    })

    const excelBuffer = generateExcelBuffer(records)
    const today = new Date().toISOString().slice(0, 10)

    const totalAmount = records
      .reduce((sum, r) => sum + r.amount, 0)
      .toLocaleString("ko-KR")

    const tableRows = records
      .map(
        (r) =>
          `<tr>
            <td style="padding:6px 10px;border:1px solid #ddd;">${r.date}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;">${r.user}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${r.amount.toLocaleString("ko-KR")}원</td>
            <td style="padding:6px 10px;border:1px solid #ddd;">${r.category}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;">${r.note}</td>
          </tr>`
      )
      .join("")

    await transporter.sendMail({
      from: `"새모양 F&B 경비관리 시스템" <${senderEmail}>`,
      to: receiverEmail,
      subject: `⚠️ [법인카드 지출보고] ${today} 경비 내역 (${records.length}건 / 합계 ${totalAmount}원)`,
      html: `
        <div style="font-family: 'Malgun Gothic', sans-serif; max-width:700px; margin:0 auto;">
          <h2 style="color:#1a3a5c; border-bottom:2px solid #1a3a5c; padding-bottom:8px;">
            📑 새모양 F&B 법인카드 지출보고
          </h2>
          <p>안녕하세요, 법인카드 영수증 처리 시스템에서 자동 발송된 지출 내역입니다.</p>
          <p><strong>보고일:</strong> ${today} &nbsp;&nbsp; <strong>건수:</strong> ${records.length}건 &nbsp;&nbsp; <strong>합계:</strong> ${totalAmount}원</p>
          <table style="border-collapse:collapse; width:100%; margin-top:16px;">
            <thead>
              <tr style="background:#1a3a5c; color:white;">
                <th style="padding:8px 10px;border:1px solid #ddd;">날짜</th>
                <th style="padding:8px 10px;border:1px solid #ddd;">사용자</th>
                <th style="padding:8px 10px;border:1px solid #ddd;">금액</th>
                <th style="padding:8px 10px;border:1px solid #ddd;">카테고리</th>
                <th style="padding:8px 10px;border:1px solid #ddd;">비고</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <p style="margin-top:20px; color:#666; font-size:12px;">
            ※ 엑셀 파일이 첨부되어 있습니다. 확인 후 결재 처리 부탁드립니다.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Receipt_Report_${today.replace(/-/g, "")}.xlsx`,
          content: excelBuffer,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("이메일 발송 오류:", err)
    return NextResponse.json(
      { error: "이메일 발송 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
