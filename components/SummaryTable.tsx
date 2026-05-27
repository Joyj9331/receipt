"use client"

import { SavedRecord } from "@/lib/types"

interface Props {
  records: SavedRecord[]
  onDeleteRecord: (id: string) => void
  onClearAll: () => void
}

export default function SummaryTable({ records, onDeleteRecord, onClearAll }: Props) {
  const total = records.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="card">
      <h3 className="section-title">
        <span>
          ▣ 누적 지출 내역
          {records.length > 0 && (
            <span
              style={{
                marginLeft: "8px",
                background: "var(--point-color)",
                color: "#fff",
                borderRadius: "12px",
                padding: "1px 9px",
                fontSize: "0.72em",
                fontWeight: 700,
              }}
            >
              {records.length}건
            </span>
          )}
        </span>
        {records.length > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="total-val">{total.toLocaleString("ko-KR")}원</span>
            <button
              className="ctrl-btn danger"
              style={{ padding: "4px 10px", fontSize: "0.75em" }}
              onClick={() => {
                if (window.confirm("누적 내역을 전체 삭제하시겠습니까?")) onClearAll()
              }}
            >
              전체삭제
            </button>
          </span>
        )}
      </h3>

      {records.length === 0 ? (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            color: "var(--text-sub)",
          }}
        >
          <div style={{ fontSize: "2em", marginBottom: "8px", color: "var(--border-thin)" }}>○</div>
          <p style={{ margin: 0, fontSize: "0.9em" }}>아직 저장된 내역이 없습니다.</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78em" }}>
            영수증을 업로드하고 아래 버튼으로 저장하세요.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: "6px", border: "1px solid var(--border-thin)" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>사용자</th>
                <th>금액(원)</th>
                <th>카테고리</th>
                <th>동반직원</th>
                <th>비고</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr
                  key={r.id}
                  style={{ background: i % 2 === 1 ? "var(--bg-page)" : "#fff" }}
                >
                  <td style={{ whiteSpace: "nowrap" }}>{r.date}</td>
                  <td style={{ fontWeight: 900 }}>{r.user}</td>
                  <td style={{ textAlign: "right", fontWeight: 900, color: "var(--text-main)" }}>
                    {r.amount.toLocaleString("ko-KR")}
                  </td>
                  <td>
                    <span
                      style={{
                        background: "var(--bg-page)",
                        borderRadius: "10px",
                        padding: "2px 10px",
                        fontSize: "0.82em",
                      }}
                    >
                      {r.category}
                    </span>
                  </td>
                  <td
                    style={{
                      color: "var(--text-sub)",
                      maxWidth: "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.companions.length > 0 ? r.companions.join(", ") : "—"}
                  </td>
                  <td
                    style={{
                      color: "var(--text-sub)",
                      maxWidth: "140px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.note || "—"}
                  </td>
                  <td>
                    <button
                      className="ctrl-btn danger"
                      style={{ padding: "3px 8px", fontSize: "0.75em" }}
                      onClick={() => {
                        if (window.confirm("이 항목을 삭제하시겠습니까?"))
                          onDeleteRecord(r.id)
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ textAlign: "left", paddingLeft: "10px" }}>
                  합계 ({records.length}건)
                </td>
                <td style={{ textAlign: "right" }} className="total-val">
                  {total.toLocaleString("ko-KR")}
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
