"use client"

import { useSession, signOut } from "next-auth/react"

interface Props {
  onSettings: () => void
  fontSize: number
  onFontSize: (n: number) => void
}

export default function Header({ onSettings, fontSize, onFontSize }: Props) {
  const { data: session } = useSession()

  return (
    <header className="app-header">
      {/* 좌측: 타이틀 */}
      <div style={{ minWidth: 0 }}>
        <h1 style={{ whiteSpace: "nowrap" }}>▣ 새모양 F&amp;B</h1>
        <div className="app-header-sub">법인카드 경비관리</div>
      </div>

      {/* 우측: 컨트롤 — flex-wrap 제거, 버튼 최소화 */}
      <div className="header-controls">
        <button className="ctrl-btn" onClick={() => onFontSize(-2)} title="글자 작게">가-</button>
        <button className="ctrl-btn" onClick={() => onFontSize(2)}  title="글자 크게">가+</button>
        <button className="ctrl-btn" onClick={onSettings} title="설정">≡</button>
        {session?.user && (
          <button
            className="ctrl-btn danger"
            onClick={() => signOut({ callbackUrl: "/" })}
            title={session.user.name ?? "로그아웃"}
          >
            나가기
          </button>
        )}
      </div>
    </header>
  )
}
