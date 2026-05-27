"use client"

import { useSession, signOut } from "next-auth/react"
import Image from "next/image"

interface Props {
  onSettings: () => void
  fontSize: number
  onFontSize: (n: number) => void
}

export default function Header({ onSettings, fontSize, onFontSize }: Props) {
  const { data: session } = useSession()

  const changeFont = (delta: number) => {
    const next = Math.min(30, Math.max(14, fontSize + delta))
    onFontSize(next)
  }

  return (
    <header className="app-header">
      {/* 좌측: 타이틀 */}
      <div>
        <h1>📑 새모양 F&amp;B</h1>
        <div className="app-header-sub">법인카드 경비관리 시스템</div>
      </div>

      {/* 우측: 컨트롤 */}
      <div className="header-controls">
        {/* 폰트 크기 */}
        <button className="ctrl-btn" onClick={() => changeFont(-2)}>가-</button>
        <button className="ctrl-btn" onClick={() => changeFont(0)}>기본</button>
        <button className="ctrl-btn" onClick={() => changeFont(2)}>가+</button>

        {/* 설정 */}
        <button className="ctrl-btn" onClick={onSettings} title="이메일 발송 설정">
          ⚙️
        </button>

        {/* 사용자 프로필 */}
        {session?.user && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? ""}
                width={28}
                height={28}
                className="rounded-full"
                style={{ borderRadius: "50%", border: "1px solid var(--border-thin)" }}
                unoptimized
              />
            ) : (
              <span style={{ fontSize: "1.3em" }}>👤</span>
            )}
            <button
              className="ctrl-btn danger"
              onClick={() => signOut({ callbackUrl: "/" })}
              title={`${session.user.name ?? ""} — 로그아웃`}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
