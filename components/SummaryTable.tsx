"use client"

import { SavedRecord } from "@/lib/types"

interface Props {
  records: SavedRecord[]
  onDeleteRecord: (id: string) => void
  onClearAll: () => void
}

export default function SummaryTable({ records, onDeleteRecord, onClearAll }: Props) {
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="mx-4 mb-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-800">📊 누적 지출 내역</span>
            {records.length > 0 && (
              <span className="bg-brand-700 text-white text-xs px-2 py-0.5 rounded-full">
                {records.length}건
              </span>
            )}
          </div>
          {records.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-brand-700">
                합계 {totalAmount.toLocaleString("ko-KR")}원
              </span>
              <button
                onClick={() => {
                  if (window.confirm("모든 내역을 삭제하시겠습니까?")) {
                    onClearAll()
                  }
                }}
                className="text-xs text-red-400 hover:text-red-600 underline"
              >
                전체삭제
              </button>
            </div>
          )}
        </div>

        {/* 테이블 */}
        {records.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm">아직 저장된 내역이 없습니다.</p>
            <p className="text-xs mt-1">
              영수증을 업로드하고 &quot;테이블에 저장&quot; 버튼을 눌러주세요.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-brand-800 text-white">
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">날짜</th>
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">사용자</th>
                  <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">금액(원)</th>
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">카테고리</th>
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">동반직원</th>
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">비고</th>
                  <th className="px-3 py-2.5 text-center font-medium whitespace-nowrap">삭제</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-brand-50 transition-colors`}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">{r.date}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-medium text-gray-800">{r.user}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-brand-700 whitespace-nowrap">
                      {r.amount.toLocaleString("ko-KR")}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-[120px] truncate">
                      {r.companions.length > 0 ? r.companions.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-[140px] truncate">
                      {r.note || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm("이 항목을 삭제하시겠습니까?")) {
                            onDeleteRecord(r.id)
                          }
                        }}
                        className="text-red-400 hover:text-red-600 text-base"
                        aria-label="삭제"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* 합계 행 */}
              <tfoot>
                <tr className="bg-brand-50 border-t-2 border-brand-200">
                  <td colSpan={2} className="px-3 py-2.5 font-bold text-gray-700">
                    합계 ({records.length}건)
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-brand-700">
                    {totalAmount.toLocaleString("ko-KR")}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
